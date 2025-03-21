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
import { ThemeProvider } from '@/components/theme-provider'
import { useUser } from "@auth0/nextjs-auth0/client"

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
    const { className = "" } = this.props;
    
    if (this.state.hasError) {
      return (
        <div className={`bg-white dark:bg-gray-900 min-h-screen ${className}`}>
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg p-6 mx-auto max-w-lg my-6">
            <h2 className="text-red-800 dark:text-red-200 text-xl font-semibold mb-4">Something went wrong</h2>
            <div className="bg-white dark:bg-gray-800 p-4 rounded border border-red-100 dark:border-red-700 mb-4">
              <p className="text-red-700 dark:text-red-300">{this.state.error?.message || "An error occurred"}</p>
            </div>
            <button 
              onClick={() => window.location.href = '/dashboard'} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return <div className={`bg-white dark:bg-gray-900 min-h-screen ${className}`}>{this.props.children}</div>;
  }
}

// Special AppContent component to handle non-dashboard pages
function AppContent({ Component, pageProps, router }) {
  const { user, isLoading } = useUser();
  
  // Check if this is a dashboard-related page to keep app state
  const isDashboardRoute = 
    router.pathname === '/dashboard' || 
    router.pathname === '/dashboard-new' || 
    router.pathname === '/profile' || 
    router.pathname === '/onboarding' ||
    router.pathname.startsWith('/program/') ||
    router.pathname.startsWith('/program-new/') ||
    router.pathname.startsWith('/dashboard/') ||
    router.pathname.startsWith('/programs/') ||
    router.pathname === '/program-dashboard' ||
    // Make sure all programs-related pages are included
    router.pathname.includes('/programs/apply/');

  // Handle onboarding check (moved from middleware)
  useEffect(() => {
    // Skip check if not logged in, loading, or not on dashboard
    if (!user || isLoading || router.pathname !== '/dashboard') {
      return;
    }

    async function checkOnboarding() {
      try {
        const response = await fetch('/api/user/onboarding-completed');
        if (response.ok) {
          const data = await response.json();
          if (!data.completed) {
            router.push('/onboarding');
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    }

    checkOnboarding();
  }, [user, isLoading, router]);

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
  // Removed pageLoading state as we've removed the loading overlay
  
  // Create a client for React Query with persistent cache
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes by default
          cacheTime: 60 * 60 * 1000, // 1 hour - keep data in cache longer for page navigations
          retry: 1,
          refetchOnWindowFocus: false, // Disable refetching on window focus to prevent unnecessary API calls
          refetchOnReconnect: true, // Refetch when reconnecting (useful after a page refresh)
        },
      },
    });
    
    // Expose the queryClient globally for direct cache invalidation
    if (typeof window !== 'undefined') {
      window._queryClient = client;
      console.log("QueryClient exposed globally for direct cache invalidation");
    }
    
    return client;
  });
  
  // Add listener for page refresh (not navigation) to clear initiative conflicts cache
  useEffect(() => {
    // This will run when the page is loaded for the first time
    const handleBeforeUnload = () => {
      // Mark this as the most recent unload time
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastPageUnload', Date.now().toString());
      }
    };
    
    // This will run when the page is loaded after a refresh
    const checkIfRefreshed = () => {
      if (typeof window !== 'undefined') {
        const lastUnload = localStorage.getItem('lastPageUnload');
        
        if (lastUnload) {
          const unloadTime = parseInt(lastUnload);
          const loadTime = Date.now();
          
          // If the time between unload and reload is less than 2 seconds, it was likely a refresh
          if (loadTime - unloadTime < 2000) {
            console.log('Page was refreshed, clearing initiative conflicts cache');
            queryClient.invalidateQueries(['initiativeConflicts']);
          }
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Check if page was refreshed on mount
    checkIfRefreshed();
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [queryClient]);

  // Only show the application after mounted on client side
  useEffect(() => {
    setMounted(true);
    // We've removed the loading overlay logic
  }, []);

  // Basic app shell when not mounted yet (server-side rendering)
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">xFoundry Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Client-side rendered app with all providers
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider 
        attribute="class"
        defaultTheme="system"
        enableSystem
      >
        <UserProvider>
          <OnboardingProvider>
            <ErrorBoundary className="bg-white dark:bg-gray-900">
              <AppContent Component={Component} pageProps={pageProps} router={router} />
              <Analytics />
            </ErrorBoundary>
          </OnboardingProvider>
        </UserProvider>
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default MyApp