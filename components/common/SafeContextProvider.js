import React, { useState, useEffect } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';

/**
 * A wrapper component that safely provides access to the dashboard context
 * and handles cases where context might not be immediately available
 */
function SafeContextProvider({ children, fallback }) {
  const [contextAvailable, setContextAvailable] = useState(false);

  // Attempt to access the dashboard context
  let dashboardContext = null;
  let contextError = null;

  try {
    dashboardContext = useDashboard();
    // If we get here, the context is available
    if (!contextAvailable) {
      setContextAvailable(true);
    }
  } catch (error) {
    contextError = error;
    console.error('Error accessing dashboard context:', error);
  }

  // If context isn't available yet, show a fallback UI
  if (!contextAvailable || contextError) {
    return fallback || (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mx-auto max-w-md my-6">
        <h2 className="text-yellow-800 text-lg font-semibold mb-2">Loading dashboard data...</h2>
        <p className="text-yellow-700 mb-4">Please wait while we initialize the dashboard.</p>
      </div>
    );
  }

  // Context is available, render children
  return children(dashboardContext);
}

export default SafeContextProvider;