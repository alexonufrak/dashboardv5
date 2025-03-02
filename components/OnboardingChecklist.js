"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@auth0/nextjs-auth0/client'
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

const OnboardingChecklist = ({ profile, onComplete }) => {
  const { user } = useUser()
  const router = useRouter()
  
  // Core state - separate state for each step's expansion status
  const [registerExpanded, setRegisterExpanded] = useState(true)
  const [cohortExpanded, setCohortExpanded] = useState(false)
  
  const [stepStatus, setStepStatus] = useState({
    register: { completed: true, title: 'Create an account', description: 'Sign up with your institutional email' },
    selectCohort: { completed: false, title: 'Get involved', description: 'Select a program to join' }
  })
  
  // UI state
  const [isExpanded, setIsExpanded] = useState(true)
  const [completionPercentage, setCompletionPercentage] = useState(50)
  
  // Functional state
  const [activeFilloutForm, setActiveFilloutForm] = useState(null)
  const [activeTeamSelectDialog, setActiveTeamSelectDialog] = useState(null)
  const [activeTeamCreateDialog, setActiveTeamCreateDialog] = useState(false)
  const [checkedCohortSubmission, setCheckedCohortSubmission] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState(null)
  const [userTeams, setUserTeams] = useState([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  
  // Initialize onboarding state
  useEffect(() => {
    // Check for cohort ID in URL
    const cohortId = router.query.cohortId;
    if (cohortId) {
      // Save cohort ID to user metadata
      saveCohortToMetadata(cohortId);
      setSelectedCohort(cohortId);
    }
    
    // Load user metadata
    loadUserMetadata();
    
    // Always mark register step as completed
    markStepComplete('register', false);
    
    // Expand the first step by default
    setRegisterExpanded(true);
    setCohortExpanded(false);
  }, []);
  
  // When profile changes, fetch team data
  useEffect(() => {
    if (profile?.contactId) {
      fetchUserTeams();
      checkCohortSubmission();
    }
  }, [profile]);
  
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
  
  // Load user metadata from API
  const loadUserMetadata = async () => {
    try {
      const response = await fetch('/api/user/metadata');
      if (response.ok) {
        const metadata = await response.json();
        
        // Update steps based on metadata
        if (metadata.onboarding && Array.isArray(metadata.onboarding)) {
          const updatedStatus = { ...stepStatus };
          
          Object.keys(updatedStatus).forEach(stepId => {
            updatedStatus[stepId].completed = metadata.onboarding.includes(stepId);
          });
          
          setStepStatus(updatedStatus);
        }
        
        // Set selected cohort if available
        if (metadata.selectedCohort) {
          setSelectedCohort(metadata.selectedCohort);
        }
      }
    } catch (error) {
      console.error('Error loading user metadata:', error);
    }
  };
  
  // Fetch user teams
  const fetchUserTeams = async () => {
    if (!profile?.contactId || isLoadingTeams) return;
    
    setIsLoadingTeams(true);
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setUserTeams(data.teams || []);
      }
    } catch (error) {
      console.error('Error fetching user teams:', error);
    } finally {
      setIsLoadingTeams(false);
    }
  };
  
  // Check if user has already applied to the selected cohort
  const checkCohortSubmission = async () => {
    if (selectedCohort && !checkedCohortSubmission && profile?.contactId) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/user/check-application?cohortId=${selectedCohort}&contactId=${profile.contactId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.hasApplied) {
            // Mark the selectCohort step as completed
            markStepComplete('selectCohort');
          }
        }
      } catch (error) {
        console.error('Error checking cohort submission:', error);
      } finally {
        setCheckedCohortSubmission(true);
        setIsLoading(false);
      }
    }
  };
  
  // Save selected cohort to user metadata
  const saveCohortToMetadata = async (cohortId) => {
    try {
      await fetch('/api/user/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          selectedCohort: cohortId
        })
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
        
        await fetch('/api/user/metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            onboarding: completedStepIds
          })
        });
        
        // If this was the selectCohort step, we should transition to completed state
        if (stepId === 'selectCohort') {
          // Check if all steps are now completed
          if (stepStatus.register.completed) {
            // Auto-complete the onboarding if all steps are done
            completeOnboarding();
          }
        }
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
      if (userTeams.length === 0) {
        // User doesn't have a team, show team creation dialog
        setActiveTeamCreateDialog(true);
        setSelectedCohort(cohort.id);
      } else {
        // User has teams, show team selection dialog
        setActiveTeamSelectDialog({
          cohort: cohort,
          teams: userTeams
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
    // Add new team to user's teams
    setUserTeams(prev => [...prev, team]);
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
  };
  
  // Handle completion of form submission
  const handleFormCompleted = () => {
    setActiveFilloutForm(null);
    markStepComplete('selectCohort');
  };
  
  // Handle team application submission
  const handleTeamApplicationSubmitted = (application) => {
    setActiveTeamSelectDialog(null);
    markStepComplete('selectCohort');
  };
  
  // Complete onboarding
  const completeOnboarding = async () => {
    // Check if the user has completed the program application step
    const hasAppliedToProgram = stepStatus.selectCohort.completed;
    
    try {
      // Set onboarding as completed
      const metadata = {
        onboardingCompleted: true,
        onboardingSkipped: !hasAppliedToProgram,
        keepOnboardingVisible: false
      };
      
      // Save to API
      await fetch('/api/user/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
      });
      
      // Call parent callback - this will hide the checklist
      if (onComplete) {
        onComplete(false, hasAppliedToProgram);
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still try to complete UI flow
      if (onComplete) {
        onComplete(false, hasAppliedToProgram);
      }
    }
  };
  
  // Check if all steps are completed
  const allStepsCompleted = Object.values(stepStatus).every(step => step.completed);
  
  return (
    <Card className="mb-6 shadow-md border-primary/10 overflow-hidden">
      {/* Card Header */}
      <CardHeader 
        className={`
          cursor-pointer transition-colors duration-200 py-5
          bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950
          hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900 dark:hover:to-cyan-900
        `}
        onClick={toggleExpanded}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl md:text-2xl text-primary">
              Welcome to xFoundry!
            </CardTitle>
            <CardDescription className="mt-1">
              Let's get you started in just a few steps
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={e => { 
              e.stopPropagation();
              toggleExpanded();
            }}
            className="h-9 w-9 p-0 rounded-full bg-white/50 hover:bg-white/80 transition-all duration-200"
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>
        
        {/* Show progress indicator in collapsed state - Animated */}
        <div className={`
          mt-3 transition-all duration-300 ease-in-out overflow-hidden
          ${!isExpanded ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="w-full">
            <Progress 
              value={completionPercentage} 
              className="h-2 bg-white/50" 
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-medium text-primary/80">
                Progress: {completionPercentage}% complete
              </span>
              <span className="text-xs text-primary/80">
                {Object.values(stepStatus).filter(s => s.completed).length}/{Object.keys(stepStatus).length} steps
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {/* Fillout form popup */}
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
      
      {/* Expanded content with animation */}
      <div className={`
        transition-all duration-500 ease-in-out overflow-hidden
        ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
      `}>
        <CardContent className="p-6">
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
          <div className="space-y-1">
            {/* Register Step */}
            <div className="border rounded-lg overflow-hidden mb-4 shadow-sm border-green-100">
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
              border rounded-lg overflow-hidden mb-4 shadow-sm 
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
        </CardContent>
        
        <CardFooter className="justify-between bg-gray-50 border-t border-gray-100 p-4">
          <span className="text-sm text-muted-foreground">
            {completionPercentage}% complete
          </span>
          
          {allStepsCompleted ? (
            <Button
              className="bg-green-600 hover:bg-green-700 text-white transition-all duration-200"
              onClick={completeOnboarding}
            >
              Complete Onboarding
            </Button>
          ) : (
            <Button 
              variant="outline"
              className="transition-all duration-200"
              onClick={toggleExpanded}
            >
              Collapse Checklist
            </Button>
          )}
        </CardFooter>
      </div>
    </Card>
  );
};

export default OnboardingChecklist;