"use client"

import { useEffect } from "react"
import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0/client"
import { Skeleton } from "@/components/ui/skeleton"

const Callback = () => {
  const router = useRouter()
  const { user, isLoading } = useUser()

  useEffect(() => {
    // Only redirect once the user object is available from Auth0
    // This ensures the session is fully established before navigation
    if (user && !isLoading) {
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

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

