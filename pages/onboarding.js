"use client"

import { useEffect, useState } from "react"
import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useOnboarding } from '@/contexts/OnboardingContext'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, ChevronDown, ChevronUp, Compass, ExternalLink, ArrowRight } from "lucide-react"
import CohortGrid from '@/components/cohorts/CohortGrid'
import OnboardingChecklist from "@/components/onboarding/OnboardingChecklist"
import { Skeleton } from "@/components/ui/skeleton"
import Logo from "@/components/common/Logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Card } from "@/components/ui/card"
import ProgramApplicationHandler from '@/components/program/ProgramApplicationHandler'
import Head from "next/head"

function Onboarding() {
  const { user } = useUser()
  const router = useRouter()
  const { 
    steps, 
    completionPercentage, 
    markStepComplete, 
    completeOnboarding, 
    allStepsCompleted,
    onboardingCompleted,
    checkOnboardingStatus,
    isLoading: onboardingLoading
  } = useOnboarding()
  
  // State for expanding/collapsing sections
  const [registerExpanded, setRegisterExpanded] = useState(true)
  const [cohortExpanded, setCohortExpanded] = useState(false)
  
  // App state
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [profile, setProfile] = useState(null)
  const [applications, setApplications] = useState([])
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)
  
  
  // Fetch minimal profile data - only once on mount
  useEffect(() => {
    // Add a flag to prevent duplicate calls and race conditions
    let isMounted = true;
    
    const fetchMinimalData = async () => {
      // Set loading state
      setIsLoading(true);
      
      try {
        // Step 1: Fetch minimal profile data with cohorts
        console.log("Fetching minimal profile data with cohorts...");
        const profileResponse = await fetch('/api/user/profile?minimal=true');
        
        if (!profileResponse.ok) {
          throw new Error('Failed to fetch profile data');
        }
        
        const responseData = await profileResponse.json();
        if (!isMounted) return;
        
        // Extract profile data from the response (it's wrapped in a profile key)
        const profileData = responseData.profile || responseData;
        
        // Set the profile data
        setProfile(profileData);
        
        // Step 2: Check if onboarding is already complete
        const onboardingStatus = profileData.Onboarding || "Registered";
        const hasParticipation = profileData.hasActiveParticipation === true;
        const hasApps = profileData.applications && profileData.applications.length > 0;
        
        console.log("Quick onboarding check:", { 
          onboardingStatus, 
          hasParticipation, 
          hasApps 
        });
                
        // If already onboarded, redirect to dashboard
        if (onboardingStatus === "Applied" || hasParticipation || hasApps) {
          console.log("Onboarding already complete, redirecting to dashboard");
          router.push('/dashboard');
          return;
        }
        
        // Step 3: Update the onboarding context ONCE
        await checkOnboardingStatus(profileData);
        
        // Step 4: For new users, DON'T fetch applications - they won't have any yet
        // Only fetch applications if we think they might have some
        if (profileData.hasOwnProperty('applications') && 
            profileData.applications && 
            profileData.applications.length > 0) {
          
          console.log("User may have applications, fetching them...");
          setIsLoadingApplications(true);
          
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // shorter timeout
            
            const applicationsResponse = await fetch('/api/user/check-application', {
              signal: controller.signal
            }).catch(error => {
              console.log('Applications fetch aborted or failed:', error.message);
              return { ok: false };
            });
            
            clearTimeout(timeoutId);
            
            if (applicationsResponse.ok && isMounted) {
              const applicationsData = await applicationsResponse.json();
              setApplications(applicationsData.applications || []);
            } else {
              // If we can't get applications, just use an empty array
              console.log('Using empty applications array due to fetch failure');
              setApplications([]);
            }
          } catch (appError) {
            console.warn('Error fetching applications:', appError.message);
            setApplications([]);
          } finally {
            if (isMounted) setIsLoadingApplications(false);
          }
        } else {
          // User definitely has no applications, skip the fetch
          console.log("New user, skipping applications fetch");
          setApplications([]);
        }
      } catch (error) {
        console.error('Error in onboarding data fetch:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    // Fetch data immediately but only once
    fetchMinimalData();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [router]) // Intentionally omitting checkOnboardingStatus from deps
  
  // Redirect if onboarding is completed
  useEffect(() => {
    if (onboardingCompleted && !onboardingLoading) {
      router.push('/dashboard')
    }
  }, [onboardingCompleted, onboardingLoading, router])
  
  
  // Application state management
  const [selectedCohort, setSelectedCohort] = useState(null)
  const [showApplicationHandler, setShowApplicationHandler] = useState(false)
  
  // Handlers
  const handleCohortApply = (cohort) => {
    // Start the application process with the selected cohort
    console.log("Cohort apply started in onboarding:", cohort.id);
    setSelectedCohort(cohort);
    setShowApplicationHandler(true);
  }
  
  const handleApplicationComplete = (cohort) => {
    // Application completed successfully
    console.log("Application successful, marking step complete");
    setSelectedCohort(null);
    setShowApplicationHandler(false);
    markStepComplete('selectCohort');
  }
  
  const handleApplicationCancel = () => {
    // Application was cancelled
    console.log("Application cancelled");
    setSelectedCohort(null);
    setShowApplicationHandler(false);
  }
  
  const handleCompleteOnboarding = async () => {
    if (allStepsCompleted) {
      setIsCompleting(true)
      
      try {
        // Call the API to complete onboarding
        const success = await completeOnboarding()
        
        if (success) {
          // Redirect to dashboard
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Error completing onboarding:', error)
      } finally {
        setIsCompleting(false)
      }
    }
  }
  
  // Show loading skeleton while fetching data
  if (isLoading) {
    return (
      <>
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="flex min-h-screen w-full items-center justify-center py-10 px-4 bg-background">
          <div className="w-full max-w-md">
            <Skeleton className="h-12 w-48 mx-auto mb-8" />
            <Skeleton className="h-[600px] w-full rounded-lg" />
          </div>
        </div>
      </>
    )
  }
  
  // We've removed all Sheet-based components and application handling components
  // The application process now uses the standard CohortCard dialogs
  
  return (
    <>
      <Head>
        <title>Complete Onboarding - xFoundry</title>
      </Head>
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="container mx-auto flex flex-col items-center justify-center py-12 px-4 lg:px-8 bg-background min-h-screen">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo variant="horizontal" color="auto" height={50} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-primary dark:text-primary">
              Welcome to xFoundry
            </h1>
            <p className="mt-3 text-xl text-muted-foreground">
              Complete these steps to get started with your journey
            </p>
          </div>
          
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex justify-between mb-1">
              <div className="text-sm font-medium text-primary">Your progress</div>
              <div className="text-sm text-muted-foreground">
                {Object.values(steps).filter(s => s.completed).length}/{Object.keys(steps).length} complete
              </div>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
          
          {/* Steps */}
          <div className="space-y-6">
            {/* Register Step */}
            <div className="border rounded-lg overflow-hidden shadow-sm border-green-100 dark:border-green-800/30 bg-white dark:bg-gray-900">
              {/* Step Header */}
              <div 
                className="flex items-center p-4 cursor-pointer transition-colors duration-200 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30"
                onClick={() => setRegisterExpanded(!registerExpanded)}
              >
                <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full mr-4 transition-all duration-300 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40">
                  <CheckCircle className="h-5 w-5" />
                </div>
                
                <div className="grow">
                  <h3 className="text-base font-medium transition-colors duration-200 text-green-800 dark:text-green-400">
                    {steps.register.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{steps.register.description}</p>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2 h-8 w-8 p-0 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-100/50 dark:hover:bg-green-900/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRegisterExpanded(!registerExpanded);
                  }}
                  type="button"
                >
                  {registerExpanded ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </Button>
              </div>
              
              {/* Step Content */}
              <div 
                className={`
                  overflow-hidden transition-all duration-300 ease-in-out
                  ${registerExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}
                `}
              >
                <div className="p-4 border-t border-border/50">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-medium text-green-700 dark:text-green-400 mb-3">
                      Your account is set up!
                    </h3>
                    <p className="text-muted-foreground max-w-lg mb-6">
                      Welcome to xFoundry! You now have access to ConneXions, our community hub where you 
                      can connect with other students, mentors, and faculty in your program.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        variant="outline"
                        className="gap-2"
                        onClick={() => window.open("https://connexions.xfoundry.org", "_blank")}
                      >
                        Visit ConneXions
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => {
                          setRegisterExpanded(false);
                          setCohortExpanded(true);
                        }}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Continue to next step
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Get Involved Step */}
            <div className={`
              border rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-900
              ${steps.selectCohort.completed 
                ? 'border-green-100 dark:border-green-800/30' 
                : 'border-border'
              }
            `}>
              {/* Step Header */}
              <div 
                className={`
                  flex items-center p-4 cursor-pointer transition-colors duration-200
                  ${steps.selectCohort.completed 
                    ? 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30' 
                    : 'bg-muted/30 hover:bg-muted dark:hover:bg-muted/80'
                  }
                `}
                onClick={() => setCohortExpanded(!cohortExpanded)}
              >
                <div className={`
                  shrink-0 w-10 h-10 flex items-center justify-center rounded-full mr-4 transition-all duration-300
                  ${steps.selectCohort.completed 
                    ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40' 
                    : 'text-primary dark:text-primary/80 bg-primary/10 dark:bg-primary/20'
                  }
                `}>
                  {steps.selectCohort.completed 
                    ? <CheckCircle className="h-5 w-5" /> 
                    : <Compass className="h-5 w-5" />
                  }
                </div>
                
                <div className="grow">
                  <h3 className={`
                    text-base font-medium transition-colors duration-200
                    ${steps.selectCohort.completed 
                      ? 'text-green-800 dark:text-green-400' 
                      : 'text-foreground'
                    }
                  `}>
                    {steps.selectCohort.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{steps.selectCohort.description}</p>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`
                    ml-2 h-8 w-8 p-0 
                    ${steps.selectCohort.completed 
                      ? 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-100/50 dark:hover:bg-green-900/20' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                    }
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCohortExpanded(!cohortExpanded);
                  }}
                  type="button"
                >
                  {cohortExpanded ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </Button>
              </div>
              
              {/* Step Content */}
              <div 
                className={`
                  overflow-hidden transition-all duration-300 ease-in-out
                  ${cohortExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}
                `}
              >
                <div className="p-4 border-t border-border/50">
                  {!steps.selectCohort.completed ? (
                    <div>
                      <h3 className="text-lg font-medium mb-2 text-foreground">
                        Choose a program to join
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Select from the available programs below to apply and get started with xFoundry
                      </p>
                      
                      {/* Available Programs - Added max-height and overflow-y-auto to make it scrollable */}
                      <div className="max-h-[380px] overflow-y-auto pr-1">
                        <CohortGrid 
                          cohorts={profile?.cohorts || []}
                          profile={profile}
                          isLoading={isLoading}
                          isLoadingApplications={isLoadingApplications}
                          applications={applications}
                          onApply={handleCohortApply}
                          columns={{ default: 1, md: 1, lg: 2 }} 
                          emptyMessage="No programs are currently available for your institution."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-xl font-medium text-green-700 dark:text-green-400 mb-2">
                        You've applied to a program!
                      </h3>
                      <p className="text-muted-foreground max-w-md mb-4">
                        Your application has been submitted. You'll receive updates about your application status soon.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-8 flex justify-end">
            <div className="flex gap-3">
              {allStepsCompleted && (
                <Button
                  className={`
                    transition-all duration-200
                    ${isCompleting 
                      ? 'bg-primary/80 animate-pulse' 
                      : 'bg-primary hover:bg-primary/90'
                    } 
                    text-white
                  `}
                  size="lg"
                  onClick={handleCompleteOnboarding}
                  disabled={isCompleting}
                >
                  {isCompleting ? 'Completing...' : 'Complete Onboarding'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Application Handler */}
      <ProgramApplicationHandler
        cohort={selectedCohort}
        profile={profile}
        isActive={showApplicationHandler}
        onComplete={handleApplicationComplete}
        onCancel={handleApplicationCancel}
      />
    </>
  )
}

// Wrap with auth protection
export const getServerSideProps = withPageAuthRequired()

export default Onboarding