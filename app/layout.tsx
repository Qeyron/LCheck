import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: [{ path: "./fonts/GeistVF.woff", style: "normal" }],
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
  fallback: [
    "Inter",
    "system-ui",
    "Segoe UI",
    "Roboto",
    "Arial",
    "Helvetica",
    "Apple Color Emoji",
    "Segoe UI Emoji",
    "Noto Color Emoji"
  ],
});

const geistMono = localFont({
  src: [{ path: "./fonts/GeistMonoVF.woff", style: "normal" }],
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
});

export const metadata: Metadata = {
  title: {
    default: "Linea Checker by Qeyron",
    template: "%s · Qeyron",
  },
  description: "Verification of addresses in the Linea network (eligibility, amounts, etc.)",
  metadataBase: new URL("https://qeyron.com"),
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
