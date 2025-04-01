"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

// Create the context
const OnboardingContext = createContext(null)

// Export the provider component
export function OnboardingProvider({ children }) {
  // Core state
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)
  const [hasApplications, setHasApplications] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  // Dialog functionality is now disabled - always set to false
  const [forceDialogOpen, setForceDialogOpen] = useState(false)
  
  // Track steps completion
  const [steps, setSteps] = useState({
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
  })
  
  // Calculate completion percentage
  const [completionPercentage, setCompletionPercentage] = useState(50)
  
  // Check if all steps are completed
  const allStepsCompleted = Object.values(steps).every(step => step.completed)
  
  // Update completion percentage when steps change
  useEffect(() => {
    const completedCount = Object.values(steps).filter(step => step.completed).length
    const percentage = Math.round((completedCount / Object.keys(steps).length) * 100)
    setCompletionPercentage(percentage)
  }, [steps])
  
  // Create a ref to track if we're already processing an onboarding check
  const processingRef = React.useRef(false);
  // Track repeated calls with the same profileData
  const processedDataRef = React.useRef(null);
  
  // Check onboarding status using the profile data from Airtable
  // This avoids a separate API call since the profile already has the onboarding status
  const checkOnboardingStatus = async (profileData) => {
    // Prevent duplicate/simultaneous processing with refs
    const profileDataId = profileData?.contactId || profileData?.email || JSON.stringify(profileData);
    
    // Don't process the same profile data twice (prevents loops)
    if (processedDataRef.current === profileDataId) {
      console.log("Already checked this exact profile data, skipping");
      return;
    }
    
    // If we're already processing an onboarding check, don't start another one
    if (processingRef.current) {
      console.log("Already checking onboarding status, skipping duplicate call");
      return;
    }
    
    // Mark that we're processing a check
    processingRef.current = true;
    // Store reference to this profileData to avoid processing it again
    processedDataRef.current = profileDataId;
    
    // Set loading state only if not already loading
    if (!isLoading) {
      setIsLoading(true);
    }
    
    try {
      console.log("Checking onboarding status from profile:", profileData?.contactId || "unknown");
      
      // If we have a profile with onboarding data, use the isOnboardingComplete flag from the new API
      if (profileData) {
        // Use the explicit isOnboardingComplete flag from the refactored API if available
        const isOnboardingComplete = profileData.isOnboardingComplete === true;
        const hasParticipationRecords = profileData.hasActiveParticipation === true;
        const hasApplicationsRecords = profileData.applications && 
                                     Array.isArray(profileData.applications) && 
                                     profileData.applications.length > 0;
        
        // Get onboarding status from the profile - using consistent property name
        const onboardingStatus = profileData.onboardingStatus || profileData.Onboarding || "Registered";
        
        // Log determination for debugging
        console.log("Onboarding determination:", {
          isOnboardingComplete,
          onboardingStatus,
          hasParticipationRecords,
          hasApplicationsRecords
        });
        
        // User has completed onboarding if any of these are true
        if (isOnboardingComplete || onboardingStatus === "Applied" || 
            hasParticipationRecords || hasApplicationsRecords) {
          
          // Set state for completed onboarding
          setOnboardingCompleted(true);
          setForceDialogOpen(false); // Don't force dialog for completed users
          setDialogOpen(false); // Close dialog if it was open
          
          // Mark both steps as completed
          setSteps(prevSteps => ({
            ...prevSteps,
            register: { ...prevSteps.register, completed: true },
            selectCohort: { ...prevSteps.selectCohort, completed: true }
          }));
          
          // If they have participation/applications but their status isn't "Applied",
          // update it in the background for consistency
          if (onboardingStatus !== "Applied" && (hasParticipationRecords || hasApplicationsRecords)) {
            console.log("Updating onboarding status to 'Applied' for user with participation/applications");
            
            // Update Airtable in the background using v2 API (no await to prevent blocking)
            // Make the API call timeout after 3 seconds to prevent long-running requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            fetch('/api/user/onboarding-completed', { 
              method: 'POST',
              signal: controller.signal
            })
              .then(response => {
                clearTimeout(timeoutId);
                if (response.ok) {
                  console.log("Successfully updated Airtable onboarding status to 'Applied'");
                } else {
                  console.warn("Failed to update Airtable onboarding status");
                }
              })
              .catch(error => {
                if (error.name === 'AbortError') {
                  console.warn("Onboarding status update timed out");
                } else {
                  console.error("Error updating Airtable onboarding status:", error);
                }
              });
          }
          
          setIsLoading(false);
          return;
        }
        
        // If we reach here, user needs to complete onboarding, but we no longer force open the dialog
        console.log("User needs to complete onboarding, but dialog is disabled");
        setOnboardingCompleted(false);
        // Dialog functionality disabled - no longer force it open
        setForceDialogOpen(false);
        setDialogOpen(false);
        
        // Mark register step as completed (always true since they're registered)
        setSteps(prevSteps => ({
          ...prevSteps,
          register: {
            ...prevSteps.register,
            completed: true
          }
        }));
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      setIsLoading(false);
      
      // Reset processing state after waiting briefly to prevent immediate repeat calls
      setTimeout(() => {
        processingRef.current = false;
      }, 300);
      // processedDataRef remains set to prevent repeated processing of same data
    }
  }
  
  // Mark a step as complete
  const markStepComplete = async (stepId) => {
    // Update local state
    setSteps(prevSteps => ({
      ...prevSteps,
      [stepId]: {
        ...prevSteps[stepId],
        completed: true
      }
    }))
    
    try {
      // Get all completed step IDs
      const updatedSteps = { ...steps }
      updatedSteps[stepId].completed = true
      
      const completedStepIds = Object.values(updatedSteps)
        .filter(step => step.completed)
        .map(step => step.id)
      
      // Save to user metadata
      await fetch('/api/user/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          onboarding: completedStepIds
        })
      })
    } catch (error) {
      console.error("Error saving step completion:", error)
    }
  }
  
  // Complete onboarding - this now updates both Airtable and Auth0
  const completeOnboarding = async () => {
    try {
      // First update the onboarding status in Airtable
      const response = await fetch('/api/user/onboarding-completed', {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log("Onboarding completion result:", result)
        
        if (result.success) {
          // Update local state
          setOnboardingCompleted(true)
          setForceDialogOpen(false) // No longer force the dialog open
          setDialogOpen(false) // Close the dialog
          return true
        } else {
          console.error("Failed to update onboarding status:", result.error)
          return false
        }
      } else {
        console.error("Error response from onboarding completion API:", response.status)
        return false
      }
    } catch (error) {
      console.error("Error completing onboarding:", error)
      return false
    }
  }
  
  // Open onboarding dialog
  const openOnboardingDialog = () => {
    setDialogOpen(true)
  }
  
  // Close onboarding dialog - but only if we're not forcing it open
  const closeOnboardingDialog = () => {
    // Only allow closing if not forcing the dialog open
    if (!forceDialogOpen) {
      setDialogOpen(false)
    } else {
      console.log("Dialog close prevented - onboarding not completed yet")
    }
  }
  
  // The contextValue contains all functions and state we want to expose
  const contextValue = {
    onboardingCompleted,
    hasApplications,
    isLoading,
    steps,
    completionPercentage,
    allStepsCompleted,
    dialogOpen,
    forceDialogOpen,
    checkOnboardingStatus,
    markStepComplete,
    completeOnboarding,
    openOnboardingDialog,
    closeOnboardingDialog
  }
  
  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  )
}

// Custom hook to use the onboarding context
export function useOnboarding() {
  const context = useContext(OnboardingContext)
  
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  
  return context
}