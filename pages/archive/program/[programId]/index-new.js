"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useDashboard } from "@/contexts/DashboardContext"
import ProfileEditModal from "@/components/profile/ProfileEditModal"
import { Toaster } from "sonner"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import dynamic from "next/dynamic"
import Head from "next/head"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import LoadingScreen from "@/components/common/LoadingScreen"

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
    isLoading,
    isEditModalOpen, 
    setIsEditModalOpen, 
    getAllProgramInitiatives,
    getActiveProgramData
  } = useDashboard()
  const [pageTitle, setPageTitle] = useState("Program Dashboard")
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Set the active program based on URL parameter
  useEffect(() => {
    if (programId) {
      console.log(`Setting active program from URL: ${programId}`)
      
      // Only set active program if it's different from the current one
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
  
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content="xFoundry Hub - Program Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <SidebarProvider defaultOpen>
        <div className="flex min-h-screen h-screen">
          {/* Mobile Header - Only visible on mobile */}
          <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b py-3 px-4 flex justify-between items-center shadow-xs">
            <div className="flex items-center">
              <div className="w-10"></div> {/* Placeholder for alignment */}
              <h2 className="text-lg font-bold tracking-tight text-primary ml-4">
                xFoundry Hub
              </h2>
            </div>
            <div className="text-xs">
              {profile?.institutionName || "Institution"}
            </div>
          </div>
          
          {/* Sidebar */}
          <AppSidebar className="h-screen" />
          
          {/* Main Content */}
          <SidebarInset className="bg-background flex-1 overflow-auto">
            <div className="pt-[60px] md:pt-4 overflow-x-hidden h-full">
              <div className="mx-auto max-w-6xl px-4 md:px-6 h-full flex flex-col">
                {/* Content wrapper with page transitions */}
                <div className="proper-dashboard-layout-content flex-1">
                  {showFullLoader ? (
                    <LoadingScreen message="Loading program dashboard..." />
                  ) : (
                    <ProgramDashboard programId={programId} />
                  )}
                </div>
                
                {/* Footer */}
                <footer className="border-t py-8 mt-8 text-center text-muted-foreground text-sm">
                  <p>© {new Date().getFullYear()} xFoundry Education Platform. All rights reserved.</p>
                </footer>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
      <Toaster position="top-right" />
    </>
  )
}

// Wrap with auth protection
export const getServerSideProps = withPageAuthRequired()

export default ProgramPage