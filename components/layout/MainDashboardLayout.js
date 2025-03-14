"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0/client"
import Head from "next/head"
import { AppSidebar } from "./app-sidebar"
import Breadcrumbs from "@/components/common/Breadcrumbs"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { isProgramRoute } from '@/lib/routing'
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "sonner"
import ProfileEditModal from "@/components/profile/ProfileEditModal"
import { useDashboard } from "@/contexts/DashboardContext"

/**
 * Main dashboard layout component for all dashboard views
 * Consolidated from ProperDashboardLayout
 */
const MainDashboardLayout = ({ 
  children, 
  title = "xFoundry Hub", 
  profile: propProfile, // Renamed to avoid conflicts with context profile
  onEditClick,
  currentPage,
  onNavigate,
  isLoading: propsLoading = false,
  error: propsError = null,
  showBreadcrumbs = true
}) => {
  const [currentYear, setCurrentYear] = useState("")
  const router = useRouter()
  const { user } = useUser()
  
  // Use dashboard context if available, or fall back to props
  const dashboardContext = useDashboard()
  
  // Get profile from context if available, otherwise use props
  const profile = dashboardContext?.profile || propProfile
  const isLoading = dashboardContext?.isLoading || propsLoading
  const error = dashboardContext?.error || propsError
  
  // Edit modal state (local fallback if context not available)
  const [localEditModalOpen, setLocalEditModalOpen] = useState(false)
  
  // Use context state if available, otherwise use local state
  const isEditModalOpen = dashboardContext?.isEditModalOpen || localEditModalOpen
  const setIsEditModalOpen = dashboardContext?.setIsEditModalOpen || setLocalEditModalOpen
  
  // If onEditClick is provided as a prop, call it when the edit modal is opened
  // This maintains compatibility with ProperDashboardLayout's API
  useEffect(() => {
    if (isEditModalOpen && onEditClick) {
      onEditClick();
    }
  }, [isEditModalOpen, onEditClick]);
  
  // All paths under /dashboard should be considered dashboard routes
  const isDashboard = router.pathname.startsWith("/dashboard") || 
                      router.pathname === "/profile" || 
                      router.pathname === "/program-dashboard" ||
                      isProgramRoute(router) ||
                      router.pathname.startsWith("/program/")
                      
  // Always show sidebar on dashboard routes if user is logged in
  const showSidebar = isDashboard && user
  
  // Determine whether to show breadcrumbs
  // Add programs page to the list of pages where breadcrumbs should be hidden
  const shouldShowBreadcrumbs = showBreadcrumbs && 
                          router.pathname !== "/dashboard" && 
                          router.pathname !== "/program-dashboard" && 
                          !router.pathname.startsWith("/program/[programId]") &&
                          !router.pathname.startsWith("/dashboard/program/[programId]") &&
                          !router.pathname.startsWith("/dashboard/programs/apply/") && // Hide breadcrumbs on application page
                          router.pathname !== "/dashboard/programs" && // Hide breadcrumbs on programs page
                          showSidebar

  useEffect(() => {
    setCurrentYear(new Date().getFullYear())
  }, [])

  // Error state
  if (error) {
    // Support both string errors and object errors with message and onRetry
    const errorMessage = typeof error === 'string' ? error : error.message || 'Unknown error';
    const handleRetry = typeof error === 'object' && error.onRetry 
      ? error.onRetry 
      : () => window.location.reload();
    
    return (
      <LayoutShell 
        title={title} 
        profile={profile} 
        showSidebar={showSidebar} 
        shouldShowBreadcrumbs={shouldShowBreadcrumbs}
      >
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
            <p className="text-red-700 mb-4">{errorMessage}</p>
            <button 
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              onClick={handleRetry}
            >
              Retry
            </button>
          </div>
        </div>
      </LayoutShell>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <LayoutShell 
        title={title} 
        profile={profile} 
        showSidebar={showSidebar}
        shouldShowBreadcrumbs={shouldShowBreadcrumbs}
      >
        <div className="space-y-6 w-full py-6">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-48 w-full rounded-lg mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
          <div className="mt-6">
            <Skeleton className="h-6 w-32 mb-3" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
      </LayoutShell>
    );
  }

  // Normal content state
  // Define update profile handler
  const handleProfileUpdate = async (updatedProfile) => {
    try {
      if (dashboardContext?.updateProfile) {
        // Use context handler if available
        await dashboardContext.updateProfile(updatedProfile);
      } else {
        // Otherwise fallback to API call
        const response = await fetch('/api/user/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedProfile),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update profile');
        }
      }
      
      // Close modal after updating
      setIsEditModalOpen(false);
      
      // Reload page to show updated profile if needed
      if (!dashboardContext) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <>
      <LayoutShell 
        title={title} 
        profile={profile} 
        showSidebar={showSidebar}
        shouldShowBreadcrumbs={shouldShowBreadcrumbs}
        onNavigate={onNavigate}
      >
        {children}
      </LayoutShell>
      
      {/* Add profile edit modal to all dashboard pages */}
      {profile && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={profile}
          onSave={handleProfileUpdate}
        />
      )}
    </>
  )
}

// Internal layout shell component
function LayoutShell({ children, title, profile, showSidebar, shouldShowBreadcrumbs, onNavigate }) {
  // For dashboard pages, always show the sidebar if the user is logged in
  const renderWithSidebar = showSidebar; 

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="xFoundry Hub - Empowering education through technology" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {renderWithSidebar ? (
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
            <div className="pt-[60px] md:pt-4 overflow-x-hidden h-full">
              <div className="mx-auto max-w-6xl px-4 md:px-6 h-full">
                {shouldShowBreadcrumbs && <Breadcrumbs />}
                
                {/* Content wrapper with page transitions */}
                <div className="main-dashboard-layout-content proper-dashboard-layout-content h-full">
                  {children}
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      ) : (
        <div className="min-h-screen bg-background overflow-x-hidden h-full">
          {/* Main Content without sidebar */}
          <main className="flex-1 pt-4 overflow-x-hidden h-full">
            <div className="container max-w-6xl mx-auto px-4 md:px-6 h-full">
              {children}
            </div>
          </main>
        </div>
      )}
      <Toaster position="top-right" />
    </>
  )
}

export default MainDashboardLayout