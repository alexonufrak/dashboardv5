"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useRouter } from "next/router"
import { useEffect } from "react"

// Simple redirect wrapper to the new dashboard
function Dashboard() {
  const router = useRouter()
  
  useEffect(() => {
    // Get any query parameters from the current URL
    const query = router.query
    
    // Create new URL with the same query parameters
    router.replace({
      pathname: '/dashboard-new',
      query: query
    })
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg text-gray-500">Redirecting to new dashboard...</p>
    </div>
  )
}

// Wrap with auth protection
export const getServerSideProps = withPageAuthRequired()

export default Dashboard