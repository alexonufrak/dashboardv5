"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useRouter } from "next/router"
import { useEffect } from "react"

// This is a legacy page that redirects to the main dashboard
// We keep this for backward compatibility with existing links
function DashboardShellPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard")
  }, [router])

  // Return an empty div as this will be redirected immediately
  return <div></div>
}

// Wrap with auth protection
export const getServerSideProps = withPageAuthRequired()

export default DashboardShellPage