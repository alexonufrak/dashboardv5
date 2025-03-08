import { UserProvider } from "@auth0/nextjs-auth0/client"
import "../styles/globals.css"
import "@fillout/react/style.css" // Import Fillout styles
import { Toaster } from 'sonner';
import { OnboardingProvider } from '@/contexts/OnboardingContext'
import { DashboardProvider } from '@/contexts/DashboardContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Analytics } from "@vercel/analytics/react"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import LoadingScreen from '@/components/common/LoadingScreen'

// Simple class-based error boundary component defined inline to avoid import issues
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mx-auto max-w-lg my-6">
          <h2 className="text-red-800 text-xl font-semibold mb-4">Something went wrong</h2>
          <div className="bg-white p-4 rounded border border-red-100 mb-4">
            <p className="text-red-700">{this.state.error?.message || "An error occurred"}</p>
          </div>
          <button 
            onClick={() => window.location.href = '/dashboard'} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Special AppContent component to handle non-dashboard pages
function AppContent({ Component, pageProps, router }) {
  // Check if this is a dashboard-related page to keep app state
  const isDashboardRoute = 
    router.pathname === '/dashboard' || 
    router.pathname === '/profile' || 
    router.pathname.startsWith('/program/') ||
    router.pathname.startsWith('/dashboard/') ||
    router.pathname === '/program-dashboard';

  // If not a dashboard route, render Component directly
  if (!isDashboardRoute) {
    return <Component {...pageProps} />;
  }

  // For dashboard routes, we use DashboardProvider to maintain shared state
  return (
    <DashboardProvider>
      <Component {...pageProps} />
      <Toaster position="top-right" richColors closeButton />
    </DashboardProvider>
  );
}

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  
  // Create a client for React Query with persistent cache
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes by default
        retry: 1,
        refetchOnWindowFocus: false, // Disable refetching on window focus to prevent unnecessary API calls
      },
    },
  }));

  // Only show the application after mounted on client side
  useEffect(() => {
    setMounted(true);

    // Setup router events to handle loading state
    const handleStart = (url) => {
      // Only show loading state for dashboard-related routes
      if (url.includes('/dashboard') || 
          url.includes('/profile') || 
          url.includes('/program/')) {
        setPageLoading(true);
      }
    };
    
    const handleComplete = () => setPageLoading(false);
    
    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);
    
    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  // Basic app shell when not mounted yet (server-side rendering)
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-800 mb-2">xFoundry Dashboard</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading overlay during page transitions
  const showLoadingOverlay = pageLoading;

  // Client-side rendered app with all providers
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <OnboardingProvider>
          <ErrorBoundary>
            <AppContent Component={Component} pageProps={pageProps} router={router} />
            {showLoadingOverlay && (
              <div className="fixed inset-0 bg-white bg-opacity-70 z-50 flex items-center justify-center pointer-events-none">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}
            <Analytics />
          </ErrorBoundary>
        </OnboardingProvider>
      </UserProvider>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

export default MyApp