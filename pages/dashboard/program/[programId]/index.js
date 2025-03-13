"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import dynamic from "next/dynamic"
import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useDashboard } from "@/contexts/DashboardContext"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import ProperDashboardLayout from "@/components/dashboard/ProperDashboardLayout"
import ProfileEditModal from "@/components/profile/ProfileEditModal"

const ProgramDashboard = dynamic(() => import("@/components/program/ProgramDashboard"), {
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
    handleProfileUpdate,
    teamData,
    cohort,
    milestones,
    submissions,
    bounties,
    refreshData
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
      <ProperDashboardLayout
        title={pageTitle}
        profile={profile}
        onEditClick={() => setIsEditModalOpen(true)}
        currentPage="program"
        onNavigate={(route) => router.push(route)}
      >
        {showFullLoader ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading program dashboard...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-6 max-w-md">
              <h2 className="text-lg font-semibold mb-2">Error Loading Dashboard</h2>
              <p className="mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <ProgramDashboard 
            programId={programId}
            programData={getActiveProgramData ? getActiveProgramData(programId) : null}
            teamData={teamData}
            cohort={cohort}
            milestones={milestones}
            submissions={submissions}
            bounties={bounties}
            programError={error}
            refreshData={refreshData}
            onNavigate={(route) => router.push(route)}
          />
        )}
      </ProperDashboardLayout>
      
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