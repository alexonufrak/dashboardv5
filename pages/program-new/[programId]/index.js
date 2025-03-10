"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import dynamic from "next/dynamic"
import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useDashboard } from "@/contexts/DashboardContext"
import { Skeleton } from "@/components/ui/skeleton"
import DashboardLayout from "@/components/layout/DashboardLayout"
import ProfileEditModal from "@/components/profile/ProfileEditModal"

const ProgramDashboard = dynamic(() => import("@/pages/dashboards/ProgramDashboard"), {
  loading: () => <PageSkeleton />
})

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
    error,
    isEditModalOpen, 
    setIsEditModalOpen, 
    getActiveProgramData,
    handleProfileUpdate
  } = useDashboard()
  
  const [pageTitle, setPageTitle] = useState("Program Dashboard")
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  
  useEffect(() => {
    if (programId) {
      setActiveProgram(programId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId])
  
  useEffect(() => {
    if (programId && profile) {
      try {
        if (getActiveProgramData) {
          const activeProgram = getActiveProgramData(programId)
          if (activeProgram?.initiativeName) {
            setPageTitle(`${activeProgram.initiativeName} Dashboard`)
          }
        }
      } catch (error) {
        console.error("Error setting page title from program data:", error)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId, profile, getActiveProgramData])
  
  useEffect(() => {
    if (profile && !initialLoadComplete) {
      setInitialLoadComplete(true)
    }
  }, [profile, initialLoadComplete])
  
  const showFullLoader = !initialLoadComplete && (isLoading || !profile)
  
  useEffect(() => {
    return () => {
      if (isEditModalOpen) {
        setIsEditModalOpen(false)
      }
    }
  }, [isEditModalOpen, setIsEditModalOpen])
  
  return (
    <>
      <DashboardLayout
        title={pageTitle}
        profile={profile}
        isLoading={showFullLoader}
        loadingMessage="Loading program dashboard..."
        error={error}
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

export const getServerSideProps = withPageAuthRequired()

export default ProgramPage