"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { withPageAuthRequired } from "@auth0/nextjs-auth0"

/**
 * This is a redirect file to maintain backward compatibility.
 * The program page has been moved to /pages/dashboard/programs/[programId]/index.js
 */
function ProgramRedirect() {
  const router = useRouter()
  const { programId } = router.query
  
  useEffect(() => {
    if (programId) {
      // Redirect to the new route with the same programId
      router.replace(`/dashboard/programs/${programId}`, undefined, { shallow: true })
    }
  }, [router, programId])
  
  // Return loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <div className="text-center mb-6">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-muted-foreground text-sm">Redirecting to program dashboard...</p>
      </div>
    </div>
  )
}

// Wrap with auth protection to maintain the same behavior
export const getServerSideProps = withPageAuthRequired()

export default ProgramRedirect