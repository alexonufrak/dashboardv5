"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useDashboard } from "@/contexts/DashboardContext"
import { Toaster } from "sonner"
import { useEffect } from "react"
import { useRouter } from "next/router"

function ProgramDashboardLegacy() {
  const router = useRouter()
  const { getAllProgramInitiatives } = useDashboard()
  
  // Redirect to the new URL structure
  useEffect(() => {
    const initiatives = getAllProgramInitiatives()
    // If user has active initiatives, redirect to the first one
    if (initiatives && initiatives.length > 0) {
      router.replace(`/program/${initiatives[0].id}`)
    } else {
      // Otherwise redirect to the dashboard
      router.replace('/dashboard')
    }
  }, [router, getAllProgramInitiatives])
  
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h3 className="text-lg font-medium mb-2">Redirecting...</h3>
        <p className="text-muted-foreground">Taking you to your program dashboard</p>
      </div>
      <Toaster position="top-right" />
    </div>
  )
}

// Wrap with auth protection
export const getServerSideProps = withPageAuthRequired()

export default ProgramDashboardLegacy