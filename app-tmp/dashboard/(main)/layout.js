'use client'

/**
 * Dashboard main section layout 
 * This is a client component that provides shared UI for dashboard pages
 * Using the route group pattern with (main) folder
 */

import { useState, useEffect } from 'react'
import { useUser } from '@auth0/nextjs-auth0'
import { useDashboard } from '@/contexts/DashboardContext'
import { Skeleton } from '@/components/ui/skeleton'
import { SidebarProvider, SidebarTrigger, Sidebar, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { LogOut, Edit } from 'lucide-react'
import RefreshButton from '@/components/common/RefreshButton'
import { useRouter } from 'next/navigation'

/**
 * Dashboard Main Layout
 * Groups dashboard pages with common UI for better organization
 */
export default function DashboardMainLayout({ children, section = 'dashboard' }) {
  const { user } = useUser()
  const dashboardContext = useDashboard()
  const router = useRouter()
  
  // Get profile from context if available
  const profile = dashboardContext?.profile
  const isLoading = dashboardContext?.isLoading
  
  // Edit modal state
  const isEditModalOpen = dashboardContext?.isEditModalOpen || false
  const setIsEditModalOpen = dashboardContext?.setIsEditModalOpen
  
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sectionTitle, setSectionTitle] = useState('Dashboard')
  
  // Update section title based on current section
  useEffect(() => {
    switch (section) {
      case 'profile':
        setSectionTitle('Your Profile')
        break
      case 'programs':
        setSectionTitle('Programs')
        break
      case 'program':
        setSectionTitle('Program Dashboard')
        break
      default:
        setSectionTitle('xFoundry Hub')
    }
  }, [section])
  
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 w-full py-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-48 w-full rounded-lg mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-sidebar" style={{ backgroundColor: 'var(--color-sidebar)' }}>
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen} className="flex flex-col">
        <div className="flex flex-1">
          <Sidebar variant="inset">
            <AppSidebar pageTitle={sectionTitle} />
          </Sidebar>
          
          <SidebarInset className="bg-background dark:bg-neutral-950">
            {/* Content header inside the inset */}
            <header className="sticky top-0 z-50 flex w-full items-center justify-center border-b border-neutral-200 dark:border-neutral-800 bg-background">
              <div className="flex h-14 w-full items-center gap-2 px-4">
                <SidebarTrigger className="mr-2" />
                <h2 className="text-lg font-bold truncate">{sectionTitle}</h2>
                
                {/* User Avatar with Dropdown - align to the right */}
                <div className="ml-auto flex items-center gap-2">
                  {/* Data refresh button - only shown when dashboard context is available */}
                  {dashboardContext && (
                    <RefreshButton 
                      lastUpdated={dashboardContext.getLastUpdatedTimestamp?.()}
                      queryKeys={["submissions", "milestones", "teams", "profile", "participation"]}
                      variant="ghost"
                      size="sm"
                      className="hover:bg-background dark:hover:bg-neutral-800 tooltip-trigger"
                      aria-label="Refresh dashboard data"
                    />
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary-foreground/10">
                        <Avatar className="h-8 w-8 rounded-full border-2 border-primary-foreground/20">
                          <AvatarImage src={profile?.picture || user?.picture} alt={profile?.firstName || user?.name || "User"} />
                          <AvatarFallback>
                            {profile?.firstName?.[0]}{profile?.lastName?.[0] || 
                             (user?.name ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2) : "U")}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {profile?.firstName} {profile?.lastName || (user?.name || "User")}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user?.email || profile?.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setIsEditModalOpen?.(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => window.location.href = '/auth/logout'}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>

            {/* Content body */}
            <div className="p-6">
              <div className="main-dashboard-layout-content">
                {children}
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}