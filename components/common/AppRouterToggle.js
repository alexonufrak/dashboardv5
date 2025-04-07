'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * App Router Toggle Component
 * Allows users to toggle between Pages Router and App Router
 */
export function AppRouterToggle() {
  const [enabled, setEnabled] = useState(false);
  
  // Initialize state from cookie on mount
  useEffect(() => {
    const useAppRouter = document.cookie
      .split('; ')
      .find(row => row.startsWith('useAppRouter='))
      ?.split('=')[1];
      
    setEnabled(useAppRouter === 'true');
  }, []);
  
  // Toggle App Router feature flag
  const toggleAppRouter = useCallback(() => {
    const newState = !enabled;
    setEnabled(newState);
    
    // Set or remove cookie based on state
    if (newState) {
      document.cookie = `useAppRouter=true; path=/; max-age=${60 * 60 * 24 * 7}`; // 1 week
      window.location.href = '/?useAppRouter=true';
    } else {
      document.cookie = 'useAppRouter=false; path=/; max-age=0'; // Delete cookie
      window.location.href = '/?useAppRouter=false';
    }
  }, [enabled]);
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2">
        <button
          onClick={toggleAppRouter}
          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
            enabled ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`${
              enabled ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition`}
          />
        </button>
        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {enabled ? 'App Router' : 'Pages Router'}
        </label>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {enabled ? 'Using Next.js App Router' : 'Using Next.js Pages Router'}
      </p>
    </div>
  );
}