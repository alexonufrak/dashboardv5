"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@auth0/nextjs-auth0/client'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  Users, 
  ChevronDown, 
  ChevronUp,
  ArrowRight,
  ExternalLink,
  UserPlus,
  Compass
} from "lucide-react"
import CohortGrid from './shared/CohortGrid'
import TeamCreateDialog from './TeamCreateDialog'
import TeamSelectDialog from './TeamSelectDialog'
import FilloutPopupEmbed from './FilloutPopupEmbed'

// Import our data fetching hooks
import { 
  useTeamsData, 
  useApplicationsData, 
  useUserMetadata,
  useUpdateUserMetadata,
  useUpdateOnboardingStatus,
  useCreateTeam
} from '@/lib/useDataFetching'

const OnboardingChecklist = ({ 
  profile, 
  onComplete, 
  applications = [], 
  isLoadingApplications = false,
  onApplySuccess = null
}) => {
  const { user } = useUser()
  const router = useRouter()
  
  const queryClient = useQueryClient()
  
  // Core state - separate state for each step's expansion status
  const [registerExpanded, setRegisterExpanded] = useState(true)
  const [cohortExpanded, setCohortExpanded] = useState(false)
  
  // Use our React Query hooks for data fetching
  const { data: userMetadata = {} } = useUserMetadata()
  const { data: teamData = [], isLoading: isLoadingTeams } = useTeamsData()
  const { data: appData = [], isLoading: isLoadingAppData, refetch: refetchApps } = useApplicationsData()
  
  // Use our mutation hooks
  const updateMetadata = useUpdateUserMetadata()
  const updateOnboarding = useUpdateOnboardingStatus()
  const createTeamMutation = useCreateTeam()
  
  // Combine applications - prefer the ones passed as props, but use our query data if not provided
  const allApplications = Array.isArray(applications) && applications.length > 0 
    ? applications 
    : appData
  
  // Check if user has any applications (used for step completion state)
  const hasApplications = Array.isArray(allApplications) && allApplications.length > 0
  
  const [stepStatus, setStepStatus] = useState({
    register: { completed: true, title: 'Create an account', description: 'Sign up with your institutional email' },
    selectCohort: { 
      completed: hasApplications, // Initialize based on applications
      title: 'Get involved', 
      description: 'Select a program to join' 
    }
  })
  
  // UI state
  const [isExpanded, setIsExpanded] = useState(true)
  const [completionPercentage, setCompletionPercentage] = useState(hasApplications ? 100 : 50)
  const [isCompleting, setIsCompleting] = useState(false) // Animation state
  
  // Functional state
  const [activeFilloutForm, setActiveFilloutForm] = useState(null)
  const [activeTeamSelectDialog, setActiveTeamSelectDialog] = useState(null)
  const [activeTeamCreateDialog, setActiveTeamCreateDialog] = useState(false)
  const [checkedCohortSubmission, setCheckedCohortSubmission] = useState(hasApplications)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState(
    hasApplications && allApplications[0]?.cohortId ? allApplications[0].cohortId : 
    userMetadata?.selectedCohort || null
  )
  
  // Initialize onboarding state
  useEffect(() => {
    // Check for cohort ID in URL
    const cohortId = router.query.cohortId;
    if (cohortId) {
      // Save cohort ID to user metadata
      saveCohortToMetadata(cohortId);
      setSelectedCohort(cohortId);
    }
    
    // Always mark register step as completed
    markStepComplete('register', false);
    
    // Expand the first step by default
    setRegisterExpanded(true);
    setCohortExpanded(false);
  }, []);
  
  // When userMetadata changes, update state based on what's in metadata
  useEffect(() => {
    if (userMetadata) {
      // Update steps based on metadata
      if (userMetadata.onboarding && Array.isArray(userMetadata.onboarding)) {
        const updatedStatus = { ...stepStatus };
        
        Object.keys(updatedStatus).forEach(stepId => {
          updatedStatus[stepId].completed = userMetadata.onboarding.includes(stepId);
        });
        
        setStepStatus(updatedStatus);
      }
      
      // Set selected cohort if available
      if (userMetadata.selectedCohort && !selectedCohort) {
        setSelectedCohort(userMetadata.selectedCohort);
      }
    }
  }, [userMetadata]);
  
  // When teamData changes, update local state
  useEffect(() => {
    // If user has teams and cohort completion is set, check if we need to mark the step as completed
    if (teamData && teamData.length > 0 && allApplications && allApplications.length > 0) {
      // If user has a team and applications, mark step as completed
      if (!stepStatus.selectCohort.completed) {
        markStepComplete('selectCohort');
      }
    }
  }, [teamData, allApplications]);
  
  // Update step status when applications data changes
  useEffect(() => {
    if (!isLoadingApplications) {
      // If we have applications, mark step as completed
      if (hasApplications && !stepStatus.selectCohort.completed) {
        console.log('Setting selectCohort to completed from applications data');
        setStepStatus(prev => ({
          ...prev,
          selectCohort: {
            ...prev.selectCohort,
            completed: true
          }
        }));
        
        // If we have a cohort ID, save it
        if (allApplications[0]?.cohortId) {
          setSelectedCohort(allApplications[0].cohortId);
          saveCohortToMetadata(allApplications[0].cohortId);
        }
      }
    }
  }, [allApplications, isLoadingApplications]);
  
  // Update completion percentage when steps change
  useEffect(() => {
    const completedCount = Object.values(stepStatus).filter(step => step.completed).length;
    const percentage = Math.round((completedCount / Object.keys(stepStatus).length) * 100);
    setCompletionPercentage(percentage);
    
    // Auto-expand the cohort step if register is completed
    if (stepStatus.register.completed && !stepStatus.selectCohort.completed) {
      setCohortExpanded(true);
    }
  }, [stepStatus]);
  
  // These functions are now replaced by React Query hooks
  
  // Save selected cohort to user metadata using our mutation hook
  const saveCohortToMetadata = async (cohortId) => {
    try {
      // Use our mutation hook to update metadata with proper cache invalidation
      await updateMetadata.mutateAsync({
        selectedCohort: cohortId
      });
    } catch (error) {
      console.error('Error saving cohort to metadata:', error);
    }
  };
  
  // Mark a step as complete
  const markStepComplete = async (stepId, saveToApi = true) => {
    // Update local state
    setStepStatus(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        completed: true
      }
    }));
    
    // Save to user metadata if requested
    if (saveToApi) {
      try {
        // Get all completed step IDs
        const completedStepIds = [];
        Object.entries(stepStatus).forEach(([id, step]) => {
          if (step.completed || id === stepId) {
            completedStepIds.push(id);
          }
        });
        
        // Use our mutation hook to update metadata with proper cache invalidation
        await updateMetadata.mutateAsync({
          onboarding: completedStepIds
        });
        
        // REMOVED auto-completion - we want the user to explicitly click "Complete Onboarding"
        // Now the user must always click the button to complete onboarding
      } catch (error) {
        console.error('Error saving step completion to metadata:', error);
      }
    }
  };
  
  // Toggle the entire checklist expanded/collapsed state
  const toggleExpanded = () => {
    setIsExpanded(prev => !prev);
  };
  
  // Handle clicking a cohort card to apply
  const handleCohortApply = (cohort) => {
    // Determine participation type
    const participationType = cohort.participationType || 
                             cohort.initiativeDetails?.["Participation Type"] || 
                             "Individual";
    
    // Check if this is a team or individual application
    if (participationType.toLowerCase().includes("team")) {
      // Team application flow
      if (!teamData || teamData.length === 0) {
        // User doesn't have a team, show team creation dialog
        setActiveTeamCreateDialog(true);
        setSelectedCohort(cohort.id);
      } else {
        // User has teams, show team selection dialog
        setActiveTeamSelectDialog({
          cohort: cohort,
          teams: teamData // Use our cached team data
        });
      }
    } else {
      // Individual application - use Fillout form
      if (cohort && cohort["Application Form ID (Fillout)"]) {
        setActiveFilloutForm({
          formId: cohort["Application Form ID (Fillout)"],
          cohortId: cohort.id,
          initiativeName: cohort.initiativeDetails?.name || "Program Application"
        });
      } else {
        console.error("No Fillout form ID found for individual participation");
      }
    }
  };
  
  // Handle team creation
  const handleTeamCreated = (team) => {
    // No need to manually update our team state - React Query will handle it
    setActiveTeamCreateDialog(false);
    
    // If we have a pending cohort, open the team selection dialog
    if (selectedCohort) {
      const cohort = profile.cohorts?.find(c => c.id === selectedCohort);
      if (cohort) {
        setActiveTeamSelectDialog({
          cohort: cohort,
          teams: [team]
        });
      }
    }
    
    // Invalidate team queries to ensure we have the latest data
    queryClient.invalidateQueries({ queryKey: ['teams'] });
  };
  
  // Handle completion of form submission
  const handleFormCompleted = async () => {
    setActiveFilloutForm(null);
    
    // Mark the step as complete
    await markStepComplete('selectCohort');
    
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['teams'] });
    queryClient.invalidateQueries({ queryKey: ['applications'] });
    
    // Manually refetch applications if needed
    await refetchApps();
    
    // Call onApplySuccess callback if provided in props
    if (onApplySuccess && selectedCohort) {
      const cohort = profile.cohorts?.find(c => c.id === selectedCohort);
      if (cohort) {
        onApplySuccess(cohort);
      }
    }
  };
  
  // Handle team application submission
  const handleTeamApplicationSubmitted = async (application) => {
    setActiveTeamSelectDialog(null);
    
    // Mark the step as complete
    await markStepComplete('selectCohort');
    
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['teams'] });
    queryClient.invalidateQueries({ queryKey: ['applications'] });
    
    // Call onApplySuccess callback if provided in props
    if (onApplySuccess && application?.cohortId) {
      const cohort = profile.cohorts?.find(c => c.id === application.cohortId);
      if (cohort) {
        onApplySuccess(cohort);
      }
    }
  };
  
  // Complete onboarding with animation and ensure API is updated
  const completeOnboarding = () => {
    // Check if the user has completed the program application step
    const hasAppliedToProgram = stepStatus.selectCohort.completed;
    
    // Log completion attempt with details
    console.log("User clicked 'Complete Onboarding' button:", {
      hasAppliedToProgram,
      stepStatus: JSON.stringify(stepStatus),
      completionPercentage
    });
    
    // Start the completion animation
    setIsCompleting(true);
    
    // Use our mutation hook to mark onboarding as completed in the API
    updateOnboarding.mutate(true, {
      onSuccess: () => {
        // Delay the actual callback slightly to allow animation to play
        setTimeout(() => {
          // Then call parent callback to hide checklist
          if (onComplete) {
            console.log("Calling parent onComplete to hide checklist");
            onComplete(false, hasAppliedToProgram);
          }
        }, 800); // Slight delay for animation to be visible
      }
    });
  };
  
  // Check if all steps are completed
  const allStepsCompleted = Object.values(stepStatus).every(step => step.completed);
  
  return (
    <>
      {/* Welcome Banner - Always visible */}
      <Card className={`
        mb-6 shadow-md border-primary/10 overflow-hidden transition-all
        ${isCompleting ? 'animate-complete-fade' : ''}
      `}>
        <CardHeader 
          className={`
            transition-all duration-200 py-5
            bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950
            ${isCompleting ? 'bg-green-100 dark:bg-green-900' : ''}
          `}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl md:text-2xl text-primary">
                Welcome to xFoundry!
              </CardTitle>
              <CardDescription className="mt-1">
                {allStepsCompleted ? 
                  "You've completed all onboarding steps!" : 
                  "Complete the onboarding to get started"}
              </CardDescription>
            </div>
            
            {/* Progress bar only shown when not all steps completed */}
            {!allStepsCompleted && (
              <div className="flex items-center gap-3">
                <div className="hidden md:block w-48">
                  <Progress value={completionPercentage} className="h-2" />
                </div>
                <Button 
                  onClick={() => setIsExpanded(true)}
                  size="sm"
                >
                  Continue Onboarding
                </Button>
              </div>
            )}
            
            {/* Complete button shown only when all steps completed */}
            {allStepsCompleted && (
              <Button
                className={`
                  transition-all duration-200
                  ${isCompleting ? 'bg-green-500 scale-110 shadow-lg animate-pulse' : 'bg-green-600 hover:bg-green-700'} 
                  text-white
                `}
                onClick={completeOnboarding}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <span className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 animate-bounce" />
                    Completing...
                  </span>
                ) : (
                  "Complete Onboarding"
                )}
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>
      
      {/* Fullscreen Dialog for Onboarding Steps */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Complete Your Onboarding</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsExpanded(false)}
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {/* Progress indicator */}
              <div className="mb-6">
                <div className="flex justify-between mb-1">
                  <div className="text-sm font-medium text-primary">Your progress</div>
                  <div className="text-sm text-muted-foreground">
                    {Object.values(stepStatus).filter(s => s.completed).length}/{Object.keys(stepStatus).length} complete
                  </div>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>
              
              {/* Steps */}
              <div className="space-y-6">
                {/* Register Step */}
                <div className="border rounded-lg overflow-hidden shadow-sm border-green-100">
                  {/* Step Header */}
                  <div 
                    className="flex items-center p-4 cursor-pointer transition-colors duration-200 bg-green-50 hover:bg-green-100/80"
                    onClick={() => setRegisterExpanded(!registerExpanded)}
                  >
                    <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full mr-4 transition-all duration-300 text-green-600 bg-green-100">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    
                    <div className="grow">
                      <h3 className="text-base font-medium transition-colors duration-200 text-green-800">
                        {stepStatus.register.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{stepStatus.register.description}</p>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2 h-8 w-8 p-0"
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
                  
                  {/* Step Content - Animated */}
                  <div 
                    className={`
                      overflow-hidden transition-all duration-300 ease-in-out
                      ${registerExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}
                    `}
                  >
                    <div className="p-4 border-t border-gray-100">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium text-green-700 mb-3">
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
                  ${stepStatus.selectCohort.completed ? 'border-green-100' : 'border-gray-200'}
                `}>
                  {/* Step Header */}
                  <div 
                    className={`
                      flex items-center p-4 cursor-pointer transition-colors duration-200
                      ${stepStatus.selectCohort.completed ? 'bg-green-50 hover:bg-green-100/80' : 'bg-gray-50 hover:bg-gray-100/80'}
                    `}
                    onClick={() => setCohortExpanded(!cohortExpanded)}
                  >
                    <div className={`
                      shrink-0 w-10 h-10 flex items-center justify-center rounded-full mr-4 transition-all duration-300
                      ${stepStatus.selectCohort.completed ? 'text-green-600 bg-green-100' : 'text-primary bg-primary/10'}
                    `}>
                      {stepStatus.selectCohort.completed ? <CheckCircle className="h-5 w-5" /> : <Compass className="h-5 w-5" />}
                    </div>
                    
                    <div className="grow">
                      <h3 className={`
                        text-base font-medium transition-colors duration-200
                        ${stepStatus.selectCohort.completed ? 'text-green-800' : 'text-gray-800'}
                      `}>
                        {stepStatus.selectCohort.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{stepStatus.selectCohort.description}</p>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2 h-8 w-8 p-0"
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
                  
                  {/* Step Content - Animated */}
                  <div 
                    className={`
                      overflow-hidden transition-all duration-300 ease-in-out
                      ${cohortExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}
                    `}
                  >
                    <div className="p-4 border-t border-gray-100">
                      {!stepStatus.selectCohort.completed ? (
                        <div>
                          <h3 className="text-lg font-medium mb-2">
                            Choose a program to join
                          </h3>
                          <p className="text-muted-foreground mb-6">
                            Select from the available programs below to apply and get started with xFoundry
                          </p>
                          
                          {/* Available Programs */}
                          <CohortGrid 
                            cohorts={profile.cohorts || []}
                            profile={profile}
                            isLoading={isLoading}
                            isLoadingApplications={isLoadingApplications}
                            applications={applications}
                            onApply={handleCohortApply}
                            onApplySuccess={(cohort) => markStepComplete('selectCohort')}
                            columns={{ default: 1, md: 2, lg: 2 }}
                            emptyMessage="No programs are currently available for your institution."
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <h3 className="text-xl font-medium text-green-700 mb-2">
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
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {completionPercentage}% complete
              </span>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsExpanded(false)}
                >
                  Close
                </Button>
                
                {allStepsCompleted && (
                  <Button
                    className={`
                      transition-all duration-200
                      ${isCompleting ? 'bg-green-500 animate-pulse' : 'bg-green-600 hover:bg-green-700'} 
                      text-white
                    `}
                    onClick={completeOnboarding}
                    disabled={isCompleting}
                  >
                    {isCompleting ? "Completing..." : "Complete Onboarding"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Embed all popups and dialogs */}
      {activeFilloutForm && (
        <FilloutPopupEmbed
          filloutId={activeFilloutForm.formId}
          onClose={() => setActiveFilloutForm(null)}
          onSubmit={handleFormCompleted}
          data-user_id={user?.sub}
          data-contact={profile?.contactId}
          data-institution={profile?.institution?.id}
          parameters={{
            cohortId: activeFilloutForm.cohortId,
            initiativeName: activeFilloutForm.initiativeName,
            userEmail: user?.email,
            userName: user?.name,
            userContactId: profile?.contactId,
            user_id: user?.sub,
            contact: profile?.contactId,
            institution: profile?.institution?.id
          }}
        />
      )}
      
      {/* Team selection dialog */}
      {activeTeamSelectDialog && (
        <TeamSelectDialog
          open={!!activeTeamSelectDialog}
          onClose={() => setActiveTeamSelectDialog(null)}
          onSubmit={handleTeamApplicationSubmitted}
          cohort={activeTeamSelectDialog.cohort}
          teams={activeTeamSelectDialog.teams || userTeams}
        />
      )}
      
      {/* Team creation dialog */}
      <TeamCreateDialog
        open={activeTeamCreateDialog}
        onClose={() => setActiveTeamCreateDialog(false)}
        onCreateTeam={handleTeamCreated}
      />
    </>
  );
};

export default OnboardingChecklist;