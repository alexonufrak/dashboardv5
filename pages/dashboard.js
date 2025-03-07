"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext"
import DashboardShell from "@/components/DashboardShell"
import ProfileEditModal from "@/components/ProfileEditModal"
import { Toaster } from "sonner"
import { useEffect } from "react"
import { useRouter } from "next/router"

function Dashboard() {
  return (
    <>
      <DashboardContent />
      <ProfileModalWrapper />
    </>
  )
}

// Set a static property to flag that this component needs DashboardContext
Dashboard.needsDashboardContext = true;

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

// Separate the content to ensure context is available
// Also check URL for program-specific navigation
function DashboardContent() {
  const { selectActiveProgram } = useDashboard();
  const router = useRouter();
  
  // Check URL parameters for program info
  useEffect(() => {
    // Get program ID from query parameters
    const { program } = router.query;
    
    if (program) {
      console.log(`Program specified in URL: ${program}`);
      
      // Update the context with the program ID
      if (selectActiveProgram) {
        selectActiveProgram(program);
      }
    } else {
      // Check path-based program URL as fallback
      // Only run on client side
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        
        // If we're on a program-specific URL, extract the program ID
        if (path.startsWith('/program-dashboard/')) {
          const programId = path.replace('/program-dashboard/', '');
          console.log(`Path-based program detected: ${programId}`);
          
          // Update the context
          if (selectActiveProgram && programId) {
            selectActiveProgram(programId);
          }
          
          // Update URL to query-based format (cleaner)
          router.replace(`/dashboard?program=${programId}`, undefined, { shallow: true });
        }
      }
    }
  }, [router.query, selectActiveProgram, router]);
  
  return (
    <>
      <DashboardShell />
      <Toaster position="top-right" />
    </>
  )
}

// Wrap with auth protection
export const getServerSideProps = withPageAuthRequired()

export default Dashboard