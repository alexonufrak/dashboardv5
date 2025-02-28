"use client"

import Head from "next/head"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0/client"

import DashboardSidebar from "./DashboardSidebar"
import Breadcrumbs from "./Breadcrumbs"

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

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="xFoundry Hub - Empowering education through technology" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-background">
        {/* Sidebar - only shown on protected pages */}
        {showSidebar && <DashboardSidebar profile={profile} onEditClick={onEditClick} />}
        
        {/* Main Content */}
        <main className={`flex-1 ${showSidebar ? 'md:ml-64' : ''} pt-4`}>
          <div className="container max-w-6xl mx-auto px-4 md:px-6">
            {showBreadcrumbs && <Breadcrumbs />}
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className={`border-t py-4 text-center text-muted-foreground text-sm ${showSidebar ? 'md:ml-64' : ''}`}>
          <p>© {currentYear} xFoundry Education Platform. All rights reserved.</p>
        </footer>
      </div>
    </>
  )
}

export default Layout