"use client"

import { useEffect } from "react"
import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0"
import { Skeleton } from "@/components/ui/skeleton"

const Callback = () => {
  const router = useRouter()
  const { user, isLoading, error } = useUser()

  useEffect(() => {
    // Only redirect once the user object is available from Auth0
    // This ensures the session is fully established before navigation
    if (user && !isLoading) {
      // Use window.location instead of router.push to force a full page reload
      // This ensures the Auth0 session is fully established in the browser
      window.location.href = "/dashboard"
    }
  }, [user, isLoading, router])

  // Show error if authentication failed
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="max-w-md w-full p-6 space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Authentication Error</h2>
            <p className="mt-2 text-muted-foreground">{error.message}</p>
            <button 
              onClick={() => window.location.href = "/login"} 
              className="mt-6 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="max-w-md w-full p-6 space-y-8">
        <div className="text-center">
          <Skeleton className="h-10 w-48 mx-auto mb-6" />
          <Skeleton className="h-4 w-64 mx-auto mb-8" />
        </div>
        
        <div className="flex flex-col items-center justify-center mt-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground text-sm">Completing authentication, please wait...</p>
        </div>
      </div>
    </div>
  )
}

export default Callback

