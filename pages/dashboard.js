"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext"
import DashboardShell from "@/components/DashboardShell"
import ProfileEditModal from "@/components/ProfileEditModal"
import { Toaster } from "sonner"

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
function DashboardContent() {
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