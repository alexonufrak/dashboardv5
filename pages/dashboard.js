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
  let setActiveProgram = null;
  
  try {
    const dashboardContext = useDashboard();
    setActiveProgram = dashboardContext?.setActiveProgram;
  } catch (error) {
    console.error("Error accessing dashboard context:", error);
  }
  
  const router = useRouter();
  
  // Import routing utilities at the top level, not inside effects
  const { getProgramIdFromUrl, navigateToProgram } = require('@/lib/routing');
  
  // Check URL parameters for program info and redirect to new URL structure if needed
  useEffect(() => {
    try {
      const programId = getProgramIdFromUrl(router);
      
      if (programId) {
        console.log(`Program specified in URL: ${programId}`);
        
        // Use routing utility to navigate to program
        navigateToProgram(router, programId, { replace: true });
      } else {
        // Check URL hash for program ID as another fallback
        if (typeof window !== 'undefined' && window.location.hash) {
          const hash = window.location.hash.substring(1);
          if (hash.startsWith('program-')) {
            const hashProgramId = hash.replace('program-', '');
            console.log(`Hash-based program detected: ${hashProgramId}`);
            
            // Use routing utility to navigate to program
            if (hashProgramId) {
              navigateToProgram(router, hashProgramId, { replace: true });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error handling URL parameters:", error);
    }
  }, [router, getProgramIdFromUrl, navigateToProgram]);
  
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