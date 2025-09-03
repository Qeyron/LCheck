import { NextRequest, NextResponse } from "next/server";
import { keccak_256 } from "js-sha3";

export const runtime = "edge";

const RPC_URL = process.env.LINEA_RPC_URL || "";
const CONTRACT = (process.env.ELIG_CONTRACT || "").toLowerCase();
const SELECTOR = (process.env.ELIG_FUNC_SELECTOR || "").toLowerCase();
const MODE = (process.env.ELIG_ARG_MODE || "auto").toLowerCase();
const CONCURRENCY = Number(process.env.LINEA_CONCURRENCY || 5);

const addrRe = /^0x[0-9a-f]{40}$/i;
const norm = (a: string) => a.trim().toLowerCase();
const hexBI = (h: string) => (!h || h === "0x" ? 0n : BigInt(h));

const pad32 = (hexNo0x: string) => hexNo0x.toLowerCase().padStart(64, "0");

const calldata_address = (selector: string, address: string) => {
  const sel = selector.startsWith("0x") ? selector.slice(2) : selector;
  const addr = (address.startsWith("0x") ? address.slice(2) : address);
  return "0x" + sel + pad32(addr);
};

const calldata_bytes32 = (selector: string, address: string) => {
  const sel = selector.startsWith("0x") ? selector.slice(2) : selector;
  const addr = (address.startsWith("0x") ? address.slice(2) : address);
  const leaf = keccak_256(Buffer.from(addr, "hex"));
  return "0x" + sel + leaf;
};

function decodeEligibility(resultHex: string) {
  const raw = resultHex.startsWith("0x") ? resultHex.slice(2) : resultHex;
  if (raw.length < 64) return { eligible: false, raw: resultHex };

  const w1 = "0x" + raw.slice(0, 64);
  const w2 = raw.length >= 128 ? "0x" + raw.slice(64, 128) : null;

  const n1 = hexBI(w1);
  const n2 = w2 ? hexBI(w2) : 0n;

  if (!w2) {
    if (n1 === 0n) return { eligible: false, raw: resultHex };
    if (n1 === 1n) return { eligible: true, raw: resultHex };
    return { eligible: n1 > 0n, amount: n1.toString(), raw: resultHex };
  } else {
    if (n1 === 0n || n1 === 1n) {
      return { eligible: n1 === 1n, amount: n2 > 0n ? n2.toString() : undefined, raw: resultHex };
    }
    if (n2 === 0n || n2 === 1n) {
      return { eligible: n2 === 1n, amount: n1 > 0n ? n1.toString() : undefined, raw: resultHex };
    }
    const amount = (n1 > n2 ? n1 : n2).toString();
    return { eligible: n1 > 0n || n2 > 0n, amount, raw: resultHex };
  }
}

type CallParams = { to: string; data: string; from?: string };

async function rpcEthCall(params: CallParams): Promise<string> {
  const body = { jsonrpc: "2.0", id: 1, method: "eth_call", params: [params, "latest"] };
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  const j = await res.json().catch(() => ({} as any));
  if (!res.ok || j?.error) {
    const code = j?.error?.code ?? res.status;
    const msg = j?.error?.message || `RPC HTTP ${res.status}`;
    const data: string | undefined = j?.error?.data;
    const isRevert =
      code === -32000 || /revert/i.test(String(msg)) || (typeof data === "string" && data.startsWith("0x"));
    const err = new Error(isRevert ? "REVERT" : `${code}: ${msg}`);
    (err as any).__isRevert = isRevert;
    (err as any).__rpc = { code, msg, data };
    throw err;
  }
  if (!j?.result) throw new Error("Empty result");
  return j.result as string;
}

async function tryMode(address: string, mode: "address" | "sender" | "bytes32") {
  if (mode === "address") {
    const data = calldata_address(SELECTOR, address);
    const hex = await rpcEthCall({ to: CONTRACT, data });
    return decodeEligibility(hex);
  }
  if (mode === "sender") {
    const hex = await rpcEthCall({ to: CONTRACT, data: SELECTOR, from: address });
    return decodeEligibility(hex);
  }
  {
    const data = calldata_bytes32(SELECTOR, address);
    const hex = await rpcEthCall({ to: CONTRACT, data });
    return decodeEligibility(hex);
  }
}

async function checkOne(address: string) {
  if (!RPC_URL || !CONTRACT || !SELECTOR) throw new Error("Missing env (RPC/CONTRACT/SELECTOR)");

  const order: ("address" | "sender" | "bytes32")[] =
    MODE === "auto" ? ["address", "sender", "bytes32"] : [MODE as any];

  let lastErr: any = null;
  for (const m of order) {
    try {
      return await tryMode(address, m);
    } catch (e: any) {
      lastErr = e;
      if (!e?.__isRevert && MODE !== "auto") break;
    }
  }
  if (lastErr?.__isRevert) return { eligible: false };
  return { error: lastErr?.message || String(lastErr) };
}

export async function POST(req: NextRequest) {
  try {
    const { addresses } = (await req.json().catch(() => ({}))) as { addresses?: string[] };
    if (!Array.isArray(addresses) || !addresses.length)
      return NextResponse.json({ success: false, error: { message: "addresses[] is required" } }, { status: 400 });

    const list = [...new Set(addresses.map(norm))];
    const invalid = list.filter((a) => !addrRe.test(a));
    if (invalid.length) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid addresses", details: { invalid: invalid.slice(0, 5) } } },
        { status: 400 }
      );
    }

    const q = list.slice();
    const results: Record<string, { eligible?: boolean; amount?: string; error?: string; raw?: string }> = {};

    const workers = Array.from({ length: Math.max(1, CONCURRENCY) }, async () => {
      while (q.length) {
        const addr = q.shift()!;
        try {
          results[addr] = await checkOne(addr);
        } catch (e: any) {
          results[addr] = { error: e?.message || String(e) };
          await new Promise((r) => setTimeout(r, 120));
        }
      }
    });

    await Promise.all(workers);
    return NextResponse.json({ success: true, results }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: { message: e?.message || "Internal error" } }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: { message: "Method not allowed" } }, { status: 405 });
}
