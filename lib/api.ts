import { CheckRequest, CheckResponse, AddressResult } from '@/types';
import { generateRealisticMockData, simulateApiDelay, USE_MOCK_RESULTS, API_URL } from '@/lib/mockData';

export class APIError extends Error {
  code?: string;
  details?: any;

  constructor(message: string, code?: string, details?: any) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.details = details;
  }
}

export interface CheckOptions {
  timeout?: number;
  retries?: number;
  useMock?: boolean;
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries: number = 2
): Promise<Response> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.signal ? 30000 : 30000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;

    } catch (error: any) {
      lastError = error;
      
      if (attempt < maxRetries && !error.name?.includes('Abort')) {
        // Exponential backoff
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await delay(backoffDelay);
        continue;
      }
      
      break;
    }
  }

  throw lastError!;
}

export async function checkAddressesBatch(
  addresses: string[], 
  options: CheckOptions = {}
): Promise<AddressResult[]> {
  const { 
    timeout = 30000, 
    retries = 2, 
    useMock = USE_MOCK_RESULTS 
  } = options;

  // Validate input
  if (!addresses || addresses.length === 0) {
    throw new APIError('No addresses provided', 'INVALID_INPUT');
  }

  if (addresses.length > 1000) {
    throw new APIError('Too many addresses. Maximum 1000 per request', 'TOO_MANY_ADDRESSES');
  }

  // Use mock data if enabled
  if (useMock) {
    console.log('Using mock data for', addresses.length, 'addresses');
    
    // Simulate API delay
    await simulateApiDelay(1500, 3000);
    
    return generateRealisticMockData(addresses);
  }

  // Make real API call
  try {
    const request: CheckRequest = { addresses };
    
    const response = await fetchWithRetry(
      API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      },
      retries
    );

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
        errorDetails = errorData.error?.details;
      } catch {
        // Ignore JSON parsing errors for error responses
      }

      throw new APIError(errorMessage, `HTTP_${response.status}`, errorDetails);
    }

    const data: CheckResponse = await response.json();

    if (!data.success) {
      throw new APIError(
        data.error?.message || 'Unknown API error', 
        data.error?.code || 'API_ERROR',
        data.error?.details
      );
    }

    // Convert to AddressResult format
    const results: AddressResult[] = addresses.map(address => ({
      address,
      ...data.results[address]
    }));

    return results;

  } catch (error: any) {
    if (error instanceof APIError) {
      throw error;
    }

    // Handle network errors
    if (error.name === 'AbortError') {
      throw new APIError('Request timeout', 'TIMEOUT');
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new APIError('Network error. Please check your connection', 'NETWORK_ERROR');
    }

    // Generic error
    throw new APIError(
      error.message || 'Unknown error occurred',
      'UNKNOWN_ERROR'
    );
  }
}

export function validateAddressFormat(address: string): boolean {
  const regex = /^0x[0-9a-f]{40}$/i;
  return regex.test(address);
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}
