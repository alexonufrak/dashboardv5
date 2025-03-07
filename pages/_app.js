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
import dynamic from 'next/dynamic'

// Dynamically import error boundary to avoid SSR issues
const DashboardErrorBoundary = dynamic(() => import('@/components/DashboardErrorBoundary'), {
  ssr: false
})

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

  // IMPORTANT: Always wrap every page with DashboardProvider
  // This ensures context is available everywhere, even if not needed
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <OnboardingProvider>
          <DashboardProvider>
            <DashboardErrorBoundary>
              <Component {...pageProps} />
              <Toaster position="top-right" richColors closeButton />
              <Analytics />
            </DashboardErrorBoundary>
          </DashboardProvider>
        </OnboardingProvider>
      </UserProvider>
      {/* Add React Query DevTools - only in development mode */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

export default MyApp

