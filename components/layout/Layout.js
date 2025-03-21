"use client"

import Head from "next/head"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0"

import MainDashboardLayout from "@/components/layout/MainDashboardLayout"
import Breadcrumbs from "@/components/common/Breadcrumbs"

const Layout = ({ children, title = "xFoundry Hub", profile, onEditClick }) => {
  const [currentYear, setCurrentYear] = useState("")
  const router = useRouter()
  const { user } = useUser()
  const isDashboard = router.pathname === "/dashboard" || router.pathname === "/profile"
  const showSidebar = isDashboard && user
  const showBreadcrumbs = router.pathname !== "/dashboard" && showSidebar

  useEffect(() => {
    setCurrentYear(new Date().getFullYear())
  }, [])

  // Add debug logs
  console.log("Layout props:", { profile, isDashboard, showSidebar })

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="xFoundry Hub - Empowering education through technology" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <MainDashboardLayout 
        title={title}
        profile={profile}
        currentPage={router.pathname === "/profile" ? "profile" : "dashboard"}
        showBreadcrumbs={showBreadcrumbs}
      >
        {children}
      </MainDashboardLayout>
    </>
  )
}

export default Layout