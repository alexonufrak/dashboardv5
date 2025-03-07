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
// Also check URL for program-specific navigation - but with more robust error handling
function DashboardContent() {
  // Try to safely access the dashboard context
  let selectActiveProgram = null;
  
  try {
    const dashboardContext = useDashboard();
    selectActiveProgram = dashboardContext?.selectActiveProgram;
  } catch (error) {
    console.error("Error accessing dashboard context:", error);
  }
  
  const router = useRouter();
  
  // Check URL parameters for program info
  useEffect(() => {
    try {
      // Get program ID from query parameters
      const { program } = router.query;
      
      if (program) {
        console.log(`Program specified in URL: ${program}`);
        
        // Update the context with the program ID, but only if context is available
        if (typeof selectActiveProgram === 'function') {
          try {
            selectActiveProgram(program);
          } catch (error) {
            console.error("Error setting active program:", error);
          }
        } else {
          console.warn("selectActiveProgram function not available");
        }
      } else {
        // Check URL hash for program ID as another fallback
        if (typeof window !== 'undefined' && window.location.hash) {
          const hash = window.location.hash.substring(1);
          if (hash.startsWith('program-')) {
            const programId = hash.replace('program-', '');
            console.log(`Hash-based program detected: ${programId}`);
            
            if (typeof selectActiveProgram === 'function' && programId) {
              try {
                selectActiveProgram(programId);
              } catch (error) {
                console.error("Error setting active program from hash:", error);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error handling URL parameters:", error);
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