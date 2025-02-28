"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0/client"
import Head from "next/head"
import ProperDashboardSidebar from "./ProperDashboardSidebar"
import Breadcrumbs from "./Breadcrumbs"
import { SidebarProvider, SidebarInset } from "./ui/sidebar"

const ProperDashboardLayout = ({ 
  children, 
  title = "xFoundry Hub", 
  profile, 
  onEditClick 
}) => {
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

      {showSidebar ? (
        <SidebarProvider defaultOpen>
          {/* Mobile Header - Only visible on mobile */}
          <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b py-3 px-4 flex justify-between items-center shadow-xs">
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
          
          {/* Dashboard Sidebar */}
          <ProperDashboardSidebar profile={profile} onEditClick={onEditClick} />
          
          {/* Main Content */}
          <SidebarInset className="bg-background">
            <div className="pt-[60px] md:pt-4 overflow-x-hidden">
              <div className="mx-auto max-w-6xl px-4 md:px-6">
                {showBreadcrumbs && <Breadcrumbs />}
                {children}
                
                {/* Footer */}
                <footer className="border-t py-8 mt-8 text-center text-muted-foreground text-sm">
                  <p>© {currentYear} xFoundry Education Platform. All rights reserved.</p>
                </footer>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      ) : (
        <div className="min-h-screen bg-background overflow-x-hidden">
          {/* Main Content without sidebar */}
          <main className="flex-1 pt-4 overflow-x-hidden">
            <div className="container max-w-6xl mx-auto px-4 md:px-6">
              {children}
            </div>
          </main>
          
          {/* Footer without sidebar */}
          <footer className="border-t py-8 mt-8 text-center text-muted-foreground text-sm">
            <p>© {currentYear} xFoundry Education Platform. All rights reserved.</p>
          </footer>
        </div>
      )}
    </>
  )
}

export default ProperDashboardLayout