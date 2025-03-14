"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useDashboard } from "@/contexts/DashboardContext"
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
// ProfileEditModal is now included in MainDashboardLayout
import { Skeleton } from "@/components/ui/skeleton"
import MainDashboardLayout from "@/components/layout/MainDashboardLayout"
import { 
  isProgramRoute, 
  navigateToProgram, 
  navigateToDashboard,
  navigateToProfile,
  navigateToPrograms
} from '@/lib/routing'

// Dynamically import dashboard pages
const DashboardHome = dynamic(() => import("@/pages/dashboard/DashboardHome"), {
  loading: () => <PageSkeleton />
})

const ProgramDashboard = dynamic(() => import("@/components/program/ProgramDashboard"), {
  loading: () => <PageSkeleton />
})

const ProfilePage = dynamic(() => import("@/pages/dashboard/ProfilePage"), {
  loading: () => <PageSkeleton />
})

const ProgramsPage = dynamic(() => import("@/pages/dashboard/programs/index"), {
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
  const { 
    profile, 
    isLoading, 
    error, 
    refreshData,
    programError,
    isEditModalOpen,
    setIsEditModalOpen,
    setActiveProgram,
    getAllProgramInitiatives,
    handleProfileUpdate
  } = useDashboard()
  
  const router = useRouter()
  
  // Track current page and active program
  const [activePage, setActivePage] = useState("dashboard")
  const [title, setTitle] = useState("xFoundry Hub")
  const [activeProgramId, setActiveProgramId] = useState(null)
  
  // Set active page based on URL path
  useEffect(() => {
    const path = router.pathname;
    const query = router.query;
    
    // Check if this is a program route
    if (isProgramRoute(router)) {
      // Get the program ID from the URL
      const programId = query.programId;
      
      if (programId) {
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
    // Handle programs page
    else if (path === "/dashboard/programs") {
      setActivePage("programs");
      setTitle("Programs");
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
        case "programs":
          setTitle("Programs");
          navigateToPrograms(router, { shallow: true });
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
      case "programs":
        return <ProgramsPage onNavigate={handleNavigation} />
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
  
  // Use refreshData function for error retry
  const handleRetry = () => {
    if (refreshData) {
      refreshData('all');
    } else {
      window.location.reload();
    }
  };
  
  // Render profile edit modal
  useEffect(() => {
    // Component did mount - set up profile edit modal if needed
    return () => {
      // Component will unmount - close any open modals
      if (isEditModalOpen) {
        setIsEditModalOpen(false);
      }
    };
  }, [isEditModalOpen, setIsEditModalOpen]);
  
  return (
    <MainDashboardLayout
      title={title}
      profile={profile}
      currentPage={activePage}
      onNavigate={handleNavigation}
      isLoading={showFullLoader}
      error={error && { message: error, onRetry: handleRetry }}
    >
      {getPageComponent()}
    </MainDashboardLayout>
  )
}

// Wrap with auth protection
export const getServerSideProps = withPageAuthRequired()

export default Dashboard