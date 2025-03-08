"use client"

import { useEffect } from "react"
import { useRouter } from "next/router"
import LoadingScreen from "@/components/common/LoadingScreen"

const Callback = () => {
  const router = useRouter()

  useEffect(() => {
    const redirectToDashboard = () => {
      router.push("/dashboard")
    }

    // Add a slight delay to ensure Auth0 has time to complete the process
    const timer = setTimeout(redirectToDashboard, 1000)

    return () => clearTimeout(timer)
  }, [router])

  return <LoadingScreen message="Completing authentication, please wait..." />
}

export default Callback

