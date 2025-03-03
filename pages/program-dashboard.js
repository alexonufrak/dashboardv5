"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { DashboardProvider } from "@/contexts/DashboardContext"
import DashboardShell from "@/components/DashboardShell"
import { Toaster } from "sonner"
import { useEffect } from "react"
import { useRouter } from "next/router"

function ProgramDashboard() {
  const router = useRouter()
  
  return (
    <DashboardProvider>
      <ProgramDashboardContent />
    </DashboardProvider>
  )
}

// Separate the content to ensure context is available
function ProgramDashboardContent() {
  const router = useRouter()
  
  // Set program dashboard as the initial view
  useEffect(() => {
    // Just ensure the activePage is set to program in the DashboardShell
    // We don't need to change the URL as we're already on /program-dashboard
  }, [])
  
  return (
    <>
      <DashboardShell />
      <Toaster position="top-right" />
    </>
  )
}

// Wrap with auth protection
export const getServerSideProps = withPageAuthRequired()

export default ProgramDashboard