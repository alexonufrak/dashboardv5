"use client"

import { useState } from 'react'
// Import Auth0 client
import { auth0 } from "@/lib/auth0"
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
import { Badge } from "@/components/ui/badge"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Blocks, Building2, ArrowRight, Compass, GraduationCap, ListFilter } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"

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
      <div className="space-y-6">
        {/* Main Section Header */}
        <BlurFade delay={0.1} direction="up">
          <PageHeader
            title="Available Programs"
            subtitle={`Browse and apply to xFoundry programs available at ${institutionName}`}
            spacing="md"
            icon={<Blocks className="h-6 w-6 text-primary" />}
            badges={[
              applications?.length > 0 && (
                <Badge key="applications" variant="outline" className="bg-blue-50/80 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900">
                  {applications.length} Active Application{applications.length !== 1 ? 's' : ''}
                </Badge>
              ),
              participationData?.length > 0 && (
                <Badge key="enrolled" variant="outline" className="bg-green-50/80 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900">
                  {participationData.length} Enrolled Program{participationData.length !== 1 ? 's' : ''}
                </Badge>
              )
            ].filter(Boolean)}
            actions={[]}
          />
        </BlurFade>

      {/* Main Content */}
      <BlurFade delay={0.2} direction="up">
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


      {/* Active Programs Section - Responsive Design */}
      {participationData?.participation && participationData.participation.length > 0 && (
        <div className="mt-6">
          <BlurFade delay={0.4} direction="up">
            <PageHeader 
              title="Your Active Programs"
              subtitle="Programs you're currently enrolled in"
              spacing="md"
              icon={<Building2 className="h-6 w-6 text-primary" />}
              divider
            />
          </BlurFade>
          
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-4">
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
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="default" 
                        className="w-full"
                        size="sm"
                        asChild
                      >
                        <a href={`/dashboard/programs/${initiative.id}`}>
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
  
  // Set empty title for MainDashboardLayout to prevent duplicate headers
  const [pageTitle] = useState("")
  
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

// Auth protection with Auth0 v4
export async function getServerSideProps(context) {
  // Get the session using Auth0 v4 client
  const session = await auth0.getSession(context.req);
  
  // Redirect to login if no session
  if (!session) {
    return {
      redirect: {
        destination: '/auth/login?returnTo=/dashboard/programs',
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

export default ProgramsPage;