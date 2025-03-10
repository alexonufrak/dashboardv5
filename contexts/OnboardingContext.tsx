"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Define the step interface
interface OnboardingStep {
  id: string;
  completed: boolean;
  title: string;
  description: string;
}

// Define the context interface
interface OnboardingContextType {
  showOnboarding: boolean;
  onboardingCompleted: boolean;
  hasApplications: boolean;
  isLoading: boolean;
  steps: Record<string, OnboardingStep>;
  completionPercentage: number;
  allStepsCompleted: boolean;
  dialogOpen: boolean;
  checkOnboardingStatus: () => Promise<void>;
  markStepComplete: (stepId: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  openOnboardingDialog: () => void;
  closeOnboardingDialog: () => void;
}

// Create the context with null as initial value
const OnboardingContext = createContext<OnboardingContextType | null>(null);

interface OnboardingProviderProps {
  children: ReactNode;
}

// Export the provider component
export function OnboardingProvider({ children }: OnboardingProviderProps) {
  // Core state
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const [hasApplications, setHasApplications] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  
  // Track steps completion
  const [steps, setSteps] = useState<Record<string, OnboardingStep>>({
    register: { 
      id: 'register', 
      completed: true, 
      title: 'Create an account', 
      description: 'Sign up with your institutional email' 
    },
    selectCohort: { 
      id: 'selectCohort', 
      completed: false, 
      title: 'Get involved', 
      description: 'Select a program to join' 
    }
  });
  
  // Calculate completion percentage
  const [completionPercentage, setCompletionPercentage] = useState<number>(50);
  
  // Check if all steps are completed
  const allStepsCompleted = Object.values(steps).every(step => step.completed);
  
  // Update completion percentage when steps change
  useEffect(() => {
    const completedCount = Object.values(steps).filter(step => step.completed).length;
    const percentage = Math.round((completedCount / Object.keys(steps).length) * 100);
    setCompletionPercentage(percentage);
  }, [steps]);
  
  // Check onboarding status - this will be called once when the dashboard loads
  const checkOnboardingStatus = async () => {
    setIsLoading(true);
    
    try {
      // First, check for completed=true in metadata (most reliable source)
      const metadataResponse = await fetch('/api/user/metadata');
      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json();
        
        // If onboardingCompleted is explicitly set to true, hide the onboarding
        if (metadata.onboardingCompleted === true) {
          console.log("Onboarding explicitly marked as completed");
          setOnboardingCompleted(true);
          setShowOnboarding(false);
          setIsLoading(false);
          return;
        }
        
        // Check for completed steps in metadata
        if (metadata.onboarding && Array.isArray(metadata.onboarding)) {
          // Update steps based on what's in metadata
          setSteps(prevSteps => {
            const updatedSteps = { ...prevSteps };
            
            Object.keys(updatedSteps).forEach(stepId => {
              updatedSteps[stepId].completed = metadata.onboarding.includes(stepId);
            });
            
            return updatedSteps;
          });
        }
      }
      
      // Check if user has any applications
      const applicationsResponse = await fetch('/api/user/check-application');
      if (applicationsResponse.ok) {
        const data = await applicationsResponse.json();
        const userHasApplications = Array.isArray(data.applications) && data.applications.length > 0;
        
        // Update application status
        setHasApplications(userHasApplications);
        
        // If user has applications, mark the selectCohort step as completed
        if (userHasApplications) {
          setSteps(prevSteps => ({
            ...prevSteps,
            selectCohort: {
              ...prevSteps.selectCohort,
              completed: true
            }
          }));
        }
      }
      
      // By default, show the onboarding banner for new users
      setShowOnboarding(true);
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Mark a step as complete
  const markStepComplete = async (stepId: string) => {
    // Update local state
    setSteps(prevSteps => ({
      ...prevSteps,
      [stepId]: {
        ...prevSteps[stepId],
        completed: true
      }
    }));
    
    try {
      // Get all completed step IDs
      const updatedSteps = { ...steps };
      updatedSteps[stepId].completed = true;
      
      const completedStepIds = Object.values(updatedSteps)
        .filter(step => step.completed)
        .map(step => step.id);
      
      // Save to user metadata
      await fetch('/api/user/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          onboarding: completedStepIds
        })
      });
    } catch (error) {
      console.error("Error saving step completion:", error);
    }
  };
  
  // Complete onboarding
  const completeOnboarding = async () => {
    try {
      // Mark as completed in local state for this session
      setOnboardingCompleted(true);
      
      // Hide the onboarding UI
      setShowOnboarding(false);
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };
  
  // Open onboarding dialog
  const openOnboardingDialog = () => {
    setDialogOpen(true);
  };
  
  // Close onboarding dialog
  const closeOnboardingDialog = () => {
    setDialogOpen(false);
  };
  
  // The contextValue contains all functions and state we want to expose
  const contextValue: OnboardingContextType = {
    showOnboarding,
    onboardingCompleted,
    hasApplications,
    isLoading,
    steps,
    completionPercentage,
    allStepsCompleted,
    dialogOpen,
    checkOnboardingStatus,
    markStepComplete,
    completeOnboarding,
    openOnboardingDialog,
    closeOnboardingDialog
  };
  
  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
}

// Custom hook to use the onboarding context
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  
  return context;
}