"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useDashboard } from "@/contexts/DashboardContext"
import ProfileEditModal from "@/components/profile/ProfileEditModal"
import { Toaster } from "sonner"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import dynamic from "next/dynamic"
import ProperDashboardLayout from "@/components/dashboard/ProperDashboardLayout"

// Dynamic import for ProgramDashboard to prevent context issues during build
const ProgramDashboard = dynamic(() => import("@/pages/dashboards/ProgramDashboard"), {
  loading: () => <div className="animate-pulse">Loading program dashboard...</div>
})

function ProgramPage() {
  const router = useRouter()
  const { programId } = router.query
  
  return (
    <>
      <ProgramPageContent programId={programId} />
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
function ProgramPageContent({ programId }) {
  const { 
    setActiveProgram, 
    profile, 
    isEditModalOpen, 
    setIsEditModalOpen, 
    getAllProgramInitiatives,
    getActiveProgramData
  } = useDashboard()
  const [pageTitle, setPageTitle] = useState("Program Dashboard")
  
  // Set the active program based on URL parameter
  useEffect(() => {
    if (programId) {
      console.log(`Setting active program from URL: ${programId}`)
      
      // Only set active program if it's different from the current one
      setActiveProgram(programId)
      
      // We don't try to set page title here to avoid initialization errors
    }
    // Note: we're intentionally omitting setActiveProgram
    // from the dependency array to avoid infinite re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId])
  
  // Set page title in a separate effect that runs when data is available
  useEffect(() => {
    // Only try to update title if we have a programId and profile is loaded
    if (programId && profile) {
      try {
        // Get initiative name from the active program data directly
        if (getActiveProgramData) {
          const activeProgram = getActiveProgramData(programId);
          if (activeProgram?.initiativeName) {
            setPageTitle(`${activeProgram.initiativeName} Dashboard`);
          }
        }
      } catch (error) {
        console.error("Error setting page title from program data:", error);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId, profile, getActiveProgramData])
  
  // Handle profile edit click
  const handleEditProfileClick = () => {
    console.log("Opening profile edit modal")
    setIsEditModalOpen(true)
  }
  
  // Return ProgramDashboard wrapped in proper layout
  return (
    <>
      <ProperDashboardLayout 
        title={pageTitle}
        profile={profile}
        onEditClick={handleEditProfileClick}
        currentPage={`program-${programId}`}
      >
        <ProgramDashboard programId={programId} />
      </ProperDashboardLayout>
      <Toaster position="top-right" />
    </>
  )
}

// Wrap with auth protection
export const getServerSideProps = withPageAuthRequired()

export default ProgramPage