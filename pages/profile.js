"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { useDashboard } from "@/contexts/DashboardContext"
import LoadingScreen from "@/components/common/LoadingScreen"

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
  
  return <LoadingScreen message="Opening profile editor..." />
}

export const getServerSideProps = withPageAuthRequired()

export default ProfilePage