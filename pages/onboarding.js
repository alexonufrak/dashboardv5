"use client"

import { useEffect, useState } from "react"
import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useOnboarding } from '@/contexts/OnboardingContext'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, ChevronDown, ChevronUp, Compass, ExternalLink, ArrowRight, X } from "lucide-react"
import CohortGrid from '@/components/cohorts/CohortGrid'
import OnboardingChecklist from "@/components/onboarding/OnboardingChecklist"
import { Skeleton } from "@/components/ui/skeleton"
import Logo from "@/components/common/Logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Card } from "@/components/ui/card"
import Head from "next/head"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { FilloutPopupEmbed } from "@fillout/react"
import TeamSelectDialog from '@/components/teams/TeamSelectDialog'
import TeamCreateDialog from '@/components/teams/TeamCreateDialog'
import InitiativeConflictDialog from '@/components/cohorts/InitiativeConflictDialog'

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
  
  // Application sheet state
  const [activeApplication, setActiveApplication] = useState(null)
  const [isCheckingRestrictions, setIsCheckingRestrictions] = useState(false)
  const [showInitiativeConflictDialog, setShowInitiativeConflictDialog] = useState(false)
  const [conflictDetails, setConflictDetails] = useState(null)
  const [activeFilloutForm, setActiveFilloutForm] = useState(null)
  const [activeTeamSelectDialog, setActiveTeamSelectDialog] = useState(null)
  const [activeTeamCreateDialog, setActiveTeamCreateDialog] = useState(false)
  const [userTeams, setUserTeams] = useState([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  
  // Application step state for multi-step experience
  const [applicationStep, setApplicationStep] = useState("details") // "details", "team", "form", "confirm"
  
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
  
  // Check if a user is already part of an initiative
  const checkInitiativeRestrictions = async (cohort) => {
    try {
      setIsCheckingRestrictions(true)
      
      // Get the current cohort's initiative
      const currentInitiativeName = cohort.initiativeDetails?.name || "";
      const currentInitiativeId = cohort.initiativeDetails?.id;
      
      console.log("Checking initiative restrictions for:", currentInitiativeName);
      
      // Skip check for Xperiment initiative (which has no restrictions)
      if (currentInitiativeName.includes("Xperiment")) {
        console.log("Skipping restrictions for Xperiment initiative");
        return { allowed: true };
      }
      
      // Check if this is a team-based initiative
      const currentParticipationType = cohort.participationType || 
                                     cohort.initiativeDetails?.["Participation Type"] || 
                                     "Individual";
                                     
      // Standardized team participation detection
      const normalizedType = currentParticipationType.trim().toLowerCase();
      const isTeamProgram = 
        normalizedType === "team" || 
        normalizedType.includes("team") ||
        normalizedType === "teams" ||
        normalizedType === "group" ||
        normalizedType.includes("group") ||
        normalizedType === "collaborative" ||
        normalizedType.includes("collaborative");
      
      console.log(`Is this a team program? ${isTeamProgram ? 'YES' : 'NO'} (${currentParticipationType})`);
      
      // Only check conflicts for team programs
      if (!isTeamProgram) {
        console.log(`Not a team program (${currentParticipationType}), skipping conflict check`);
        return { allowed: true };
      }
      
      // We need to make an API call to check if the user has participation records with conflicting initiatives
      if (!profile?.contactId) {
        console.error("No contact ID available for initiative conflict check");
        return { allowed: true };
      }
      
      console.log(`Calling API to check participation records for contact ${profile.contactId}`);
      
      const url = `/api/user/check-initiative-conflicts?initiative=${encodeURIComponent(currentInitiativeName)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error("Error checking initiative conflicts:", response.statusText);
        return { allowed: true }; // Allow if we can't check
      }
      
      const data = await response.json();
      
      if (data.hasConflict) {
        console.log("API found conflicting initiative:", data.conflictingInitiative);
        return {
          allowed: false,
          reason: "initiative_conflict",
          details: {
            currentInitiative: currentInitiativeName,
            conflictingInitiative: data.conflictingInitiative,
            teamId: data.teamId,
            teamName: data.teamName
          }
        };
      }
      
      console.log("No conflicts found, allowing application");
      return { allowed: true };
    } catch (error) {
      console.error("Error in initiative restriction check:", error);
      return { allowed: true }; // In case of error, allow the application
    } finally {
      setIsCheckingRestrictions(false)
    }
  };
  
  // Handlers
  const handleCohortApply = async (cohort) => {
    console.log("Applying to cohort:", cohort)
    
    // Set step to details and reset any previous state
    setApplicationStep("details")
    setActiveApplication(cohort)
    
    // Check for initiative restrictions
    const restrictionCheck = await checkInitiativeRestrictions(cohort);
    if (!restrictionCheck.allowed) {
      console.log("Application restricted:", restrictionCheck);
      setConflictDetails(restrictionCheck.details);
      setShowInitiativeConflictDialog(true);
      return;
    }
  }
  
  const handleCohortApplySuccess = () => {
    // Mark the cohort selection step as complete
    markStepComplete('selectCohort')
    // Close the application sheet
    setActiveApplication(null)
  }
  
  // Handle form completion for individual applications
  const handleFormCompleted = () => {
    setActiveFilloutForm(null)
    handleCohortApplySuccess()
  }
  
  // Handle team creation
  const handleTeamCreated = (team) => {
    console.log("Team created successfully:", team)
    
    // Add new team to user's teams
    setUserTeams(prev => {
      const newTeams = [...prev, team]
      console.log("Updated teams list:", newTeams)
      return newTeams
    })
    
    setActiveTeamCreateDialog(false)
    
    // Open team selection dialog with the newly created team
    setActiveTeamSelectDialog({
      cohort: activeApplication,
      teams: [team]
    })
  }
  
  // Handle team application submission
  const handleTeamApplicationSubmitted = () => {
    setActiveTeamSelectDialog(null)
    handleCohortApplySuccess()
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
  
  // Special rendering components for the application sheet
  const ApplicationDetails = ({ cohort, onContinue }) => {
    // Extract relevant data from cohort
    const initiativeName = cohort.initiativeDetails?.name || "Unknown Initiative"
    const description = cohort.description || cohort.initiativeDetails?.description || 
                     "Join this program to connect with mentors and build career skills."
    const topics = cohort.topicNames || []
    const participationType = cohort.participationType || 
                            cohort.initiativeDetails?.["Participation Type"] || 
                            "Individual"
    const isTeamBased = participationType.toLowerCase().includes("team")
    
    return (
      <div className="space-y-6 py-4">
        <div className="space-y-2">
          <h3 className="text-xl font-medium">{initiativeName}</h3>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {Array.isArray(topics) && topics.length > 0 && 
              topics.map((topic, index) => (
                <Badge key={`topic-${index}`} variant="secondary" className="bg-cyan-50 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100">
                  {topic} {cohort.className && index === 0 ? `- ${cohort.className}` : ''}
                </Badge>
              ))
            }
          </div>
          
          <div className="mt-3">
            <Badge variant="outline" className={
              participationType.toLowerCase().includes('team') ? 
                "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-800" : 
                "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800"
            }>
              {participationType}
            </Badge>
          </div>
        </div>
        
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground">{description}</p>
        </div>
        
        <div className="mt-6">
          <h4 className="text-lg font-medium mb-3">How to Apply</h4>
          <p className="text-muted-foreground mb-4">
            {isTeamBased ? (
              "This program requires team participation. You'll need to either create a new team or join an existing team to apply."
            ) : (
              "This program supports individual participation. You can apply directly by completing the application form."
            )}
          </p>
        </div>
        
        <SheetFooter className="mt-6 gap-3 flex-col sm:flex-row-reverse">
          <Button onClick={onContinue}>
            Continue to Apply
          </Button>
        </SheetFooter>
      </div>
    )
  }
  
  // Individual application form component
  const IndividualApplicationForm = ({ cohort, onComplete }) => {
    const filloutFormId = cohort["Application Form ID (Fillout)"]
    
    // If there's no form ID, show a message
    if (!filloutFormId) {
      return (
        <div className="py-4 text-center">
          <p className="text-muted-foreground mb-4">
            Application form is not available for this program.
          </p>
          <Button onClick={onComplete}>Close</Button>
        </div>
      )
    }
    
    return (
      <div className="py-4">
        <p className="text-muted-foreground mb-4">
          Please complete the application form below to apply to this program.
        </p>
        
        <div className="border rounded-lg overflow-hidden h-[500px]">
          <FilloutPopupEmbed
            filloutId={filloutFormId}
            mode="inline"
            onSubmit={onComplete}
            data-user_id={profile?.userId}
            data-contact={profile?.contactId}
            data-institution={profile?.institution?.id}
            parameters={{
              cohortId: cohort.id,
              initiativeName: cohort.initiativeDetails?.name,
              userEmail: profile?.email,
              userName: profile?.name,
              userContactId: profile?.contactId,
              user_id: profile?.userId,
              contact: profile?.contactId,
              institution: profile?.institution?.id
            }}
          />
        </div>
      </div>
    )
  }
  
  // Team application component - provides options to create or join a team
  const TeamApplicationOptions = ({ cohort, onCreateTeam, onSelectTeam }) => {
    const [isLoadingUserTeams, setIsLoadingUserTeams] = useState(false)
    const [userTeams, setUserTeams] = useState([])
    
    // Fetch user teams on first render
    useEffect(() => {
      const fetchUserTeams = async () => {
        try {
          setIsLoadingUserTeams(true)
          const response = await fetch('/api/teams')
          
          if (response.ok) {
            const data = await response.json()
            setUserTeams(data.teams || [])
          }
        } catch (error) {
          console.error("Error fetching user teams:", error)
        } finally {
          setIsLoadingUserTeams(false)
        }
      }
      
      fetchUserTeams()
    }, [])
    
    return (
      <div className="space-y-6 py-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Team Application</h3>
          <p className="text-muted-foreground">
            This program requires team participation. You can either create a new team or join an existing team.
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4 flex flex-col h-full">
            <div className="font-medium mb-2">Create a New Team</div>
            <p className="text-sm text-muted-foreground flex-grow">
              Start a new team and invite others to join you in this program.
            </p>
            <Button 
              onClick={onCreateTeam} 
              variant="outline" 
              className="mt-4"
            >
              Create Team
            </Button>
          </Card>
          
          <Card className="p-4 flex flex-col h-full">
            <div className="font-medium mb-2">Select an Existing Team</div>
            <p className="text-sm text-muted-foreground flex-grow">
              {userTeams.length > 0 
                ? `You have ${userTeams.length} team(s) you can use for this application.`
                : "You don't have any teams yet. You can create a new one or wait to be invited to join one."
              }
            </p>
            <Button 
              onClick={onSelectTeam}
              disabled={userTeams.length === 0}
              variant="outline"
              className="mt-4"
            >
              Select Team
            </Button>
          </Card>
        </div>
      </div>
    )
  }
  
  // Application success confirmation
  const ApplicationConfirmation = ({ onComplete }) => {
    return (
      <div className="flex flex-col items-center justify-center text-center py-6 space-y-4">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mb-2">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-medium text-green-700 dark:text-green-400">
          Application Submitted!
        </h3>
        <p className="text-muted-foreground max-w-md">
          Your application has been submitted successfully. You'll receive updates about your application status soon.
        </p>
        <Button onClick={onComplete} className="mt-4">
          Return to Onboarding
        </Button>
      </div>
    )
  }
  
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
          
          <Card className="p-6 md:p-8 shadow-lg border-0 bg-white dark:bg-gray-900 rounded-xl">
          
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
            <div className="border rounded-lg overflow-hidden shadow-sm border-green-100 dark:border-green-800/30">
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
              border rounded-lg overflow-hidden shadow-sm 
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
                          onApplySuccess={handleCohortApplySuccess}
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
          </Card>
        </div>
      </div>
      
      {/* Application Sheet */}
      {activeApplication && (
        <Sheet open={!!activeApplication} onOpenChange={(open) => !open && setActiveApplication(null)}>
          <SheetContent side="right" className="w-full sm:w-[600px] max-w-full p-0 gap-0">
            <div className="flex flex-col h-full">
              {/* Header */}
              <SheetHeader className="p-6 border-b">
                <SheetTitle>
                  {applicationStep === "confirm" ? "Application Submitted" : "Program Application"}
                </SheetTitle>
                <SheetDescription>
                  {applicationStep === "details" && "Review program details and apply"}
                  {applicationStep === "form" && "Complete the application form"}
                  {applicationStep === "team" && "Select or create a team for this program"}
                  {applicationStep === "confirm" && "Your application has been submitted"}
                </SheetDescription>
              </SheetHeader>
              
              {/* Content */}
              <div className="flex-grow overflow-y-auto p-6">
                {/* Show appropriate content based on step */}
                {applicationStep === "details" && (
                  <ApplicationDetails 
                    cohort={activeApplication} 
                    onContinue={() => {
                      const participationType = activeApplication.participationType || 
                                     activeApplication.initiativeDetails?.["Participation Type"] || 
                                     "Individual";
                      const isTeamBased = participationType.toLowerCase().includes("team");
                      
                      // Route to appropriate next step based on participation type
                      if (isTeamBased) {
                        setApplicationStep("team");
                      } else {
                        setApplicationStep("form");
                      }
                    }}
                  />
                )}
                
                {applicationStep === "form" && (
                  <IndividualApplicationForm 
                    cohort={activeApplication}
                    onComplete={() => {
                      // Show confirmation and mark step complete
                      setApplicationStep("confirm");
                      markStepComplete('selectCohort');
                    }}
                  />
                )}
                
                {applicationStep === "team" && (
                  <TeamApplicationOptions 
                    cohort={activeApplication}
                    onCreateTeam={() => {
                      setActiveTeamCreateDialog(true);
                    }}
                    onSelectTeam={() => {
                      setActiveTeamSelectDialog({
                        cohort: activeApplication,
                        teams: userTeams || []
                      });
                    }}
                  />
                )}
                
                {applicationStep === "confirm" && (
                  <ApplicationConfirmation
                    onComplete={handleCohortApplySuccess}
                  />
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
      
      {/* Team Creation Dialog */}
      <TeamCreateDialog 
        open={activeTeamCreateDialog}
        onClose={() => setActiveTeamCreateDialog(false)}
        onCreateTeam={handleTeamCreated}
        onJoinTeam={handleTeamApplicationSubmitted}
        cohortId={activeApplication?.id}
        profile={profile}
        cohort={activeApplication}
      />
      
      {/* Team Selection Dialog */}
      <TeamSelectDialog 
        open={!!activeTeamSelectDialog}
        onClose={() => setActiveTeamSelectDialog(null)}
        onSubmit={handleTeamApplicationSubmitted}
        cohort={activeTeamSelectDialog?.cohort}
        teams={activeTeamSelectDialog?.teams || []}
      />
      
      {/* Initiative Conflict Dialog */}
      <InitiativeConflictDialog
        open={showInitiativeConflictDialog}
        onClose={() => {
          setShowInitiativeConflictDialog(false);
          setActiveApplication(null); // Close the sheet on conflict dialog close
        }}
        details={conflictDetails}
        conflictType="initiative_conflict"
      />
    </>
  )
}

// Wrap with auth protection
export const getServerSideProps = withPageAuthRequired()

export default Onboarding