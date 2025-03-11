"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { useDashboard } from "@/contexts/DashboardContext"
import { Skeleton } from "@/components/ui/skeleton"

// Profile page that opens the edit modal and stays on the current page
const ProfilePage = () => {
  const router = useRouter()
  const { setIsEditModalOpen } = useDashboard()
  
  useEffect(() => {
    // Open the profile edit modal
    setIsEditModalOpen(true)
    
    // Return to the previous page or dashboard
    const returnPath = document.referrer ? new URL(document.referrer).pathname : "/dashboard"
    
    // Check if return path is valid internal route
    const isInternalRoute = returnPath.startsWith("/dashboard") || 
                           returnPath === "/" || 
                           returnPath.startsWith("/program-dashboard")
    
    // Use shallow routing to go back without triggering a refresh
    router.replace(isInternalRoute ? returnPath : "/dashboard", undefined, { shallow: true })
  }, [router, setIsEditModalOpen])
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
      <div className="text-center mb-6">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-muted-foreground text-sm">Opening profile editor...</p>
      </div>
      <Skeleton className="h-6 w-48 mb-4" />
      <Skeleton className="h-6 w-64 mb-4" />
      <Skeleton className="h-6 w-32" />
    </div>
  )
}

export const getServerSideProps = withPageAuthRequired()

export default ProfilePage