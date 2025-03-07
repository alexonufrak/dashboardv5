import { UserProvider } from "@auth0/nextjs-auth0/client"
import "../styles/globals.css"
import "@fillout/react/style.css" // Import Fillout styles
import { Toaster } from 'sonner';
import { OnboardingProvider } from '@/contexts/OnboardingContext'
import { DashboardProvider } from '@/contexts/DashboardContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Analytics } from "@vercel/analytics/react"
import { useState } from 'react'

function MyApp({ Component, pageProps }) {
  // Create a client for React Query with persistent cache
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes by default
        retry: 1,
        refetchOnWindowFocus: false, // Disable refetching on window focus to prevent unnecessary API calls
      },
    },
  }))

  // Determine if this page needs dashboard context
  const needsDashboardContext = 
    Component.needsDashboardContext || 
    pageProps.needsDashboardContext ||
    Component.displayName === 'ProgramDashboardPage' || 
    Component.name === 'ProgramDashboardPage' ||
    Component.displayName === 'Dashboard' || 
    Component.name === 'Dashboard';

  // Create a new render function that conditionally wraps in DashboardProvider
  const renderWithDashboardProvider = (component) => {
    if (needsDashboardContext) {
      return <DashboardProvider>{component}</DashboardProvider>;
    }
    return component;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <OnboardingProvider>
          {renderWithDashboardProvider(
            <>
              <Component {...pageProps} />
              <Toaster position="top-right" richColors closeButton />
              <Analytics />
            </>
          )}
        </OnboardingProvider>
      </UserProvider>
      {/* Add React Query DevTools - only in development mode */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

export default MyApp

