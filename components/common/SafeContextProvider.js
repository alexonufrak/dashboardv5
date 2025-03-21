import React, { useContext } from 'react';
import { DashboardContext } from '@/contexts/DashboardContext';

/**
 * A wrapper component that safely provides access to the dashboard context
 * and handles cases where context might not be immediately available
 */
function SafeContextProvider({ children, fallback }) {
  // Always call hooks at the top level, even if we handle the null case later
  const dashboardContext = useContext(DashboardContext);
  
  // If context isn't available yet, show a fallback UI
  if (!dashboardContext) {
    return fallback || (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mx-auto max-w-md my-6">
        <h2 className="text-yellow-800 text-lg font-semibold mb-2">Loading dashboard data...</h2>
        <p className="text-yellow-700 mb-4">Please wait while we initialize the dashboard.</p>
      </div>
    );
  }

  // Context is available, render children with it
  return children(dashboardContext);
}

export default SafeContextProvider;