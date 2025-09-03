'use client';

import { useState, useRef } from 'react';
import { ValidationStats } from '@/types';
import { parseAndValidateAddresses, generateExampleAddresses } from '@/lib/validators';
import { parseCSVFile } from '@/lib/csv';

interface AddressInputProps {
  onAddressesChange: (addresses: string[], stats: ValidationStats) => void;
  validationStats: ValidationStats;
  isLoading: boolean;
  onCheck: () => void;
  onClear: () => void;
}

export default function AddressInput({
  onAddressesChange,
  validationStats,
  isLoading,
  onCheck,
  onClear
}: AddressInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showInvalid, setShowInvalid] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (value: string) => {
    setInputValue(value);
    setFileError('');
    const { validAddresses, stats } = parseAndValidateAddresses(value);
    onAddressesChange(validAddresses, stats);
  };

  const handleFileUpload = (file: File) => {
    setFileError('');
    
    const validTypes = ['text/plain', 'text/csv', 'application/csv'];
    const validExtensions = ['.txt', '.csv'];
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!hasValidType && !hasValidExtension) {
      setFileError('Only .txt and .csv files are supported');
      return;
    }
    
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError('File size must not exceed 5MB');
      return;
    }    

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        if (!content) {
          setFileError('Failed to read the file');
          return;
        }
        
        let addresses: string[] = [];
        
        if (file.name.toLowerCase().endsWith('.csv')) {
          addresses = parseCSVFile(content);
          if (addresses.length === 0) {
            const { validAddresses } = parseAndValidateAddresses(content);
            addresses = validAddresses;
          }
        } else {
          const { validAddresses } = parseAndValidateAddresses(content);
          addresses = validAddresses;
        }
        
        const addressText = addresses.length > 0 ? addresses.join('\n') : content;
        setInputValue(addressText);
        
        const { validAddresses, stats } = parseAndValidateAddresses(addressText);
        onAddressesChange(validAddresses, stats);
        
      } catch (error) {
        console.error('Error parsing file:', error);
        setFileError('Error processing the file');
      }
    };
    
    reader.onerror = () => {
      setFileError('Error reading the file');
    };
    
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (!file) {
      setFileError('No file selected');
      return;
    }
    
    handleFileUpload(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleExample = () => {
    const exampleAddresses = generateExampleAddresses();
    const exampleText = exampleAddresses.join('\n');
    setInputValue(exampleText);
    setFileError('');
    const { validAddresses, stats } = parseAndValidateAddresses(exampleText);
    onAddressesChange(validAddresses, stats);
  };

  const handleClear = () => {
    setInputValue('');
    setFileError('');
    setShowInvalid(false);
    onClear();
  };

  const canCheck = validationStats.valid > 0 && validationStats.valid <= 1000;

  return (
    <div className="space-y-8">
      {/* Text Input */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Enter addresses to check
          </h3>
        </div>
        <textarea
          value={inputValue}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="0x1234567890123456789012345678901234567890&#10;0xabcdefabcdefabcdefabcdefabcdefabcdefabcd...&#10;&#10;Supported delimiters: spaces, commas, line breaks, semicolons"
          className="w-full h-40 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm transition-all duration-200 resize-none"
          disabled={isLoading}
        />
      </div>

      {/* File Upload */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Or upload a file
          </h3>
        </div>
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            dragActive
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-105'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50/50 dark:hover:bg-gray-700/50'
          } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
          onDrop={handleDrop}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
            disabled={isLoading}
          />
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Drag and drop a file here
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Supported formats: .txt, .csv (max 5MB)
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                disabled={isLoading}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Choose file
              </button>
            </div>
          </div>
        </div>
        
        {/* File Error */}
        {fileError && (
          <div className="p-3 bg-red-50/80 dark:bg-red-900/20 rounded-lg border-l-4 border-red-400">
            <p className="text-sm text-red-800 dark:text-red-300 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {fileError}
            </p>
          </div>
        )}
      </div>

      {/* Validation Stats */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 dark:from-gray-700/50 dark:to-blue-900/20 rounded-xl p-6 border border-gray-200/50 dark:border-gray-600/50">
        <div className="flex flex-wrap gap-6 items-center justify-between">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Valid:</span>
              <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                {validationStats.valid}
              </span>
            </div>
            {validationStats.duplicates > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Duplicates:</span>
                <span className="font-bold text-yellow-600 dark:text-yellow-400 text-lg">
                  {validationStats.duplicates}
                </span>
              </div>
            )}
            {validationStats.invalid > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Invalid:</span>
                <span className="font-bold text-red-600 dark:text-red-400 text-lg">
                  {validationStats.invalid}
                </span>
                <button
                  onClick={() => setShowInvalid(!showInvalid)}
                  className="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline ml-1"
                >
                  {showInvalid ? 'Hide' : 'Show'}
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExample}
              className="px-4 py-2 bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
              disabled={isLoading}
            >
              Example
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
              disabled={isLoading}
            >
              Clear
            </button>
          </div>
        </div>

        {showInvalid && validationStats.invalidAddresses.length > 0 && (
          <div className="mt-6 p-4 bg-red-50/80 dark:bg-red-900/20 rounded-lg border-l-4 border-red-400">
            <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              ☠︎ Invalid addresses:
            </h4>
            <div className="text-xs text-red-700 dark:text-red-400 max-h-32 overflow-y-auto space-y-1 bg-white/50 dark:bg-gray-800/50 p-3 rounded">
              {validationStats.invalidAddresses.map((addr, i) => (
                <div key={i} className="font-mono bg-red-100/50 dark:bg-red-900/30 px-2 py-1 rounded">{addr}</div>
              ))}
            </div>
          </div>
        )}

        {validationStats.valid > 1000 && (
          <div className="mt-6 p-4 bg-yellow-50/80 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
            <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>
                <strong>Limit exceeded:</strong> Found {validationStats.valid} addresses.
                Maximum per request: 1000. Please split the list into parts.
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Check Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onCheck}
          disabled={!canCheck || isLoading}
          className={`group relative px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform ${
            canCheck && !isLoading
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 hover:scale-105'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center space-x-3">
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Checking addresses...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Check {validationStats.valid} {validationStats.valid === 1 ? 'address' : validationStats.valid < 5 ? 'addresses' : 'addresses'}</span>
              </>
            )}
          </div>
          {canCheck && !isLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          )}
        </button>
      </div>
    </div>
  );
}
