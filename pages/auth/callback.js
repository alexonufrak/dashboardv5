"use client"

import { useEffect } from "react"
import { useRouter } from "next/router"
import { Skeleton } from "@/components/ui/skeleton"

const Callback = () => {
  const router = useRouter()

  useEffect(() => {
    const redirectToDashboard = () => {
      router.push("/dashboard")
    }

    // Add a slight delay to ensure Auth0 has time to complete the process
    const timer = setTimeout(redirectToDashboard, 1000)

    return () => clearTimeout(timer)
  }, [router])

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

