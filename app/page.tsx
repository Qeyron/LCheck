'use client';

import { useState } from 'react';
import AddressInput from '@/components/AddressInput';
import ResultsTable from '@/components/ResultsTable';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProgressBar from '@/components/ProgressBar';
import { ToastContainer, useToast } from '@/components/Toast';
import { ValidationStats, AddressResult } from '@/types';
import { checkAddressesBatch, APIError, getErrorMessage } from '@/lib/api';
import { USE_MOCK_RESULTS } from '@/lib/mockData';

export default function Home() {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [validationStats, setValidationStats] = useState<ValidationStats>({
    valid: 0,
    duplicates: 0,
    invalid: 0,
    invalidAddresses: []
  });
  const [results, setResults] = useState<AddressResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [checkStartTime, setCheckStartTime] = useState<number | null>(null);

  const toast = useToast();

  const handleAddressesChange = (newAddresses: string[], stats: ValidationStats) => {
    setAddresses(newAddresses);
    setValidationStats(stats);
    
    if (results.length > 0 && newAddresses.length === 0) {
      setResults([]);
    }
  };

  const handleCheck = async () => {
    if (addresses.length === 0) {
      toast.warning('No addresses to check', 'Please add addresses to check');
      return;
    }

    if (addresses.length > 1000) {
      toast.error('Too many addresses', 'Maximum 1000 addresses per request');
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setCheckStartTime(Date.now());
    setResults([]);
    try {
      setProgress(10);

      const checkResults = await checkAddressesBatch(addresses, {
        useMock: USE_MOCK_RESULTS,
        timeout: 60000,
        retries: 3
      });

      setProgress(90);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress(100);
      setResults(checkResults);

      const eligibleCount = checkResults.filter(r => r.eligible === true).length;
      const errorCount = checkResults.filter(r => r.error).length;
      
      let message = `Checked ${checkResults.length} addresses.`;
      if (eligibleCount > 0) {
        message += ` Eligible: ${eligibleCount}.`;
      }
      if (errorCount > 0) {
        message += ` Errors: ${errorCount}.`;
      }

      if (checkStartTime && process.env.NODE_ENV === 'development') {
        const duration = Date.now() - checkStartTime;
        console.log(`Check completed in ${duration}ms for ${addresses.length} addresses`);
      }

    } catch (error) {
      console.error('Check failed:', error);
      
      const errorMessage = getErrorMessage(error);
      let title = 'Ошибка при проверке';
      let details = errorMessage;

      if (error instanceof APIError) {
        switch (error.code) {
          case 'TIMEOUT':
            title = 'Request timed out';
            details = 'Try checking fewer addresses or try again later.';
            break;
          case 'NETWORK_ERROR':
            title = 'Network error';
            details = 'Check your internet connection and try again.';
            break;
          case 'TOO_MANY_ADDRESSES':
            title = 'Too many addresses';
            details = 'Maximum 1000 addresses per request';
            break;
          case 'HTTP_429':
            title = 'Rate limit exceeded';
            details = 'Please wait a moment before trying again.';
            break;
          case 'HTTP_503':
            title = 'Service temporarily unavailable';
            details = 'Please try again in a few minutes.';
            break;
          default:
            title = 'API error';
        }
      }      

      toast.error(title, details);
      
      if (results.length > 0) {
        toast.info('Partial results', 'Showing the results obtained before the error');
      }

    } finally {
      setIsLoading(false);
      setProgress(0);
      setCheckStartTime(null);
    }
  };

  const handleClear = () => {
    setAddresses([]);
    setValidationStats({
      valid: 0,
      duplicates: 0,
      invalid: 0,
      invalidAddresses: []
    });
    setResults([]);
    setProgress(0);
    setCheckStartTime(null);
    
};

const getProgressMessage = () => {
  if (progress < 20) return 'Preparing request...';
  if (progress < 50) return 'Sending data...';
  if (progress < 80) return 'Checking addresses...';
  if (progress < 95) return 'Processing results...';
  return 'Finishing up...';
};

const getProgressSubMessage = () => {
  if (checkStartTime) {
    const elapsed = Math.floor((Date.now() - checkStartTime) / 1000);
    return `Checked ${addresses.length} addresses • ${elapsed}s`;
  }
  return USE_MOCK_RESULTS ? 'Demo mode (mock data)' : 'Connecting to the Linea API';
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <Header />
      
      <main className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-sm font-medium mb-6">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
          {USE_MOCK_RESULTS ? 'Demo mode' : 'Official Linea Airdrop Check >>> https://linea.build/hub/airdrop'}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Linea Airdrop Bulk Checker
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Check multiple Ethereum addresses at once for Linea airdrop eligibility.
          Fast, secure, and free.
        </p>
      </div>

        <div className="space-y-8">
          {/* Input Section */}
          {!isLoading && (
            <div className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
              <AddressInput
                onAddressesChange={handleAddressesChange}
                validationStats={validationStats}
                isLoading={isLoading}
                onCheck={handleCheck}
                onClear={handleClear}
              />
            </div>
          )}

          {/* Progress Section */}
          {isLoading && (
            <div className="flex justify-center">
              <ProgressBar 
                isActive={isLoading}
                progress={progress}
                message={getProgressMessage()}
                subMessage={getProgressSubMessage()}
              />
            </div>
          )}

          {/* Results Section */}
          {results.length > 0 && !isLoading && (
            <div className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
              <ResultsTable results={results} />
            </div>
          )}

        </div>
      </main>

      <Footer />
      
      {/* Toast Notifications */}
      <ToastContainer messages={toast.messages} onClose={toast.removeToast} />
    </div>
  );
}
