"use client"

import Head from "next/head"
import { useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import LoadingScreen from "@/components/common/LoadingScreen"
import { Toaster } from "sonner"
import styles from "@/styles/dashboard.module.css"

/**
 * Shared dashboard layout component used across different dashboard pages
 * 
 * @param {Object} props
 * @param {ReactNode} props.children - Page content
 * @param {string} props.title - Page title
 * @param {Object} props.profile - User profile data
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.loadingMessage - Custom loading message
 */
export default function DashboardLayout({ 
  children, 
  title = "xFoundry Hub", 
  profile,
  isLoading = false,
  loadingMessage = "Loading dashboard...",
  error = null
}) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="xFoundry Hub - Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <SidebarProvider defaultOpen>
        <div className="flex min-h-screen h-screen">
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
          
          {/* Sidebar */}
          <AppSidebar className="h-screen" />
          
          {/* Main Content */}
          <SidebarInset className="bg-background flex-1 overflow-auto">
            <div className="pt-[60px] md:pt-4 h-full w-full flex flex-col">
              <div className="w-full h-full px-4 md:px-6 flex flex-col flex-1">
                {/* Content wrapper with page transitions */}
                <div className={`dashboard-content flex-1 flex flex-col ${styles.dashboardContent}`}>
                  {error ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                        <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
                        <p className="text-red-700 mb-4">{error}</p>
                        <button 
                          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                          onClick={() => window.location.reload()}
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  ) : isLoading ? (
                    <LoadingScreen message={loadingMessage} />
                  ) : (
                    <div className={`${styles.dashboardContainer} flex-1 flex flex-col`}>
                      {children}
                    </div>
                  )}
                </div>
                
                {/* Footer */}
                <footer className="border-t py-6 mt-auto text-center text-muted-foreground text-sm">
                  <p>© {new Date().getFullYear()} xFoundry Education Platform. All rights reserved.</p>
                </footer>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
      <Toaster position="top-right" />
    </>
  )
}