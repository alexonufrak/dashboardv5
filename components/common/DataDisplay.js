/**
 * DataDisplay Component
 * 
 * A reusable component for displaying data with consistent loading and error states.
 * Provides standardized handling of loading, errors, and empty states.
 */
import React from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * A reusable component for displaying data with consistent loading and error states
 */
export function DataDisplay({
  data,
  isLoading,
  isError,
  error,
  refetch,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  showRefresh = true,
}) {
  // Custom loading component or fallback to skeleton
  const LoadingState = loadingComponent || (
    <div className="space-y-2 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  );
  
  // Custom error component or fallback to alert
  const ErrorState = errorComponent || (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Error:</strong>
      <span className="block sm:inline"> {error?.message || 'Failed to load data'}</span>
      {showRefresh && refetch && (
        <button 
          className="ml-4 inline-flex items-center px-2.5 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          onClick={() => refetch()}
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          Retry
        </button>
      )}
    </div>
  );
  
  // Custom empty state or fallback to message
  const EmptyState = emptyComponent || (
    <div className="text-center p-4 text-gray-500">
      No data found
    </div>
  );
  
  // Handle loading state
  if (isLoading) {
    return LoadingState;
  }
  
  // Handle error state
  if (isError) {
    return ErrorState;
  }
  
  // Handle empty state
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return EmptyState;
  }
  
  // Render the actual content
  return children(data);
}

export default DataDisplay;