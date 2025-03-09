"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useEffect } from "react"
import { useRouter } from "next/router"

// Simple redirect wrapper to the new program page
function ProgramPage() {
  const router = useRouter()
  const { programId } = router.query
  
  useEffect(() => {
    // Wait for programId to be available
    if (programId && router.isReady) {
      // Redirect to the new program page with same programId
      router.replace(`/program-new/${programId}`, undefined, { shallow: true })
    }
  }, [programId, router, router.isReady])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg text-gray-500">Redirecting to new program dashboard...</p>
    </div>
  )
}

// Wrap with auth protection
export const getServerSideProps = withPageAuthRequired()

export default ProgramPage