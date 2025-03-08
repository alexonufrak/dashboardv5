"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useDashboard } from "@/contexts/DashboardContext"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { Toaster } from "sonner"
import ProgramLayout from "@/components/program/ProgramLayout"
import BountyList from "@/components/program/xtrapreneurs/BountyList"
import ProfileEditModal from "@/components/profile/ProfileEditModal"

function XtrapreneursBountiesPage() {
  const router = useRouter()
  const { programId } = router.query
  
  return (
    <>
      <BountiesPageContent />
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
function BountiesPageContent() {
  const router = useRouter()
  const { programId } = router.query
  const { setActiveProgram, getAllProgramInitiatives } = useDashboard()
  
  // Set the active program based on URL parameter
  useEffect(() => {
    if (programId) {
      console.log(`Setting active program from URL: ${programId}`)
      setActiveProgram(programId)
      
      // Verify this is an Xtrapreneurs program, otherwise redirect
      const initiatives = getAllProgramInitiatives()
      const initiative = initiatives.find(init => init.id === programId)
      
      if (!initiative || !initiative.name.toLowerCase().includes('xtrapreneur')) {
        console.log("Not an Xtrapreneurs program, redirecting to overview")
        router.push(`/program/${programId}`)
      }
    }
  }, [programId, setActiveProgram, getAllProgramInitiatives, router])
  
  if (!programId) {
    return <div>Loading...</div>
  }
  
  return (
    <>
      <ProgramLayout programId={programId} activeTab="bounties">
        <BountyList programId={programId} />
      </ProgramLayout>
      <Toaster position="top-right" />
    </>
  )
}

// Wrap with auth protection
export const getServerSideProps = withPageAuthRequired()

export default XtrapreneursBountiesPage