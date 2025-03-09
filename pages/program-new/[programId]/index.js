"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useDashboard } from "@/contexts/DashboardContext"
import ProfileEditModal from "@/components/profile/ProfileEditModal"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import DashboardLayout from "@/components/layout/DashboardLayout"

// Dynamic import for ProgramDashboard with a proper skeleton
const ProgramDashboard = dynamic(() => import("@/pages/dashboards/ProgramDashboard"), {
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

function ProgramPage() {
  const router = useRouter()
  const { programId } = router.query
  
  const { 
    setActiveProgram, 
    profile, 
    isLoading,
    isEditModalOpen, 
    setIsEditModalOpen, 
    getActiveProgramData,
    handleProfileUpdate
  } = useDashboard()
  
  const [pageTitle, setPageTitle] = useState("Program Dashboard")
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Set the active program based on URL parameter
  useEffect(() => {
    if (programId) {
      console.log(`Setting active program from URL: ${programId}`)
      setActiveProgram(programId)
    }
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
  
  // Set initialLoadComplete to true once profile is loaded
  useEffect(() => {
    if (profile && !initialLoadComplete) {
      setInitialLoadComplete(true);
    }
  }, [profile, initialLoadComplete]);
  
  // Only show full loader on initial app load
  const showFullLoader = !initialLoadComplete && (isLoading || !profile);
  
  // Close modal on unmount
  useEffect(() => {
    return () => {
      if (isEditModalOpen) {
        setIsEditModalOpen(false);
      }
    };
  }, [isEditModalOpen, setIsEditModalOpen]);
  
  return (
    <>
      <DashboardLayout
        title={pageTitle}
        profile={profile}
        isLoading={showFullLoader}
        loadingMessage="Loading program dashboard..."
      >
        <ProgramDashboard programId={programId} />
      </DashboardLayout>
      
      {profile && isEditModalOpen && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={profile}
          onSave={handleProfileUpdate}
        />
      )}
    </>
  )
}

// Wrap with auth protection
export const getServerSideProps = withPageAuthRequired()

export default ProgramPage