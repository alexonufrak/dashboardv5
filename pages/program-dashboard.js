"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { DashboardProvider } from "@/contexts/DashboardContext"
import DashboardShell from "@/components/DashboardShell"
import { Toaster } from "sonner"
import { useEffect } from "react"
import { useRouter } from "next/router"

function ProgramDashboard() {
  const router = useRouter()
  
  // Set program dashboard as the initial page
  useEffect(() => {
    // Using shallow routing to avoid full page reload
    router.push("/program-dashboard", undefined, { shallow: true })
  }, [router])
  
  return (
    <DashboardProvider>
      <DashboardShell />
      <Toaster position="top-right" />
    </DashboardProvider>
  )
}

// Wrap with auth protection
export const getServerSideProps = withPageAuthRequired()

export default ProgramDashboard