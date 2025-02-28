"use client"

import Head from "next/head"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0/client"

import DashboardSidebar from "./NewDashboardSidebar"
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
        {/* Mobile Header */}
        {showSidebar && (
          <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b py-3 px-4 flex justify-between items-center shadow-sm">
            <div className="flex items-center">
              <div className="w-10"></div> {/* Placeholder for alignment */}
              <h2 className="text-lg font-bold tracking-tight text-primary ml-4">
                xFoundry Hub
              </h2>
            </div>
            <div className="text-xs">
              {profile?.institutionName || "Institution"}
            </div>
          </div>
        )}
        
        {/* Sidebar - only shown on protected pages */}
        {showSidebar && <DashboardSidebar profile={profile} onEditClick={onEditClick} />}
        
        {/* Main Content */}
        <main className={`flex-1 ${showSidebar ? 'md:ml-64' : ''} ${showSidebar ? 'pt-[60px] md:pt-4' : 'pt-4'}`}>
          <div className="container max-w-6xl mx-auto px-4 md:px-6">
            {showBreadcrumbs && <Breadcrumbs />}
            {children}
          </div>
        </main>

        {/* Footer with added padding */}
        <footer className={`border-t py-8 mt-8 text-center text-muted-foreground text-sm ${showSidebar ? 'md:ml-64' : ''}`}>
          <p>© {currentYear} xFoundry Education Platform. All rights reserved.</p>
        </footer>
      </div>
    </>
  )
}

export default Layout