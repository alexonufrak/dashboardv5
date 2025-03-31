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
      // Store the session token in multiple storage locations for maximum compatibility
      // This is critical for our fallback authentication system
      try {
        if (user.id_token) {
          // Store in sessionStorage
          sessionStorage.setItem('auth0.id_token', user.id_token);
          console.log('Auth0 token stored in sessionStorage');
          
          // Also store in localStorage for persistence
          localStorage.setItem('auth0.id_token', user.id_token);
          console.log('Auth0 token stored in localStorage for persistence');
          
          // Set a JS-accessible cookie as another fallback
          document.cookie = `auth0Token=${user.id_token}; path=/; secure; max-age=86400`;
          console.log('Auth0 token also stored in cookie');
        }
        
        // Store the user ID globally for API requests
        window._userId = user.sub;
        localStorage.setItem('auth0.user_id', user.sub);
        console.log('User ID stored for API requests');
      } catch (e) {
        console.warn('Error storing auth tokens:', e);
      }
      
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

