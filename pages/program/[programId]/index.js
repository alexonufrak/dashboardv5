"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useDashboard } from "@/contexts/DashboardContext"
import DashboardShell from "@/components/DashboardShell"
import ProfileEditModal from "@/components/ProfileEditModal"
import { Toaster } from "sonner"
import { useEffect } from "react"
import { useRouter } from "next/router"

function ProgramPage() {
  const router = useRouter()
  const { programId } = router.query
  
  return (
    <>
      <ProgramPageContent />
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
function ProgramPageContent() {
  const router = useRouter()
  const { programId } = router.query
  const { setActiveProgram } = useDashboard()
  
  // Set the active program based on URL parameter
  useEffect(() => {
    if (programId) {
      console.log(`Setting active program from URL: ${programId}`)
      setActiveProgram(programId)
    }
  }, [programId, setActiveProgram])
  
  return (
    <>
      <DashboardShell />
      <Toaster position="top-right" />
    </>
  )
}

// Wrap with auth protection
export const getServerSideProps = withPageAuthRequired()

export default ProgramPage