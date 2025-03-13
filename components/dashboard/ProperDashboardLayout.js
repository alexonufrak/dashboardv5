"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0/client"
import Head from "next/head"
import { AppSidebar } from "@/components/layout/app-sidebar"
import Breadcrumbs from "@/components/common/Breadcrumbs"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { isProgramRoute } from '@/lib/routing'

const ProperDashboardLayout = ({ 
  children, 
  title = "xFoundry Hub", 
  profile, 
  onEditClick,
  currentPage,
  onNavigate
}) => {
  const [currentYear, setCurrentYear] = useState("")
  const router = useRouter()
  const { user } = useUser()
  
  // isProgramRoute is now imported at the top of the file
  
  // Check if current route is a dashboard route - include dynamic program routes
  const isDashboard = router.pathname === "/dashboard" || 
                      router.pathname === "/profile" || 
                      router.pathname === "/program-dashboard" ||
                      isProgramRoute(router) ||
                      router.pathname.startsWith("/program/") ||
                      router.pathname.startsWith("/dashboard/program/") ||
                      router.pathname.startsWith("/dashboard/")
                      
  const showSidebar = isDashboard && user
  
  // Don't show breadcrumbs on main dashboard pages but show on program pages
  const showBreadcrumbs = router.pathname !== "/dashboard" && 
                          router.pathname !== "/program-dashboard" && 
                          !router.pathname.startsWith("/program/[programId]") &&
                          !router.pathname.startsWith("/dashboard/program/[programId]") &&
                          router.pathname !== "/dashboard/programs" &&  // Hide breadcrumbs on programs page
                          showSidebar

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
          <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-background border-b py-3 px-4 flex justify-between items-center shadow-xs">
            <div className="flex items-center">
              <div className="w-10"></div> {/* Placeholder for alignment */}
              <h2 className="text-lg font-bold tracking-tight text-primary ml-4">
                xFoundry Hub
              </h2>
            </div>
            <div className="text-xs text-muted-foreground">
              {profile?.institutionName || "Institution"}
            </div>
          </div>
          
          {/* Dashboard Sidebar using the new AppSidebar component */}
          <AppSidebar className="h-screen" />
          
          {/* Main Content */}
          <SidebarInset className="bg-background">
            <div className="pt-[60px] md:pt-4 overflow-x-hidden">
              <div className="mx-auto max-w-6xl px-4 md:px-6">
                {showBreadcrumbs && <Breadcrumbs />}
                
                {/* Content wrapper with page transitions */}
                <div className="proper-dashboard-layout-content">
                  {children}
                </div>
                
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
          
        </div>
      )}
    </>
  )
}

export default ProperDashboardLayout