"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext"
import DashboardShell from "@/components/DashboardShell"
import ProfileEditModal from "@/components/ProfileEditModal"
import { Toaster } from "sonner"
import { useEffect } from "react"
import { useRouter } from "next/router"

function ProgramDashboard() {
  const router = useRouter()
  
  return (
    <DashboardProvider>
      <ProgramDashboardContent />
      {/* Render the ProfileEditModal at the top level */}
      <ProfileModalWrapper />
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

// Separate the content to ensure context is available
function ProgramDashboardContent() {
  const router = useRouter()
  
  // Set program dashboard as the initial view
  useEffect(() => {
    // Just ensure the activePage is set to program in the DashboardShell
    // We don't need to change the URL as we're already on /program-dashboard
  }, [])
  
  return (
    <>
      <DashboardShell />
      <Toaster position="top-right" />
    </>
  )
}

// Wrap with auth protection
export const getServerSideProps = withPageAuthRequired()

export default ProgramDashboard