"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useRouter } from "next/router"
import { useEffect } from "react"
import LoadingScreen from "../components/LoadingScreen"

// Redirect profile page to dashboard
const ProfileRedirect = () => {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/dashboard")
  }, [router])
  
  return <LoadingScreen message="Redirecting to dashboard..." />
}

export const getServerSideProps = withPageAuthRequired()

export default ProfileRedirect