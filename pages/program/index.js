"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useDashboard } from "@/contexts/DashboardContext"
import { useRouter } from "next/router"
import { useEffect } from "react"
import LoadingScreen from "@/components/LoadingScreen"

/**
 * Program index page
 * This page handles redirects to specific program pages
 * - If user has only one active program, redirect to that program
 * - If user has multiple active programs, redirect to first program
 * - If user has no active programs, redirect to dashboard
 */
function ProgramIndex() {
  const router = useRouter()
  const { getAllProgramInitiatives, isLoading } = useDashboard()
  
  useEffect(() => {
    if (!isLoading) {
      const initiatives = getAllProgramInitiatives()
      
      // Redirect based on available programs
      if (initiatives && initiatives.length > 0) {
        // Redirect to the first available program
        router.replace(`/program/${initiatives[0].id}`)
      } else {
        // If no programs available, redirect to main dashboard
        router.replace('/dashboard')
      }
    }
  }, [router, getAllProgramInitiatives, isLoading])
  
  return (
    <LoadingScreen message="Redirecting to your program..." />
  )
}

// Wrap with auth protection
export const getServerSideProps = withPageAuthRequired()

export default ProgramIndex