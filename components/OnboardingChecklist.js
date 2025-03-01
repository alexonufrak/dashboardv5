"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@auth0/nextjs-auth0/client'
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  Circle, 
  Users, 
  UserRound, 
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
  
  // Core state
  const [steps, setSteps] = useState([
    { 
      id: 'register', 
      title: 'Create an account', 
      completed: true, 
      description: 'Sign up with your institutional email',
      icon: <UserPlus className="h-5 w-5" />
    },
    { 
      id: 'selectCohort', 
      title: 'Get involved', 
      completed: false, 
      description: 'Select a program to join',
      icon: <Compass className="h-5 w-5" />
    },
    { 
      id: 'connexions', 
      title: 'Join ConneXions', 
      completed: false, 
      description: 'Connect with the community',
      icon: <Users className="h-5 w-5" />
    }
  ])
  
  // UI state
  const [activeTab, setActiveTab] = useState("overview")
  const [isExpanded, setIsExpanded] = useState(true)
  const [completionPercentage, setCompletionPercentage] = useState(33)
  
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
    completeStep('register', false);
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
    const completedCount = steps.filter(step => step.completed).length;
    const percentage = Math.round((completedCount / steps.length) * 100);
    setCompletionPercentage(percentage);
    
    // Find first incomplete step and set as active tab
    const firstIncompleteStep = steps.find(step => !step.completed);
    if (firstIncompleteStep && activeTab === "overview") {
      setActiveTab(firstIncompleteStep.id);
    }
  }, [steps]);
  
  // Load user metadata from API
  const loadUserMetadata = async () => {
    try {
      const response = await fetch('/api/user/metadata');
      if (response.ok) {
        const metadata = await response.json();
        
        // Update steps based on metadata
        if (metadata.onboarding && Array.isArray(metadata.onboarding)) {
          const updatedSteps = steps.map(step => ({
            ...step,
            completed: metadata.onboarding.includes(step.id)
          }));
          
          setSteps(updatedSteps);
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
            completeStep('selectCohort');
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
  
  // Complete a step
  const completeStep = async (stepId, saveToApi = true) => {
    // Update local state
    const updatedSteps = steps.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    );
    
    setSteps(updatedSteps);
    
    // Save to user metadata if requested
    if (saveToApi) {
      try {
        // Get all completed step IDs including the new one
        const completedStepIds = [
          ...updatedSteps.filter(s => s.completed).map(s => s.id)
        ];
        
        // Ensure unique step IDs
        const uniqueStepIds = [...new Set(completedStepIds)];
        
        await fetch('/api/user/metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            onboarding: uniqueStepIds
          })
        });
        
        // If this was the selectCohort step, we should transition to completed state
        if (stepId === 'selectCohort') {
          // Check if all steps are now completed
          const allCompleted = updatedSteps.every(s => s.completed);
          if (allCompleted) {
            // Auto-complete the onboarding if all steps are done
            completeOnboarding();
          } else {
            // Find and set the next incomplete step as active tab
            const nextIncompleteStep = updatedSteps.find(s => !s.completed);
            if (nextIncompleteStep) {
              setActiveTab(nextIncompleteStep.id);
            }
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
    completeStep('selectCohort');
  };
  
  // Handle team application submission
  const handleTeamApplicationSubmitted = (application) => {
    setActiveTeamSelectDialog(null);
    completeStep('selectCohort');
  };
  
  // Complete onboarding
  const completeOnboarding = async () => {
    // Check if the user has completed the program application step
    const selectCohortStep = steps.find(step => step.id === 'selectCohort');
    const hasAppliedToProgram = selectCohortStep && selectCohortStep.completed;
    
    try {
      // Only fully complete if the user has applied to a program
      const metadata = hasAppliedToProgram 
        ? {
            onboardingCompleted: true,
            onboardingSkipped: false
          }
        : {
            onboardingSkipped: true,
            keepOnboardingVisible: true
          };
      
      // Save to API
      await fetch('/api/user/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
      });
      
      // Call parent callback
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
  
  // Skip onboarding
  const skipOnboarding = async () => {
    try {
      // Mark as skipped but still visible in condensed form
      await fetch('/api/user/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          onboardingSkipped: true,
          keepOnboardingVisible: true
        })
      });
      
      // Call parent callback with skipOnly=true
      if (onComplete) {
        onComplete(true, false);
      }
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      // Still try to complete UI flow
      if (onComplete) {
        onComplete(true, false);
      }
    }
  };
  
  // Check if all steps are completed
  const allStepsCompleted = steps.every(step => step.completed);
  
  // Render the progress bar with step indicators
  const renderProgressBar = () => {
    return (
      <div className="relative mt-6 mb-8">
        <Progress value={completionPercentage} className="h-2" />
        <div className="flex justify-between mt-1">
          {steps.map((step, index) => {
            const position = `${(index / (steps.length - 1)) * 100}%`;
            return (
              <div 
                key={step.id}
                className="absolute flex flex-col items-center"
                style={{ left: position, transform: 'translateX(-50%)' }}
              >
                <div 
                  className={`
                    w-4 h-4 rounded-full flex items-center justify-center 
                    ${step.completed 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 text-gray-500'}
                  `}
                >
                  {step.completed && <CheckCircle className="h-3 w-3" />}
                </div>
                <span className="text-xs mt-1 whitespace-nowrap font-medium text-gray-500">
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <Card className="mb-6 shadow-md border-primary/10 overflow-hidden">
      {/* Card Header */}
      <CardHeader 
        className={`
          cursor-pointer transition-colors duration-200 py-5
          bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950
        `}
        onClick={toggleExpanded}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl md:text-2xl text-primary">
              Welcome to xFoundry!
            </CardTitle>
            <CardDescription className="mt-1">
              Complete these steps to set up your account
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={e => { 
              e.stopPropagation();
              toggleExpanded();
            }}
            className="h-9 w-9 p-0 rounded-full bg-white/50"
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>
        
        {/* Show progress indicator in collapsed state */}
        {!isExpanded && (
          <div className="flex items-center mt-3">
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
                  {steps.filter(s => s.completed).length}/{steps.length} steps
                </span>
              </div>
            </div>
          </div>
        )}
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
      
      {/* Expanded content */}
      {isExpanded && (
        <>
          <CardContent className="p-0">
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              {/* Tab List */}
              <div className="border-b px-6 pt-4">
                <TabsList className="w-full grid grid-cols-4 bg-transparent p-0 gap-2 h-auto">
                  <TabsTrigger 
                    value="overview"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg text-sm py-2 px-3 h-auto"
                  >
                    Overview
                  </TabsTrigger>
                  
                  {steps.map((step) => (
                    <TabsTrigger 
                      key={step.id}
                      value={step.id}
                      className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg text-sm py-2 px-3 h-auto"
                      disabled={step.id === 'register'}
                    >
                      {step.title}
                      {step.completed && (
                        <CheckCircle className="h-3.5 w-3.5 ml-1 text-green-400" />
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              
              {/* Overview Tab Content */}
              <TabsContent value="overview" className="mt-0 px-6 py-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-medium mb-2">
                    Your onboarding progress
                  </h3>
                  <p className="text-muted-foreground">
                    Complete these steps to get started with xFoundry
                  </p>
                </div>
                
                {/* Progress Bar */}
                {renderProgressBar()}
                
                {/* Step List */}
                <div className="space-y-3 mt-8">
                  {steps.map((step) => (
                    <div 
                      key={step.id}
                      className={`
                        flex items-center p-4 rounded-lg border border-gray-100 
                        ${step.completed ? 'bg-green-50' : 'bg-white hover:bg-gray-50'}
                        transition-colors duration-200
                      `}
                    >
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center mr-4
                        ${step.completed 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-primary/10 text-primary'}
                      `}>
                        {step.completed ? <CheckCircle className="h-5 w-5" /> : step.icon}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className={`
                          font-medium
                          ${step.completed ? 'text-green-700' : 'text-gray-900'}
                        `}>
                          {step.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                      
                      {!step.completed && step.id !== 'register' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-2"
                          onClick={() => setActiveTab(step.id)}
                        >
                          Start
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      )}
                      
                      {step.completed && (
                        <Badge variant="success" className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">
                          Completed
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              {/* Register Tab Content (always completed) */}
              <TabsContent value="register" className="mt-0 px-6 py-6">
                <div className="flex items-center justify-center flex-col text-center p-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-medium text-green-700 mb-2">
                    Account created successfully!
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    You've successfully created your xFoundry account. Continue with the next steps to complete your onboarding.
                  </p>
                </div>
              </TabsContent>
              
              {/* Select Cohort Tab Content */}
              <TabsContent value="selectCohort" className="mt-0 px-6 py-6">
                {!steps.find(s => s.id === 'selectCohort')?.completed ? (
                  <>
                    <h3 className="text-lg font-medium mb-2">
                      Select a program to apply for
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Choose from the available programs below to join the xFoundry community
                    </p>
                    
                    {/* Available Programs */}
                    <CohortGrid 
                      cohorts={profile.cohorts || []}
                      profile={profile}
                      isLoading={isLoading}
                      onApply={handleCohortApply}
                      onApplySuccess={(cohort) => completeStep('selectCohort')}
                      columns={{ default: 1, md: 2, lg: 2 }}
                      emptyMessage="No programs are currently available for your institution."
                    />
                  </>
                ) : (
                  <div className="flex items-center justify-center flex-col text-center p-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-medium text-green-700 mb-2">
                      You've applied to a program!
                    </h3>
                    <p className="text-muted-foreground max-w-md mb-4">
                      Your application has been submitted. You'll receive updates about your application status soon.
                    </p>
                    <Button variant="outline" onClick={() => setActiveTab("connexions")}>
                      Continue to next step
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              {/* ConneXions Tab Content */}
              <TabsContent value="connexions" className="mt-0 px-6 py-6">
                {!steps.find(s => s.id === 'connexions')?.completed ? (
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-medium mb-4">
                      Join ConneXions Community
                    </h3>
                    <p className="text-muted-foreground max-w-lg mb-6">
                      Connect with students, mentors, and faculty in your program. Join ConneXions to collaborate, share resources, and get support for your projects.
                    </p>
                    <Button 
                      className="gap-2"
                      onClick={() => {
                        completeStep('connexions');
                        window.open("https://connexions.xfoundry.org", "_blank");
                      }}
                    >
                      Go to ConneXions
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center flex-col text-center p-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-medium text-green-700 mb-2">
                      You're connected!
                    </h3>
                    <p className="text-muted-foreground max-w-md mb-4">
                      You've successfully joined the ConneXions community.
                    </p>
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => window.open("https://connexions.xfoundry.org", "_blank")}
                    >
                      Visit ConneXions
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="justify-between bg-gray-50 border-t border-gray-100 p-4">
            <span className="text-sm text-muted-foreground">
              {completionPercentage}% complete • {steps.filter(s => s.completed).length} of {steps.length} tasks done
            </span>
            
            {allStepsCompleted ? (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={completeOnboarding}
              >
                Complete Onboarding
              </Button>
            ) : (
              <Button 
                variant="outline"
                onClick={skipOnboarding}
              >
                Continue to Dashboard
              </Button>
            )}
          </CardFooter>
        </>
      )}
    </Card>
  );
};

export default OnboardingChecklist;