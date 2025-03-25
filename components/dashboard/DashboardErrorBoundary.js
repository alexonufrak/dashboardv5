import React from 'react';
import Link from 'next/link';

class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('Dashboard Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mx-auto max-w-2xl my-6">
          <h2 className="text-red-800 text-xl font-semibold mb-4">Something went wrong</h2>
          <div className="bg-white p-4 rounded border border-red-100 mb-4 overflow-auto max-h-[300px]">
            <pre className="text-sm text-red-700">
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>
          <p className="text-red-700 mb-3">The error above occurred while rendering this page. Please try one of the following:</p>
          <ul className="list-disc pl-5 mb-4 text-red-700">
            <li>Refresh the page</li>
            <li>Return to the <Link href="/dashboard" className="underline">main dashboard</Link></li>
            <li>Log out and log back in</li>
          </ul>
          <button 
            onClick={() => {
              // Clear error state and attempt to recover
              this.setState({ hasError: false, error: null, errorInfo: null });
            }}
            className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            Try to recover
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;