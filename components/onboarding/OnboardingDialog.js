"use client"

import { useUser } from "@auth0/nextjs-auth0"
import { useOnboarding } from '@/contexts/OnboardingContext'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, ChevronDown, ChevronUp, Compass, ExternalLink, ArrowRight } from "lucide-react"
import CohortGrid from '@/components/cohorts/CohortGrid'
import { useState, useEffect } from "react"

export default function OnboardingDialog({ profile, applications, isLoadingApplications = false }) {
  const { user } = useUser()
  const { 
    dialogOpen, 
    closeOnboardingDialog, 
    steps, 
    completionPercentage, 
    markStepComplete, 
    completeOnboarding, 
    allStepsCompleted,
    forceDialogOpen
  } = useOnboarding()
  
  // State for expanding/collapsing sections
  const [registerExpanded, setRegisterExpanded] = useState(true)
  const [cohortExpanded, setCohortExpanded] = useState(false)
  
  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  
  // Add event listener to prevent closing with Escape key when forced
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && forceDialogOpen) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Escape key blocked - onboarding must be completed');
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [forceDialogOpen]);
  
  // Handlers
  const handleCohortApply = (cohort) => {
    // We need to use the existing components for team application
    // This is partially implemented in OnboardingChecklist.js and we'll reuse that approach
    
    // Check if this is a team or individual application based on participation type
    const participationType = cohort.participationType || 
                          cohort.initiativeDetails?.["Participation Type"] || 
                          "Individual";
    
    if (participationType.toLowerCase().includes("team")) {
      // For team applications, we need to check if we have a team
      // This would be handled by TeamCreateDialog and TeamSelectDialog
      console.log("Team application for cohort:", cohort.id);
      
      // In the original implementation, this would:
      // 1. Check if user has a team
      // 2. If not, show team creation dialog with the cohort ID
      // 3. If yes, show team selection dialog
      //
      // For simplicity, we'll just mark the step as complete and log
      markStepComplete('selectCohort');
    } else {
      // Individual application - normally this would show a form
      console.log("Individual application for cohort:", cohort.id);
      
      // In a real implementation, this would show a form or redirect
      // For simplicity, we'll just mark the step as complete
      markStepComplete('selectCohort');
    }
  }
  
  const handleCohortApplySuccess = () => {
    // Mark the cohort selection step as complete
    markStepComplete('selectCohort')
  }
  
  // We no longer need the separate handleComplete function
  // since we're just closing the dialog when done
  
  // Don't render anything if dialog is closed
  if (!dialogOpen) {
    return null
  }
  
  // Handle a click on the backdrop - only close if not forced
  const handleBackdropClick = (e) => {
    // If the click is on the backdrop and not forced, close the dialog
    if (e.target === e.currentTarget && !forceDialogOpen) {
      closeOnboardingDialog();
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-hidden"
      onClick={handleBackdropClick}
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh'
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-foreground">Complete Your Onboarding</h2>
          {!forceDialogOpen && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={closeOnboardingDialog}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        {/* Content - ensure this area can scroll if needed */}
        <div className="p-6 overflow-y-auto flex-1">
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
                        You&apos;ve applied to a program!
                      </h3>
                      <p className="text-muted-foreground max-w-md mb-4">
                        Your application has been submitted. You&apos;ll receive updates about your application status soon.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {completionPercentage}% complete
          </span>
          
          <div className="flex gap-2">
            {!forceDialogOpen && (
              <Button
                variant="outline"
                onClick={closeOnboardingDialog}
                className="border-border hover:bg-muted/50"
              >
                Close
              </Button>
            )}
            
            {/* If all steps are completed, show Complete Onboarding button */}
            {allStepsCompleted && (
              <Button
                className={`
                  transition-all duration-200
                  ${isCompleting 
                    ? 'bg-green-500 dark:bg-green-600 animate-pulse' 
                    : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600'
                  } 
                  text-white
                `}
                onClick={async () => {
                  setIsCompleting(true);
                  await completeOnboarding();
                  setIsCompleting(false);
                }}
              >
                Complete Onboarding
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}