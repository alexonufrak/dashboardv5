"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { DashboardProvider } from "@/contexts/DashboardContext"
import { useRouter } from "next/router"
import { useEffect } from "react"

// Simple redirect wrapper to the new dashboard
function Dashboard() {
  const router = useRouter()
  
  useEffect(() => {
    // Get any query parameters from the current URL
    const query = router.query
    
    // Only redirect when router is ready
    if (router.isReady) {
      // Create new URL with the same query parameters
      router.replace({
        pathname: '/dashboard-new',
        query: query
      })
    }
  }, [router, router.isReady])
  
  return (
    <DashboardProvider>
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-500">Redirecting to new dashboard...</p>
      </div>
    </DashboardProvider>
  )
}

// Wrap with auth protection
export const getServerSideProps = withPageAuthRequired()

export default Dashboard