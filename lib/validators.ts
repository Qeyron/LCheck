export interface ValidationStats {
  valid: number;
  duplicates: number;
  invalid: number;
  invalidAddresses: string[];
}

export interface ParsedAddresses {
  validAddresses: string[];
  stats: ValidationStats;
}

const ETHEREUM_ADDRESS_REGEX = /^0x[0-9a-f]{40}$/i;

export function parseAndValidateAddresses(text: string): ParsedAddresses {
  if (!text || text.trim() === '') {
    return {
      validAddresses: [],
      stats: {
        valid: 0,
        duplicates: 0,
        invalid: 0,
        invalidAddresses: []
      }
    };
  }

  const rawAddresses = text
    .split(/[\s,;\n\r\t]+/)
    .map(addr => addr.trim())
    .filter(addr => addr.length > 0)
    .filter(addr => addr !== '');

  const validAddresses: string[] = [];
  const invalidAddresses: string[] = [];
  const addressSet = new Set<string>();
  let duplicates = 0;

  rawAddresses.forEach(addr => {
    const normalized = addr.toLowerCase();
    
    if (!ETHEREUM_ADDRESS_REGEX.test(normalized)) {
      invalidAddresses.push(addr);
      return;
    }

    if (addressSet.has(normalized)) {
      duplicates++;
      return;
    }

    addressSet.add(normalized);
    validAddresses.push(normalized);
  });

  const stats: ValidationStats = {
    valid: validAddresses.length,
    duplicates,
    invalid: invalidAddresses.length,
    invalidAddresses
  };

  return { validAddresses, stats };
}

export function validateSingleAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  const normalized = address.trim().toLowerCase();
  return ETHEREUM_ADDRESS_REGEX.test(normalized);
}

export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

export function generateExampleAddresses(): string[] {
  return [
    '0x1234567890123456789012345678901234567890',
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    '0x1111111111111111111111111111111111111111',
    '0x2222222222222222222222222222222222222222',
    '0x3333333333333333333333333333333333333333',
    '0x4444444444444444444444444444444444444444',
    '0x5555555555555555555555555555555555555555',
  ];
}
