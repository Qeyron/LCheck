'use client';

import { useState, useMemo } from 'react';
import { AddressResult, FilterType } from '@/types';
import { downloadCSV, copyEligibleAddresses } from '@/lib/csv';
import { useToast } from '@/components/Toast';
import { formatLinea } from '@/lib/format';

interface ResultsTableProps {
  results: AddressResult[];
}

export default function ResultsTable({ results }: ResultsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const itemsPerPage = 50;
  
  const toast = useToast();

  const filteredResults = useMemo(() => {
    let filtered = results;

    if (searchTerm) {
      filtered = filtered.filter(result =>
        result.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filter !== 'all') {
      filtered = filtered.filter(result => {
        if (filter === 'eligible') return result.eligible === true;
        if (filter === 'not-eligible') return result.eligible === false;
        if (filter === 'errors') return result.error;
        return true;
      });
    }

    return filtered;
  }, [results, filter, searchTerm]);

  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredResults.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredResults, currentPage]);

  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);

  const stats = useMemo(() => {
    const eligible = results.filter(r => r.eligible === true).length;
    const notEligible = results.filter(r => r.eligible === false).length;
    const errors = results.filter(r => r.error).length;
    
    return { eligible, notEligible, errors, total: results.length };
  }, [results]);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      downloadCSV(results, {
        filename: `linea-airdrop-results-${new Date().toISOString().split('T')[0]}.csv`,
        includeHeaders: true,
        dateFormat: 'readable'
      });
      
      toast.success('Export complete', `A file with ${results.length} results has been saved`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Export error', 'Failed to save the CSV file');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyEligible = async () => {
    try {
      const eligibleCount = results.filter(r => r.eligible === true).length;
      
      if (eligibleCount === 0) {
        toast.warning('No eligible addresses', 'No eligible addresses found');
        return;
      }
      
      copyEligibleAddresses(results);
      setCopySuccess(true);
      
      toast.success('Addresses copied', `${eligibleCount} eligible addresses have been copied to the clipboard`);
      
      setTimeout(() => setCopySuccess(false), 3000);
      
    } catch (error) {
      console.error('Error copying addresses:', error);
      toast.error('Copy error', 'Failed to copy addresses to the clipboard');
    }
  };

  const handleExportCSV_Button = () => {
    return (
      <button
        onClick={handleExportCSV}
        disabled={isExporting}
        className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
          isExporting
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
        }`}
      >
        {isExporting ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Exporting...</span>
          </div>
        ) : (
          'Download CSV'
        )}
      </button>
    );
  };

  const handleCopyEligible_Button = () => {
    return (
      <button
        onClick={handleCopyEligible}
        className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
          copySuccess
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
            : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white'
        }`}
        disabled={stats.eligible === 0}
      >
        {copySuccess ? 'Copied!' : 'Copy eligible'}
      </button>
    );
  };

  const getStatusBadge = (result: AddressResult) => {
    if (result.error) {
      return (
        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full border border-red-200 dark:border-red-800">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
          Error
        </span>
      );
    }
    if (result.eligible === true) {
      return (
        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full border border-green-200 dark:border-green-800">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Eligible
        </span>
      );
    }
    if (result.eligible === false) {
      return (
        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 rounded-full border border-gray-200 dark:border-gray-800">
          <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
          Not eligible
        </span>
      );
    }
    return null;
  };

  const formatAmount = (wei?: string) => (wei && wei !== '0' ? formatLinea(wei, 0) : '—');

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Check results
          </h3>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 mb-6 border border-green-200/50 dark:border-green-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Addresses checked: {stats.total}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Eligible: <span className="font-medium text-green-600 dark:text-green-400">{stats.eligible}</span> • 
                  Not eligible: <span className="font-medium text-gray-600 dark:text-gray-400">{stats.notEligible}</span> • 
                  Errors: <span className="font-medium text-red-600 dark:text-red-400">{stats.errors}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.total > 0 ? ((stats.eligible / stats.total) * 100).toFixed(1) : '0'}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Successful</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm rounded-xl font-medium transition-all duration-200 ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
              }`}
            >
              All ({results.length})
            </button>
            <button
              onClick={() => setFilter('eligible')}
              className={`px-4 py-2 text-sm rounded-xl font-medium transition-all duration-200 ${
                filter === 'eligible'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
              }`}
            >
             ✔︎ Eligible ({stats.eligible})
            </button>
            <button
              onClick={() => setFilter('not-eligible')}
              className={`px-4 py-2 text-sm rounded-xl font-medium transition-all duration-200 ${
                filter === 'not-eligible'
                  ? 'bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
              }`}
            >
              ✖︎ Not eligible ({stats.notEligible})
            </button>
            <button
              onClick={() => setFilter('errors')}
              className={`px-4 py-2 text-sm rounded-xl font-medium transition-all duration-200 ${
                filter === 'errors'
                  ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
              }`}
            >
              ⚠️ Errors ({stats.errors})
            </button>
          </div>

          <div className="flex gap-3">
            {handleCopyEligible_Button()}
            {handleExportCSV_Button()}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by address..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-blue-50/50 dark:from-gray-800 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  №
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedResults.map((result, index) => (
                <tr key={result.address} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors duration-150">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-300">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-900 dark:text-gray-300">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1 text-xs">
                      {result.address}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(result)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-300">
                    {result.eligible === true && result.amount && result.amount !== '0' ? (
                      <span className="text-green-600 dark:text-green-400">
                        {formatLinea(result.amount, 0)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-red-600 dark:text-red-400 max-w-xs truncate">
                    {result.error || <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Shown {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredResults.length)} из {filteredResults.length}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              ← Back
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
