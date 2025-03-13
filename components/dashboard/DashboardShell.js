"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import dynamic from "next/dynamic"
import Head from "next/head"
import { useDashboard } from "@/contexts/DashboardContext"
import ProperDashboardLayout from "./ProperDashboardLayout"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  getProgramIdFromUrl, 
  navigateToProgram, 
  navigateToDashboard,
  navigateToProfile,
  isProgramRoute,
  ROUTES 
} from '@/lib/routing'

// Dynamically import dashboard pages
const DashboardHome = dynamic(() => import("@/pages/dashboard/DashboardHome"), {
  loading: () => <PageSkeleton />
})

const ProgramDashboard = dynamic(() => import("@/pages/dashboard/ProgramDashboard"), {
  loading: () => <PageSkeleton />
})

// Placeholder for other dashboard pages
const ProfilePage = dynamic(() => import("@/pages/dashboard/ProfilePage"), {
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
    setIsEditModalOpen,
    setActiveProgram,
    getAllProgramInitiatives
  } = useDashboard()
  
  // Track current page and active program
  const [activePage, setActivePage] = useState("dashboard")
  const [title, setTitle] = useState("xFoundry Hub")
  const [activeProgramId, setActiveProgramId] = useState(null)
  
  // Routing utilities are now imported at the top of the file
  
  // Set active page based on URL path
  useEffect(() => {
    const path = router.pathname;
    const query = router.query;
    
    console.log(`Setting active page based on URL path: ${path}`, query);
    
    // All legacy path redirects are now handled by middleware.js
    // Just update the local state based on current URL
    
    // Check if this is a program route (either main program page or subpages)
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
    else if (path === "/dashboard") {
      setActivePage("dashboard");
      setTitle("xFoundry Hub");
    }
  }, [router.pathname, router.query, router, setActivePage, setActiveProgramId, setTitle, isProgramRoute]);
  
  // Handler for browser back/forward navigation - simplified with routing utilities
  useEffect(() => {
    // Define the handler function for popstate events
    const handlePopState = (event) => {
      // Import routing utilities
      const { isProgramRoute } = require('@/lib/routing');
      
      // Use router to get current state
      // This ensures we're using the real URL, not stale state
      const currentRouter = { 
        pathname: window.location.pathname,
        query: Object.fromEntries(new URLSearchParams(window.location.search))
      };
      
      console.log(`PopState event detected: ${currentRouter.pathname}`);
      
      // Handle program routes
      if (isProgramRoute(currentRouter)) {
        // Extract the program ID from the path
        const match = currentRouter.pathname.match(/\/program\/([^\/]+)(?:\/|$)/);
        if (match && match[1]) {
          const programId = match[1];
          console.log(`PopState detected program ID: ${programId}`);
          setActivePage('program');
          setActiveProgramId(programId);
        }
      }
      // Handle profile page
      else if (currentRouter.pathname === '/profile') {
        setActivePage('profile');
      }
      // Handle main dashboard
      else if (currentRouter.pathname === '/dashboard') {
        setActivePage('dashboard');
      }
    };
    
    // Add event listener for popstate events
    window.addEventListener('popstate', handlePopState);
    
    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [setActivePage, setActiveProgramId]);
  
  // Handle profile edit - set modal state directly
  const handleEditProfileClick = () => {
    console.log("Opening profile edit modal from DashboardShell");
    
    // Always set the modal state to open in the context
    setIsEditModalOpen(true);
  }
  
  // Handle client-side navigation using routing utilities
  const handleNavigation = (page) => {
    console.log(`Navigation requested to page: ${page}`);
    
    // Using routing utilities imported at the top of the file
    
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
        case "program": 
          // If we have an active program ID, navigate to that program
          if (activeProgramId) {
            const initiatives = getAllProgramInitiatives();
            const initiative = initiatives.find(init => init.id === activeProgramId);
            if (initiative) {
              setTitle(`${initiative.name} Dashboard`);
            } else {
              setTitle("Program Dashboard");
            }
            
            // Navigate with initiative name if available
            navigateToProgram(router, activeProgramId, { 
              shallow: true,
              initiativeName: initiative?.name 
            });
          } else {
            setTitle("Program Dashboard");
            // No program ID, navigate to program index
            router.push(ROUTES.PROGRAM.INDEX, undefined, { shallow: true });
          }
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
  
  // Handler for browser back/forward navigation - simplified with routing utilities
  useEffect(() => {
    const handlePopState = (event) => {
      // Import routing utilities
      const { isProgramRoute, isProgramSection, ROUTES } = require('@/lib/routing');
      
      // Use router to get current state
      // This ensures we're using the real URL, not stale state
      const currentRouter = { 
        pathname: window.location.pathname,
        query: Object.fromEntries(new URLSearchParams(window.location.search))
      };
      
      console.log(`PopState event detected: ${currentRouter.pathname}`);
      
      // Handle program routes
      if (isProgramRoute(currentRouter)) {
        // Extract the program ID from the path
        const match = currentRouter.pathname.match(/\/program\/([^\/]+)(?:\/|$)/);
        if (match && match[1]) {
          const programId = match[1];
          console.log(`PopState detected program ID: ${programId}`);
          setActivePage('program');
          setActiveProgramId(programId);
        }
      }
      // Handle profile page
      else if (currentRouter.pathname === '/profile') {
        setActivePage('profile');
      }
      // Handle main dashboard
      else if (currentRouter.pathname === '/dashboard') {
        setActivePage('dashboard');
      }
    };
    
    // Add event listener for popstate events
    window.addEventListener('popstate', handlePopState);
    
    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
  
  // Only show full loader on initial app load, never between page navigations
  // Consolidate all loading states to prevent multiple loaders
  const showFullLoader = !initialLoadComplete && (isLoading || !profile);
  
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
      ) : (
        getPageComponent()
      )}
    </ProperDashboardLayout>
  )
}