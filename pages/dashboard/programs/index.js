"use client"

import { useState } from 'react'
import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useDashboard } from "@/contexts/DashboardContext"
import CohortGrid from "@/components/cohorts/CohortGrid"
import { toast } from "sonner"
import dynamic from "next/dynamic"

// UI Components
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Blocks, Building2, ArrowRight, Compass, GraduationCap } from "lucide-react"

// Inner component that uses dashboard context
function ProgramsPageContent({ onNavigate }) {
  // Get data from dashboard context
  const { 
    profile, 
    isLoading, 
    error,
    applications, 
    isLoadingApplications,
    participationData,
    isProgramLoading 
  } = useDashboard()

  // Show loading state
  if (isLoading || !profile) {
    return (
      <div className="space-y-6 w-full py-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-48 w-full rounded-lg mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </div>
    )
  }

  // Show error message if there's an error
  if (error) {
    return (
      <Alert variant="destructive" className="mt-6">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}. Please try refreshing the page or contact support if the issue persists.
        </AlertDescription>
      </Alert>
    )
  }

  // Determine institution name
  const institutionName = profile?.institutionName || 
                         profile?.institution?.name || 
                         "Your Institution";

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Available Programs
        </h1>
        <p className="text-muted-foreground">
          Browse and apply to xFoundry programs available at {institutionName}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span>Programs for {institutionName}</span>
              </CardTitle>
              <CardDescription>
                Select a program to learn more or apply
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <CohortGrid 
              cohorts={profile?.cohorts || []}
              profile={profile}
              applications={applications}
              isLoadingApplications={isLoadingApplications}
              columns={{
                default: 1,
                md: 2,
                lg: 3
              }}
              onApplySuccess={(cohort) => {
                toast.success(`Applied to ${cohort.initiativeDetails?.name || 'program'} successfully!`);
                
                // Update onboarding status in Airtable to 'Applied'
                fetch('/api/user/onboarding-completed', {
                  method: 'POST'
                }).catch(err => {
                  console.error("Error updating onboarding status after application:", err);
                });
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Active Programs Section - Show if user is participating in any programs */}
      {participationData?.participation && participationData.participation.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Your Active Programs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {participationData.participation.map((participation) => {
              const initiative = participation.cohort?.initiativeDetails;
              if (!initiative) return null;
              
              return (
                <Card key={initiative.id} className="flex flex-col h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{initiative.name}</span>
                    </CardTitle>
                    <CardDescription>
                      {initiative.shortDescription || "xFoundry Initiative"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {participation.cohort?.name || "Current Cohort"}
                        </span>
                      </div>
                      {participation.team && (
                        <div className="flex items-center gap-2">
                          <Blocks className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Team: {participation.team.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="default" 
                      className="w-full"
                      size="sm"
                      asChild
                    >
                      <a href={`/dashboard/program/${initiative.id}`}>
                        <span>Go to Program</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Use dynamic import with SSR disabled to prevent context errors during build
const ProgramsPageDynamic = dynamic(() => Promise.resolve(ProgramsPageContent), { 
  ssr: false 
})

// Export the dynamic component that doesn't require context during build
export default function ProgramsPage(props) {
  return <ProgramsPageDynamic {...props} />
}

export const getServerSideProps = withPageAuthRequired();