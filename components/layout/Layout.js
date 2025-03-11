"use client"

import Head from "next/head"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0/client"

import { AppSidebar } from "@/components/layout/app-sidebar"
import DashboardLayout from "@/components/layout/DashboardLayout"
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

      {showSidebar ? (
        <DashboardLayout 
          title={title}
          profile={profile}
        >
          {showBreadcrumbs && <Breadcrumbs />}
          {children}
        </DashboardLayout>
      ) : (
        <div className="min-h-screen bg-background overflow-x-hidden">
          {/* Main Content without sidebar */}
          <main className="flex-1 pt-4 overflow-x-hidden">
            <div className="container max-w-6xl mx-auto px-4 md:px-6">
              {children}
            </div>
          </main>

        </div>
      )}
    </>
  )
}

export default Layout