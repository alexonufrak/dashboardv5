"use client"

import { useState } from 'react'
import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useDashboard } from "@/contexts/DashboardContext"
import CohortGrid from "@/components/cohorts/CohortGrid"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import { useRouter } from "next/router"
import MainDashboardLayout from "@/components/layout/MainDashboardLayout"
import TransitionLayout from "@/components/common/TransitionLayout"
import { BlurFade } from "@/components/magicui/blur-fade"

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
    applications, 
    isLoadingApplications,
    participationData 
  } = useDashboard()

  // If no profile, don't render anything - parent component will handle loading state
  if (!profile) return null;

  // Determine institution name
  const institutionName = profile?.institutionName || 
                         profile?.institution?.name || 
                         "Your Institution";

  return (
    <TransitionLayout 
      routePattern="/dashboard/programs" 
      className="w-full"
      transitionType="programsList"
    >
      <div className="space-y-8">
        {/* Page Header */}
        <BlurFade delay={0.1} direction="up">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Available Programs
            </h1>
            <p className="text-muted-foreground">
              Browse and apply to xFoundry programs available at {institutionName}
            </p>
          </div>
        </BlurFade>

      {/* Main Content - Bento Grid */}
      <div className="hidden items-start justify-center gap-6 rounded-lg md:grid lg:grid-cols-2 xl:grid-cols-3">
        {/* Available Programs - Spans all columns */}
        <div className="col-span-2 grid items-start gap-6 xl:col-span-3">
          <BlurFade delay={0.2} direction="up">
            <Card>
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
                <BlurFade delay={0.3} inView>
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
                </BlurFade>
              </CardContent>
            </Card>
          </BlurFade>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        <BlurFade delay={0.2} direction="up">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span>Programs for {institutionName}</span>
              </CardTitle>
              <CardDescription>
                Select a program to learn more or apply
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CohortGrid 
                cohorts={profile?.cohorts || []}
                profile={profile}
                applications={applications}
                isLoadingApplications={isLoadingApplications}
                columns={{
                  default: 1
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
        </BlurFade>
      </div>

      {/* Active Programs Section - For Desktop */}
      {participationData?.participation && participationData.participation.length > 0 && (
        <div className="hidden items-start justify-center gap-6 rounded-lg mt-6 md:grid lg:grid-cols-2 xl:grid-cols-3">
          <div className="col-span-2 grid items-start gap-6 xl:col-span-3">
            <BlurFade delay={0.4} direction="up">
              <h2 className="text-2xl font-semibold">Your Active Programs</h2>
            </BlurFade>
          </div>
          
          {/* Active Programs Cards */}
          {participationData.participation.map((participation, index) => {
            const initiative = participation.cohort?.initiativeDetails;
            if (!initiative) return null;
            
            return (
              <BlurFade key={initiative.id} delay={0.5 + (index * 0.05)} direction="up">
                <Card className="flex flex-col h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <span className="truncate">{initiative.name}</span>
                    </CardTitle>
                    <CardDescription>
                      {initiative.shortDescription || "xFoundry Initiative"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-primary/10 p-1.5">
                          <GraduationCap className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm">
                          {participation.cohort?.shortName || participation.cohort?.name || "Current Cohort"}
                        </span>
                      </div>
                      {participation.team && (
                        <div className="flex items-center gap-2">
                          <div className="rounded-md bg-primary/10 p-1.5">
                            <Blocks className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm">
                            Team: {participation.team.name}
                          </span>
                        </div>
                      )}
                      {participation.cohort?.topicNames && participation.cohort.topicNames.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="rounded-md bg-primary/10 p-1.5">
                            <Compass className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm">
                            {participation.cohort.topicNames.join(", ")}
                          </span>
                        </div>
                      )}
                      {participation.cohort?.classNames && participation.cohort.classNames.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="rounded-md bg-primary/10 p-1.5">
                            <GraduationCap className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm">
                            Class: {participation.cohort.classNames.join(", ")}
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
              </BlurFade>
            );
          })}
        </div>
      )}
      
      {/* Active Programs Section - For Mobile */}
      {participationData?.participation && participationData.participation.length > 0 && (
        <div className="grid grid-cols-1 gap-4 mt-6 md:hidden">
          <BlurFade delay={0.4} direction="up">
            <h2 className="text-2xl font-semibold">Your Active Programs</h2>
          </BlurFade>
          
          {participationData.participation.map((participation, index) => {
            const initiative = participation.cohort?.initiativeDetails;
            if (!initiative) return null;
            
            return (
              <BlurFade key={initiative.id} delay={0.5 + (index * 0.05)} direction="up">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <span className="truncate">{initiative.name}</span>
                    </CardTitle>
                    <CardDescription>
                      {initiative.shortDescription || "xFoundry Initiative"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    {participation.team && (
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-primary/10 p-1.5">
                          <Blocks className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm">
                          Team: {participation.team.name}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-primary/10 p-1.5">
                        <GraduationCap className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">
                        {participation.cohort?.shortName || participation.cohort?.name || "Current Cohort"}
                      </span>
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
              </BlurFade>
            );
          })}
        </div>
      )}
    </div>
    </TransitionLayout>
  );
}

// Main Programs Page component
function ProgramsPage(props) {
  const router = useRouter()
  const { 
    profile, 
    isLoading, 
    error
  } = useDashboard()
  
  const [pageTitle] = useState("Available Programs")
  
  // Use dynamic import with SSR disabled to prevent context errors
  const ProgramsPageDynamic = dynamic(() => Promise.resolve(ProgramsPageContent), { 
    ssr: false 
  })
  
  return (
    <MainDashboardLayout
      title={pageTitle}
      profile={profile}
      currentPage="programs"
      onNavigate={(route) => router.push(route)}
      isLoading={isLoading && !profile}
      error={error}
    >
      <ProgramsPageDynamic {...props} />
    </MainDashboardLayout>
  )
}

export const getServerSideProps = withPageAuthRequired();

export default ProgramsPage;