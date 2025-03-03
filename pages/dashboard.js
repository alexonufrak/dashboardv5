"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

const Dashboard = () => {
  const router = useRouter()
  
  // Redirect to the new dashboard shell
  useEffect(() => {
    router.replace("/dashboard-shell")
  }, [router])
  
  // Show loading screen while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-10 w-10 mx-auto mb-4 animate-spin text-primary" />
        <h1 className="text-2xl font-bold">Loading Dashboard</h1>
        <p className="text-muted-foreground">Redirecting to the new dashboard experience...</p>
      </div>
    </div>
  )
}

export const getServerSideProps = withPageAuthRequired()

export default Dashboard