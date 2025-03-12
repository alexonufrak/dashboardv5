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
  // Force dialog to stay open if onboarding isn't completed
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
    // Don't process the same profile data twice (prevents loops)
    if (processedDataRef.current === profileData) {
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
    processedDataRef.current = profileData;
    
    // Set loading state only if not already loading
    if (!isLoading) {
      setIsLoading(true)
    }
    
    try {
      console.log("Checking onboarding status from profile:", profileData?.contactId || "unknown")
      
      // If we have a profile with onboarding data
      if (profileData) {
        // Get participation data from all possible locations - this is CRITICAL for proper evaluation
        // The participation data might be in different locations depending on the context/loading state
        
        // 1. Check directly on profile (participations, Participation arrays)
        const participationArrays = profileData.participations || profileData.Participation;
        
        // 2. Check participationData.participation (nested from API/context)
        const nestedParticipations = 
          profileData.participationData && 
          profileData.participationData.participation &&
          Array.isArray(profileData.participationData.participation) ? 
            profileData.participationData.participation : [];
        
        // Log detailed participation data for debugging
        console.log("Detailed participation check:", {
          directArrays: participationArrays ? 
            (Array.isArray(participationArrays) ? participationArrays.length : "not array") : "not found",
          nestedArray: nestedParticipations.length,
          nestedFound: profileData.participationData ? "yes" : "no",
          hasActiveFlag: profileData.hasActiveParticipation
        });
        
        // Combine all participation checks - if ANY of them indicate participation, the user has participated
        const hasParticipationRecords = (
          // Direct arrays on profile
          (participationArrays && Array.isArray(participationArrays) && participationArrays.length > 0) ||
          // Nested participation data
          (nestedParticipations.length > 0) ||
          // Flag explicitly set on profile
          profileData.hasActiveParticipation === true
        );
        
        // Check if the user has applications records
        const hasApplicationsRecords = profileData.applications && 
                                     Array.isArray(profileData.applications) && 
                                     profileData.applications.length > 0;
                                     
        // Log the participation status for debugging
        console.log("Participation status check:", {
          hasParticipationRecords,
          participationsDirect: participationArrays ? 
            (Array.isArray(participationArrays) ? participationArrays.length : 0) : 0,
          participationsNested: profileData.participationData && 
                               profileData.participationData.participation ? 
                               profileData.participationData.participation.length : 0,
          hasActiveParticipationFlag: profileData.hasActiveParticipation,
          hasApplicationsRecords,
          applicationCount: hasApplicationsRecords ? profileData.applications.length : 0
        });
        
        // Get onboarding status directly from the profile
        const onboardingStatus = profileData.Onboarding || "Registered" // Default to "Registered" if not set
        console.log("Onboarding status from profile:", onboardingStatus)
        
        // Enhanced debug logging to show what data we're working with
        console.log("Full profile data properties for onboarding:", {
          hasOnboardingField: profileData.hasOwnProperty('Onboarding'),
          onboardingValue: profileData.Onboarding,
          hasParticipationsArray: Boolean(participationArrays),
          participationsProperty: Boolean(profileData.hasOwnProperty('participations')),
          participationProperty: Boolean(profileData.hasOwnProperty('Participation')),
          hasParticipationData: Boolean(profileData.participationData),
          hasActiveParticipationFlag: Boolean(profileData.hasActiveParticipation),
          contactId: profileData.contactId
        });
        
        // User has completed onboarding if:
        // 1. Onboarding status is "Applied" OR
        // 2. They have participation records OR
        // 3. They have applications
        if (onboardingStatus === "Applied" || hasParticipationRecords || hasApplicationsRecords) {
          console.log("Onboarding considered completed because:", {
            statusIsApplied: onboardingStatus === "Applied",
            hasParticipationRecords,
            hasApplicationsRecords
          })
          
          // Set state for completed onboarding
          setOnboardingCompleted(true)
          setForceDialogOpen(false) // Don't force dialog for completed users
          setDialogOpen(false) // Close dialog if it was open
          
          // Mark both steps as completed
          setSteps(prevSteps => ({
            ...prevSteps,
            register: {
              ...prevSteps.register,
              completed: true
            },
            selectCohort: {
              ...prevSteps.selectCohort,
              completed: true
            }
          }))
          
          // If they have participation/applications but their status isn't "Applied",
          // update it in the background for consistency
          if (onboardingStatus !== "Applied" && (hasParticipationRecords || hasApplicationsRecords)) {
            console.log("Updating onboarding status to 'Applied' for user with participation/applications")
            // Update Airtable in the background (no await to prevent blocking)
            fetch('/api/user/onboarding-completed', { method: 'POST' })
              .then(response => {
                if (response.ok) {
                  console.log("Successfully updated Airtable onboarding status to 'Applied'")
                } else {
                  console.warn("Failed to update Airtable onboarding status")
                }
              })
              .catch(error => {
                console.error("Error updating Airtable onboarding status:", error)
              })
          }
          
          setIsLoading(false)
          return
        }
        
        // If we reach here, user needs to complete onboarding
        console.log("User needs to complete onboarding, forcing dialog open")
        setOnboardingCompleted(false)
        setForceDialogOpen(true) // Force dialog to open and stay open
        setDialogOpen(true) // Open the dialog immediately
        
        // Mark register step as completed (always true since they're registered)
        setSteps(prevSteps => ({
          ...prevSteps,
          register: {
            ...prevSteps.register,
            completed: true
          }
        }))
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error)
    } finally {
      setIsLoading(false)
      
      // Reset processing state so future calls can proceed
      processingRef.current = false;
      // Don't reset processedDataRef to continue preventing repeated processing
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