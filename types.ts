export interface ValidationStats {
  valid: number;
  duplicates: number;
  invalid: number;
  invalidAddresses: string[];
}

export interface BatchResult {
  eligible?: boolean;
  amount?: string;
  error?: string;
}

export interface BatchResponse {
  results: Record<string, BatchResult>;
}

export interface AddressResult {
  address: string;
  eligible?: boolean;
  amount?: string;
  error?: string;
}

export type FilterType = 'all' | 'eligible' | 'not-eligible' | 'errors';

export interface APIError {
  message: string;
  code?: string;
  details?: any;
}

export interface CheckRequest {
  addresses: string[];
}

export interface CheckResponse {
  results: Record<string, BatchResult>;
  success: boolean;
  error?: APIError;
}
