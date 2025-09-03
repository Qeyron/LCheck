import { AddressResult } from '@/types';
import { formatLinea } from '@/lib/format';

export interface CSVExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  dateFormat?: 'iso' | 'readable';
}

export function generateCSV(results: AddressResult[], options: CSVExportOptions = {}): string {
  const { includeHeaders = true, dateFormat = 'iso' } = options;

  const headers = ['address', 'eligible', 'amount', 'error', 'checked_at'];
  const timestamp = dateFormat === 'iso'
    ? new Date().toISOString()
    : new Date().toLocaleString('ru-RU');

  const rows: string[] = [];
  if (includeHeaders) rows.push(headers.join(','));

  results.forEach((r) => {
    const row = [
      `"${r.address}"`,
      r.eligible !== undefined ? String(r.eligible) : '',
      r.amount ? `"${formatLinea(r.amount, 0)}"` : '', 
      r.error ? `"${r.error.replace(/"/g, '""')}"` : '',
      `"${timestamp}"`
    ];
    rows.push(row.join(','));
  });

  return rows.join('\n');
}

export function downloadCSV(
  results: AddressResult[], 
  options: CSVExportOptions = {}
): void {
  const {
    filename = `linea-airdrop-results-${new Date().toISOString().split('T')[0]}.csv`
  } = options;

  const csvContent = generateCSV(results, options);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function copyEligibleAddresses(results: AddressResult[]): string {
  const eligibleAddresses = results
    .filter(result => result.eligible === true)
    .map(result => result.address);

  const addressList = eligibleAddresses.join('\n');
  
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(addressList).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
  } else {
    const textArea = document.createElement('textarea');
    textArea.value = addressList;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }

  return addressList;
}

export function parseCSVFile(csvContent: string): string[] {
  const lines = csvContent.split('\n');
  const addresses: string[] = [];
  
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    
    const cells = line.split(',').map(cell => 
      cell.trim().replace(/^["']|["']$/g, '')
    );
    
    cells.forEach(cell => {
      if (cell.match(/^0x[0-9a-f]{40}$/i)) {
        addresses.push(cell);
      }
    });
  });
  
  return addresses;
}
