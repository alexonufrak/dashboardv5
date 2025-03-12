"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

// Create the context
const OnboardingContext = createContext(null)

// Export the provider component
export function OnboardingProvider({ children }) {
  // Core state
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)
  const [hasApplications, setHasApplications] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  
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
  
  // Check onboarding status using the profile data from Airtable
  // This avoids a separate API call since the profile already has the onboarding status
  const checkOnboardingStatus = async (profileData) => {
    setIsLoading(true)
    
    try {
      console.log("Checking onboarding status from profile:", profileData)
      
      // If we have a profile with onboarding data
      if (profileData) {
        // Get onboarding status directly from the profile
        const onboardingStatus = profileData.Onboarding || "Registered" // Default to "Registered" if not set
        console.log("Onboarding status from profile:", onboardingStatus)
        
        // If status is "Applied", hide onboarding
        if (onboardingStatus === "Applied") {
          console.log("Onboarding marked as completed (status: Applied)")
          setOnboardingCompleted(true)
          setShowOnboarding(false)
          setIsLoading(false)
          return
        }
        
        // Mark register step as completed (always true since they're registered)
        setSteps(prevSteps => ({
          ...prevSteps,
          register: {
            ...prevSteps.register,
            completed: true
          }
        }))
        
        // Check if user has any participation records (this is already checked in airtable.js)
        // If they have participation, the onboardingStatus would already be "Applied"
        // So we don't need to do anything additional here
        
        // For the selectCohort step, we'll only mark it as completed if they have participation
        // (Which means their onboardingStatus would be "Applied", which we already checked above)
      }
      
      // By default, show the onboarding banner for new users
      setShowOnboarding(true)
    } catch (error) {
      console.error("Error checking onboarding status:", error)
    } finally {
      setIsLoading(false)
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
          setShowOnboarding(false)
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
  
  // Close onboarding dialog
  const closeOnboardingDialog = () => {
    setDialogOpen(false)
  }
  
  // The contextValue contains all functions and state we want to expose
  const contextValue = {
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