"use client"

import { auth0 } from "@/lib/auth0"
import { useDashboard } from "@/contexts/DashboardContext"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

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
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
      <div className="text-center mb-6">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-muted-foreground text-sm">Redirecting to your program...</p>
      </div>
      <Skeleton className="h-6 w-48 mb-4" />
      <Skeleton className="h-6 w-64 mb-4" />
      <Skeleton className="h-6 w-32" />
    </div>
  )
}

// Wrap with auth protection
export async function getServerSideProps(context) {
  // Get the session using Auth0 v4 client
  const session = await auth0.getSession(context.req);
  
  // Redirect to login if no session
  if (!session) {
    return {
      redirect: {
        destination: '/auth/login?returnTo=' + encodeURIComponent(context.resolvedUrl),
        permanent: false,
      },
    };
  }
  
  // Return the user prop to maintain compatibility with existing code
  return {
    props: {
      user: session.user || null,
    },
  };
}

export default ProgramIndex