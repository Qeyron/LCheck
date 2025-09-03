import { AddressResult, BatchResult } from '@/types';

export const USE_MOCK_RESULTS =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_USE_MOCK === 'true') || false;

export const API_URL = '/api/linea/batch';


const MOCK_AMOUNTS = ['0', '123.45', '456.78', '789.12', '1000', '2500.5', '5000'];
const MOCK_ERRORS = [
  'Network timeout',
  'Invalid address format',
  'Rate limit exceeded',
  'Service temporarily unavailable',
  'Address not found in registry'
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateMockResult(address: string): BatchResult {
  const random = Math.random();
  
  if (random < 0.1) {
    return {
      error: getRandomElement(MOCK_ERRORS)
    };
  }
  
  const eligible = random < 0.7;
  
  if (eligible) {
    return {
      eligible: true,
      amount: getRandomElement(MOCK_AMOUNTS.filter(amount => amount !== '0'))
    };
  } else {
    return {
      eligible: false,
      amount: '0'
    };
  }
}

export function generateMockBatchResponse(addresses: string[]): { results: Record<string, BatchResult> } {
  const results: Record<string, BatchResult> = {};
  
  addresses.forEach(address => {
    results[address] = generateMockResult(address);
  });
  
  return { results };
}

export function convertBatchResponseToResults(
  addresses: string[], 
  batchResponse: { results: Record<string, BatchResult> }
): AddressResult[] {
  return addresses.map(address => ({
    address,
    ...batchResponse.results[address]
  }));
}

export function simulateApiDelay(minMs: number = 1000, maxMs: number = 3000): Promise<void> {
  const delay = Math.random() * (maxMs - minMs) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}

export function generateRealisticMockData(addresses: string[]): AddressResult[] {
  return addresses.map((address, index) => {
    const addressNum = parseInt(address.slice(-4), 16) || index;
    
    let eligible: boolean | undefined;
    let amount: string | undefined;
    let error: string | undefined;
    
    if (addressNum % 7 === 0 || addressNum % 11 === 0) {
      eligible = true;
      amount = getRandomElement(['1000', '2500.5', '5000', '7500.25']);
    }
    else if (addressNum % 23 === 0) {
      error = getRandomElement(MOCK_ERRORS);
    }
    else {
      eligible = Math.random() > 0.4;
      if (eligible) {
        amount = getRandomElement(['123.45', '456.78', '789.12']);
      } else {
        amount = '0';
      }
    }
    
    return {
      address,
      eligible,
      amount,
      error
    };
  });
}
