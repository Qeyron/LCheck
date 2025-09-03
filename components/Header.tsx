'use client';

import { useState, useEffect } from 'react';

export default function Header() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.getItem('theme');
    const sysPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldDark = stored ? stored === 'dark' : sysPrefersDark;

    setIsDark(shouldDark);
    root.classList.toggle('dark', shouldDark);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setIsDark(e.matches);
        root.classList.toggle('dark', e.matches);
      }
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const next = !isDark;
    setIsDark(next);
    root.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <header className="backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-white/20 dark:border-gray-700/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Linea Checker by Qeyron
              </h1>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="group p-3 rounded-xl bg-gray-100/80 hover:bg-gray-200/80 dark:bg-gray-800/80 dark:hover:bg-gray-700/80 transition-all duration-200 shadow-lg hover:shadow-xl"
            aria-label="Toggle theme"
          >
            <div className="relative w-5 h-5">
              {isDark ? (
                <svg className="w-5 h-5 text-yellow-500 group-hover:rotate-12 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
