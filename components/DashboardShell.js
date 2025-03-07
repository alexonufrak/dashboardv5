"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import dynamic from "next/dynamic"
import Head from "next/head"
import { useDashboard } from "@/contexts/DashboardContext"
import ProperDashboardLayout from "./ProperDashboardLayout"
import LoadingScreen from "./LoadingScreen"
import { Skeleton } from "./ui/skeleton"

// Dynamically import dashboard pages
const DashboardHome = dynamic(() => import("@/pages/dashboards/DashboardHome"), {
  loading: () => <PageSkeleton />
})

const ProgramDashboard = dynamic(() => import("@/pages/dashboards/ProgramDashboard"), {
  loading: () => <PageSkeleton />
})

// Placeholder for other dashboard pages
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

export default function DashboardShell() {
  const router = useRouter()
  const { 
    profile, 
    isLoading, 
    error, 
    refreshData,
    programError, // Track program errors specifically
    cohort, // Add cohort from context
    isEditModalOpen,
    setIsEditModalOpen
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
    
    // Handle redirect for dashboard-shell legacy path
    if (path === "/dashboard-shell") {
      router.replace("/dashboard", undefined, { shallow: true });
      return;
    }
    
    // Handle program-dashboard with ID
    if (path === "/program-dashboard/[programId]" && query.programId) {
      // This is a specific program page
      const programId = query.programId;
      setActivePage("program");
      
      // Set the active program in the state
      // We'll update context after component mount
      setActiveProgramId(programId);
      
      // Set a generic title first - we'll update it later
      setTitle("Program Dashboard");
    }
    // Standard routes
    else if (path === "/program-dashboard") {
      setActivePage("program");
      setTitle("Program Dashboard");
    } else if (path === "/profile") {
      setActivePage("profile");
      setTitle("Your Profile");
    } else if (path === "/dashboard") {
      setActivePage("dashboard");
      setTitle("xFoundry Hub");
    }
    
    // Simulate client-side redirect for nested dashboard paths
    if (path !== "/dashboard" && 
        path !== "/program-dashboard" && 
        path !== "/program-dashboard/[programId]" && 
        path !== "/profile") {
      if (path.startsWith("/dashboard")) {
        setActivePage("dashboard");
      }
    }
  }, [router.pathname, router.query])
  
  // Handle profile edit - set modal state directly
  const handleEditProfileClick = () => {
    console.log("Opening profile edit modal from DashboardShell");
    
    // Always set the modal state to open in the context
    setIsEditModalOpen(true);
  }
  
  // Handle client-side navigation
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
    } else {
      // Set the title based on the page
      switch (page) {
        case "dashboard":
          setTitle("xFoundry Hub")
          break
        case "program": 
          setTitle("Program Dashboard")
          break
        case "profile":
          setTitle("Your Profile")
          break
        default:
          setTitle("xFoundry Hub")
      }
    }
    
    // Update the URL using shallow routing to avoid full page reload
    // Use shallow routing to prevent getServerSideProps execution
    setTimeout(() => {
      const options = { 
        shallow: true,
        scroll: false 
      };
      
      if (programId) {
        // Navigate to program with ID
        router.push(`/program-dashboard/${programId}`, undefined, options)
      } else {
        // Regular navigation
        switch (page) {
          case "dashboard":
            router.push("/dashboard", undefined, options)
            break
          case "program":
            router.push("/program-dashboard", undefined, options)
            break
          case "profile":
            router.push("/profile", undefined, options)
            break
          default:
            router.push("/dashboard", undefined, options)
        }
      }
    }, 10) // Slight delay to ensure UI updates first
  }
  
  // Return appropriate page component based on active page
  const getPageComponent = () => {
    switch (activePage) {
      case "dashboard":
        return <DashboardHome onNavigate={handleNavigation} />
      case "program":
        return <ProgramDashboard onNavigate={handleNavigation} />
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
      
      // When initial profile loads, but we don't see cohort/program data yet,
      // trigger a manual refresh of program data
      if (!cohort && activePage === "program" && refreshData) {
        console.log("No program data found but on program page - triggering refresh")
        refreshData('program');
      }
    }
  }, [profile, cohort, activePage, initialLoadComplete, refreshData]);
  
  // Effect to sync activeProgramId with context and update the title
  useEffect(() => {
    if (activeProgramId && profile) {
      // Set the active program in context
      const { setActiveProgram, getAllProgramInitiatives } = useDashboard();
      
      if (setActiveProgram) {
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
    }
  }, [activeProgramId, profile]);
  
  // Only show full loader on initial app load, never between page navigations
  const showFullLoader = isLoading && !initialLoadComplete;
  
  // Show error message if there's an error
  if (error) {
    return (
      <ProperDashboardLayout title={title}>
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
      </ProperDashboardLayout>
    )
  }
  
  return (
    <ProperDashboardLayout 
      title={title} 
      profile={profile} 
      onEditClick={handleEditProfileClick}
      currentPage={activePage}
      onNavigate={handleNavigation}
    >
      <Head>
        <title>{title}</title>
      </Head>
      
      {showFullLoader ? (
        <LoadingScreen message="Loading dashboard data..." />
      ) : (
        getPageComponent()
      )}
    </ProperDashboardLayout>
  )
}