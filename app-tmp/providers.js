'use client'

import { Auth0Provider } from "@auth0/nextjs-auth0/client"
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { OnboardingProvider } from '@/contexts/OnboardingContext'
import { DashboardProvider } from '@/contexts/DashboardContext'
import { Toaster } from 'sonner'
import { Analytics } from "@vercel/analytics/react"
import ErrorBoundary from './error-boundary'

export default function Providers({ children }) {
  const [mounted, setMounted] = useState(false)

  // Create a client for React Query with persistent cache
  const [queryClient] = useState(() => {
    // Check for server-side rendering
    if (typeof window === 'undefined') {
      // For SSR, return a basic QueryClient without QueryCache to avoid SSR errors
      return new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes by default
            cacheTime: 60 * 60 * 1000, // 1 hour 
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
        },
      });
    }
    
    // For client-side only, use the full configuration with QueryCache
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
      // Add queryCache config with a user-specific key prefix
      queryCache: new QueryCache({
        onError: (error) => {
          console.error('Query cache error:', error);
        },
      }),
    });
    
    // Expose the queryClient globally for direct cache invalidation
    window._queryClient = client;
    console.log("QueryClient exposed globally for direct cache invalidation");
    
    return client;
  });
  
  // Add listener for page refresh (not navigation) to clear initiative conflicts cache
  useEffect(() => {
    // Skip this effect entirely during server-side rendering
    if (typeof window === 'undefined') return;
    
    // This will run when the page is loaded for the first time
    const handleBeforeUnload = () => {
      // Mark this as the most recent unload time
      localStorage.setItem('lastPageUnload', Date.now().toString());
    };
    
    // This will run when the page is loaded after a refresh
    const checkIfRefreshed = () => {
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
  }, []);

  // Basic app shell when not mounted yet (client-side hydration)
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

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider 
        attribute="class"
        defaultTheme="system"
        enableSystem
      >
        <Auth0Provider 
          clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID}
          domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN}
          authorizationParams={{
            redirect_uri: typeof window !== 'undefined' ? window.location.origin + "/auth/callback" : undefined,
            scope: "openid profile email",
            audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
          }}
          useRefreshTokens={true}
          useSecureCookies={true}
          cookieDomain={process.env.NODE_ENV === 'production' ? '.xfoundry.org' : undefined}
        >
          <OnboardingProvider>
            <DashboardProvider>
              <ErrorBoundary>
                {children}
                <Toaster position="top-right" richColors closeButton />
                <Analytics />
              </ErrorBoundary>
            </DashboardProvider>
          </OnboardingProvider>
        </Auth0Provider>
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </ThemeProvider>
    </QueryClientProvider>
  )
}