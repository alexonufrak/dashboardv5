import React, { useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useOnboarding } from "@/contexts/OnboardingContext";

import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Progress,
  Chip,
} from "@heroui/react";
import { CheckIcon, ArrowRightIcon, ChevronUpIcon, ChevronDownIcon, MapIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import CohortGrid from "./CohortGrid";
import { Button } from "@heroui/react";

interface Profile {
  id?: string;
  cohorts?: any[];
  [key: string]: any;
}

interface Application {
  id: string;
  cohortId: string;
  status: string;
  submittedDate: string;
  [key: string]: any;
}

interface OnboardingDialogProps {
  profile?: Profile | null;
  applications?: Application[];
  isLoadingApplications?: boolean;
}

export default function OnboardingDialog({ profile, applications = [], isLoadingApplications = false }: OnboardingDialogProps) {
  const { user } = useUser();
  const { 
    dialogOpen, 
    closeOnboardingDialog, 
    steps, 
    completionPercentage, 
    markStepComplete, 
    completeOnboarding, 
    allStepsCompleted 
  } = useOnboarding();
  
  // State for expanding/collapsing sections
  const [registerExpanded, setRegisterExpanded] = useState(true);
  const [cohortExpanded, setCohortExpanded] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  
  // Handlers
  interface Cohort {
    id: string;
    participationType?: string;
    initiativeDetails?: {
      [key: string]: any;
    };
    [key: string]: any;
  }

  const handleCohortApply = (cohort: Cohort) => {
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
  };
  
  const handleCohortApplySuccess = () => {
    // Mark the cohort selection step as complete
    markStepComplete('selectCohort');
  };
  
  return (
    <Modal 
      isOpen={dialogOpen} 
      onClose={closeOnboardingDialog}
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader>
          <h2 className="text-xl font-semibold">Complete Your Onboarding</h2>
        </ModalHeader>
        
        <ModalBody className="pb-8">
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex justify-between mb-1">
              <div className="text-sm font-medium text-primary">Your progress</div>
              <div className="text-sm text-default-500">
                {Object.values(steps).filter(s => s.completed).length}/{Object.keys(steps).length} complete
              </div>
            </div>
            <Progress value={completionPercentage} size="md" />
          </div>
          
          {/* Steps */}
          <div className="space-y-6">
            {/* Register Step */}
            <div className={`border rounded-lg overflow-hidden ${steps.register.completed ? 'border-success-200' : 'border-default-200'}`}>
              {/* Step Header */}
              <div 
                className={`
                  flex items-center p-4 cursor-pointer transition-colors duration-200
                  ${steps.register.completed ? 'bg-success-50 hover:bg-success-100' : 'bg-default-50 hover:bg-default-100'}
                `}
                onClick={() => setRegisterExpanded(!registerExpanded)}
              >
                <div className={`
                  shrink-0 w-10 h-10 flex items-center justify-center rounded-full mr-4 transition-all duration-300
                  ${steps.register.completed ? 'text-success bg-success-100' : 'text-primary bg-primary/10'}
                `}>
                  <CheckIcon className="h-5 w-5" />
                </div>
                
                <div className="grow">
                  <h3 className={`
                    text-base font-medium transition-colors duration-200
                    ${steps.register.completed ? 'text-success-700' : 'text-default-700'}
                  `}>
                    {steps.register.title}
                  </h3>
                  <p className="text-sm text-default-500">{steps.register.description}</p>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  isIconOnly
                  className="ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRegisterExpanded(!registerExpanded);
                  }}
                >
                  {registerExpanded ? 
                    <ChevronUpIcon className="h-4 w-4" /> : 
                    <ChevronDownIcon className="h-4 w-4" />
                  }
                </Button>
              </div>
              
              {/* Step Content */}
              {registerExpanded && (
                <div className="p-4 border-t border-default-100">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mb-4">
                      <CheckIcon className="h-8 w-8 text-success-600" />
                    </div>
                    <h3 className="text-lg font-medium text-success-700 mb-3">
                      Your account is set up!
                    </h3>
                    <p className="text-default-600 max-w-lg mb-6">
                      Welcome to xFoundry! You now have access to ConneXions, our community hub where you 
                      can connect with other students, mentors, and faculty in your program.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        variant="bordered"
                        endContent={<ArrowTopRightOnSquareIcon className="h-4 w-4" />}
                        onClick={() => window.open("https://connexions.xfoundry.org", "_blank")}
                      >
                        Visit ConneXions
                      </Button>
                      <Button
                        color="primary"
                        endContent={<ArrowRightIcon className="h-4 w-4" />}
                        onClick={() => {
                          setRegisterExpanded(false);
                          setCohortExpanded(true);
                        }}
                      >
                        Continue to next step
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Get Involved Step */}
            <div className={`
              border rounded-lg overflow-hidden
              ${steps.selectCohort.completed ? 'border-success-200' : 'border-default-200'}
            `}>
              {/* Step Header */}
              <div 
                className={`
                  flex items-center p-4 cursor-pointer transition-colors duration-200
                  ${steps.selectCohort.completed ? 'bg-success-50 hover:bg-success-100' : 'bg-default-50 hover:bg-default-100'}
                `}
                onClick={() => setCohortExpanded(!cohortExpanded)}
              >
                <div className={`
                  shrink-0 w-10 h-10 flex items-center justify-center rounded-full mr-4 transition-all duration-300
                  ${steps.selectCohort.completed ? 'text-success bg-success-100' : 'text-primary bg-primary/10'}
                `}>
                  {steps.selectCohort.completed ? 
                    <CheckIcon className="h-5 w-5" /> : 
                    <MapIcon className="h-5 w-5" />
                  }
                </div>
                
                <div className="grow">
                  <h3 className={`
                    text-base font-medium transition-colors duration-200
                    ${steps.selectCohort.completed ? 'text-success-700' : 'text-default-700'}
                  `}>
                    {steps.selectCohort.title}
                  </h3>
                  <p className="text-sm text-default-500">{steps.selectCohort.description}</p>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  isIconOnly
                  className="ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCohortExpanded(!cohortExpanded);
                  }}
                >
                  {cohortExpanded ? 
                    <ChevronUpIcon className="h-4 w-4" /> : 
                    <ChevronDownIcon className="h-4 w-4" />
                  }
                </Button>
              </div>
              
              {/* Step Content */}
              {cohortExpanded && (
                <div className="p-4 border-t border-default-100">
                  {!steps.selectCohort.completed ? (
                    <div>
                      <h3 className="text-lg font-medium mb-2">
                        Choose a program to join
                      </h3>
                      <p className="text-default-500 mb-6">
                        Select from the available programs below to apply and get started with xFoundry
                      </p>
                      
                      {/* Available Programs */}
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
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mb-4">
                        <CheckIcon className="h-8 w-8 text-success-600" />
                      </div>
                      <h3 className="text-xl font-medium text-success-700 mb-2">
                        You've applied to a program!
                      </h3>
                      <p className="text-default-500 max-w-md mb-4">
                        Your application has been submitted. You'll receive updates about your application status soon.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <div className="w-full flex justify-between items-center">
            <span className="text-sm text-default-500">
              {completionPercentage}% complete
            </span>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={closeOnboardingDialog}
              >
                Close
              </Button>
              
              {/* If all steps are completed, show Done button */}
              {allStepsCompleted && (
                <Button
                  color="success"
                  onClick={closeOnboardingDialog}
                >
                  Done
                </Button>
              )}
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}