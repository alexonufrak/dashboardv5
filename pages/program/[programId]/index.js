"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import dynamic from "next/dynamic"
import { auth0 } from "@/lib/auth0"
import { useDashboard } from "@/contexts/DashboardContext"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import MainDashboardLayout from "@/components/layout/MainDashboardLayout"
// ProfileEditModal is now included in MainDashboardLayout

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
  
  // Create error handler with retry function
  const errorWithRetry = error ? {
    message: error,
    onRetry: () => window.location.reload()
  } : null;

  return (
    <MainDashboardLayout
      title={pageTitle}
      profile={profile}
      currentPage="program"
      onNavigate={(route) => router.push(route)}
      isLoading={showFullLoader}
      error={errorWithRetry}
    >
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
    </MainDashboardLayout>
  )
}

export async function getServerSideProps(context) {
  // Get the session using Auth0 v4 client
  const session = await auth0.getSession(context.req);
  
  // Redirect to login if no session
  if (!session) {
    return {
      redirect: {
        destination: '/auth/login?returnTo=' + encodeURIComponent(context.resolvedUrl),
        permanent: false,
      },
    };
  }
  
  // Return the user prop to maintain compatibility with existing code
  return {
    props: {
      user: session.user || null,
    },
  };
}

export default ProgramPage