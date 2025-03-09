"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext"
import dynamic from "next/dynamic"
import Head from "next/head"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import ProfileEditModal from "@/components/profile/ProfileEditModal"
import { Toaster } from "sonner"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import LoadingScreen from "@/components/common/LoadingScreen"
import { 
  isProgramRoute, 
  getProgramIdFromUrl, 
  navigateToProgram, 
  navigateToDashboard,
  navigateToProfile,
  ROUTES 
} from '@/lib/routing'

// Dynamically import dashboard pages
const DashboardHome = dynamic(() => import("@/pages/dashboards/DashboardHome"), {
  loading: () => <PageSkeleton />
})

const ProgramDashboard = dynamic(() => import("@/pages/dashboards/ProgramDashboard"), {
  loading: () => <PageSkeleton />
})

const ProfilePage = dynamic(() => import("@/pages/dashboards/ProfilePage"), {
  loading: () => <PageSkeleton />
})

// Page skeleton for loading state
function PageSkeleton() {
  return (
    <div className="space-y-4 pt-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  )
}

function Dashboard() {
  return (
    <DashboardProvider>
      <DashboardContent />
      <ProfileModalWrapper />
      <Toaster position="top-right" />
    </DashboardProvider>
  )
}

// Helper component to render ProfileEditModal with the right context
function ProfileModalWrapper() {
  const { profile, isEditModalOpen, setIsEditModalOpen, handleProfileUpdate } = useDashboard()
  
  return (
    profile && (
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onSave={handleProfileUpdate}
      />
    )
  )
}

// Main dashboard content
function DashboardContent() {
  const router = useRouter()
  const { 
    profile, 
    isLoading, 
    error, 
    refreshData,
    programError,
    cohort,
    isEditModalOpen,
    setIsEditModalOpen,
    setActiveProgram,
    getAllProgramInitiatives
  } = useDashboard()
  
  // Track current page and active program
  const [activePage, setActivePage] = useState("dashboard")
  const [title, setTitle] = useState("xFoundry Hub")
  const [activeProgramId, setActiveProgramId] = useState(null)
  
  // Set active page based on URL path
  useEffect(() => {
    const path = router.pathname;
    const query = router.query;
    
    console.log(`Setting active page based on URL path: ${path}`, query);
    
    // Check if this is a program route
    if (isProgramRoute(router)) {
      // Get the program ID from the URL
      const programId = query.programId;
      
      if (programId) {
        console.log(`Program route with ID: ${programId}`);
        setActivePage("program");
        setActiveProgramId(programId);
        setTitle("Program Dashboard"); // Generic title, will be updated later
      }
    } 
    // Handle profile page
    else if (path === "/profile") {
      setActivePage("profile");
      setTitle("Your Profile");
    } 
    // Handle main dashboard
    else if (path === "/dashboard-new" || path === "/dashboard") {
      setActivePage("dashboard");
      setTitle("xFoundry Hub");
    }
  }, [router.pathname, router.query]);
  
  // Handle navigation
  const handleNavigation = (page) => {
    console.log(`Navigation requested to page: ${page}`);
    
    // Extract program ID if this is a program-specific page
    let programId = null;
    if (page.startsWith('program-')) {
      programId = page.replace('program-', '');
      page = 'program'; // Set base page to program
    }
    
    // If we're already on this page and it's not a program page with ID, don't do anything
    if (page === activePage && !programId) {
      console.log('Already on this page, skipping navigation');
      return;
    }
    
    // Update active page immediately without waiting for router change
    setActivePage(page);
    
    // Set the active program ID if this is a program page
    if (programId) {
      // Store the ID in component state
      setActiveProgramId(programId);
      setTitle("Program Dashboard");
      
      // Use routing utility to update URL
      navigateToProgram(router, programId, { shallow: true });
    } else {
      // Set the title based on the page and navigate appropriately
      switch (page) {
        case "dashboard":
          setTitle("xFoundry Hub");
          navigateToDashboard(router, { shallow: true });
          break;
        case "profile":
          setTitle("Your Profile");
          navigateToProfile(router, { shallow: true });
          break;
        default:
          setTitle("xFoundry Hub");
          navigateToDashboard(router, { shallow: true });
      }
    }
  }
  
  // Return appropriate page component based on active page
  const getPageComponent = () => {
    // Check if we have an active program ID
    const showProgram = activeProgramId !== null;
    
    // Add the program ID to the ProgramDashboard props if available
    const programProps = activeProgramId ? { programId: activeProgramId } : {};
    
    // If program ID is set, always show program dashboard regardless of activePage
    if (showProgram) {
      return <ProgramDashboard onNavigate={handleNavigation} {...programProps} />;
    }
    
    // Otherwise, follow the regular activePage logic
    switch (activePage) {
      case "dashboard":
        return <DashboardHome onNavigate={handleNavigation} />
      case "profile":
        return <ProfilePage onNavigate={handleNavigation} />
      default:
        return <DashboardHome onNavigate={handleNavigation} />
    }
  }
  
  // Track initial load state to only show loader on first load
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Set initialLoadComplete to true once profile is loaded
  useEffect(() => {
    if (profile && !initialLoadComplete) {
      setInitialLoadComplete(true);
    }
  }, [profile, initialLoadComplete]);
  
  // Effect to sync activeProgramId with context and update the title
  useEffect(() => {
    if (activeProgramId && profile) {
      console.log(`Setting active program in context: ${activeProgramId}`);
      setActiveProgram(activeProgramId);
      
      // Update title with initiative name
      const initiatives = getAllProgramInitiatives();
      if (initiatives && initiatives.length > 0) {
        const initiative = initiatives.find(init => init.id === activeProgramId);
        if (initiative) {
          setTitle(`${initiative.name} Dashboard`);
        }
      }
    }
  }, [activeProgramId, profile, setActiveProgram, getAllProgramInitiatives]);
  
  // Only show full loader on initial app load
  const showFullLoader = !initialLoadComplete && (isLoading || !profile);
  
  // Show error message if there's an error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            onClick={() => refreshData('all')}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="xFoundry Hub - Empowering education through technology" />
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
            <div className="pt-[60px] md:pt-4 overflow-x-hidden h-full">
              <div className="mx-auto max-w-6xl px-4 md:px-6 h-full flex flex-col">
                {/* Content wrapper with page transitions */}
                <div className="proper-dashboard-layout-content flex-1">
                  {showFullLoader ? (
                    <LoadingScreen message="Loading dashboard..." />
                  ) : (
                    getPageComponent()
                  )}
                </div>
                
                {/* Footer */}
                <footer className="border-t py-8 mt-8 text-center text-muted-foreground text-sm">
                  <p>© {new Date().getFullYear()} xFoundry Education Platform. All rights reserved.</p>
                </footer>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </>
  )
}

// Wrap with auth protection
export const getServerSideProps = withPageAuthRequired()

export default Dashboard