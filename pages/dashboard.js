"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { DashboardProvider } from "@/contexts/DashboardContext"
import DashboardShell from "@/components/DashboardShell"
import { Toaster } from "sonner"

function Dashboard() {
  return (
    <DashboardProvider>
      <DashboardShell />
      <Toaster position="top-right" />
    </DashboardProvider>
  )
}

// Wrap with auth protection
export const getServerSideProps = withPageAuthRequired()

export default Dashboard