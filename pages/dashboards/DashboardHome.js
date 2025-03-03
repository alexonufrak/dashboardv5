"use client"

import { useState } from "react"
import { useDashboard } from "@/contexts/DashboardContext"
import { toast } from "sonner"
import Link from "next/link"
import dynamic from "next/dynamic"

// Use dynamic import with SSR disabled to prevent context errors during build
const DashboardHomeContent = dynamic(() => Promise.resolve(DashboardHomeInner), { 
  ssr: false 
})

// Import components
import TeamCard from "@/components/TeamCard"
import EmailMismatchAlert from "@/components/EmailMismatchAlert"
import TeamInviteSuccessAlert from "@/components/TeamInviteSuccessAlert"
import CohortGrid from "@/components/shared/CohortGrid"
import ProfileEditModal from "@/components/ProfileEditModal"
import OnboardingBanner from "@/components/OnboardingBanner"
import OnboardingDialog from "@/components/OnboardingDialog"

// Import UI components
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

// Import icons
import { 
  Compass,
  Users,
  AlertTriangle
} from "lucide-react"

// Inner component that uses dashboard context
function DashboardHomeInner({ onNavigate }) {
  // Get data from dashboard context
  const { 
    user, 
    profile, 
    isLoading, 
    error, 
    teamsData, 
    isTeamLoading, 
    applications, 
    isLoadingApplications,
    isEditModalOpen, 
    setIsEditModalOpen,
    handleProfileUpdate
  } = useDashboard()
  
  // Handler functions
  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };
  
  const handleEditClose = () => {
    setIsEditModalOpen(false);
  };

  // Show loading screen while data is loading
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 mt-10">
        <Skeleton className="h-[30px] w-[280px] rounded-sm" />
        
        <div className="flex flex-col gap-6">
          <Skeleton className="h-[80px] w-full rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[250px] rounded-lg" />
            <Skeleton className="h-[250px] rounded-lg" />
            <Skeleton className="h-[250px] rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  // Show error message if there's an error
  if (error) {
    return (
      <Alert variant="destructive" className="mt-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}. Please try refreshing the page or contact support if the issue persists.
        </AlertDescription>
      </Alert>
    )
  }
  
  // Main JSX content
  return (
    <div className="dashboard-content space-y-6">
      {/* Try the dashboard shell banner */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertTitle className="text-blue-800">New Seamless Navigation</AlertTitle>
        <AlertDescription className="text-blue-700">
          We've updated the dashboard to support seamless navigation between pages.
          Try clicking between tabs in the sidebar!
        </AlertDescription>
      </Alert>
      
      {/* Alerts and notifications */}
      {user?.emailMismatch && <EmailMismatchAlert emailMismatch={user.emailMismatch} />}
      <TeamInviteSuccessAlert />
      
      {/* Onboarding components */}
      <OnboardingBanner />
      <OnboardingDialog 
        profile={profile}
        applications={applications}
        isLoadingApplications={isLoadingApplications}
      />
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Hub</h1>
          <p className="text-muted-foreground">
            Welcome, {profile?.firstName || user?.name?.split(' ')[0] || 'Student'}
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="space-y-8">
        {/* Programs Section */}
        <section id="programs" className="space-y-4">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Available Programs</h2>
          </div>
          
          <CohortGrid 
            cohorts={profile?.cohorts || []}
            profile={profile}
            applications={applications}
            isLoadingApplications={isLoadingApplications}
            onApplySuccess={(cohort) => {
              toast.success(`Applied to ${cohort.initiativeDetails?.name || 'program'} successfully!`);
              
              // Simpler approach - just update steps without needing to check current state
              fetch('/api/user/metadata', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  onboarding: ['register', 'selectCohort']
                })
              }).catch(err => {
                console.error("Error updating steps after application:", err);
              });
            }}
          />
        </section>
        
        {/* Teams Section */}
        <section id="teams" className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Your Teams</h2>
          </div>
          
          {isTeamLoading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : teamsData && teamsData.length > 0 ? (
            <div className="space-y-6">
              {teamsData.map((team) => (
                <TeamCard 
                  key={team.id} 
                  team={team}
                  profile={profile}
                />
              ))}
            </div>
          ) : (
            <TeamCard team={null} />
          )}
        </section>
      </div>
      
      {/* Modals */}
      {isEditModalOpen && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={handleEditClose}
          profile={profile}
          onSave={handleProfileUpdate}
        />
      )}
    </div>
  )
}

// Export the dynamic component that doesn't require context during build
export default function DashboardHome(props) {
  return <DashboardHomeContent {...props} />
}