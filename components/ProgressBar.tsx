'use client';

import { useState, useEffect } from 'react';

interface ProgressBarProps {
  isActive: boolean;
  progress?: number;
  message?: string;
  subMessage?: string;
}

export default function ProgressBar({ 
  isActive, 
  progress, 
  message = 'Processing...', 
  subMessage 
}: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  
  useEffect(() => {
    if (!isActive) {
      setDisplayProgress(0);
      return;
    }

    if (progress !== undefined) {
      setDisplayProgress(progress);
    } else {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.random() * 15;
        if (currentProgress > 85) {
          currentProgress = 85;
        }
        setDisplayProgress(currentProgress);
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isActive, progress]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center animate-pulse">
              <svg className="w-6 h-6 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {message}
            </p>
            {subMessage && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {subMessage}
              </p>
            )}
            
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Processing</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {Math.round(displayProgress)}%
                </span>
              </div>
              <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${displayProgress}%` }}
                >
                  <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
