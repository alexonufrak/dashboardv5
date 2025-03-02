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
  
  // Check onboarding status - this will be called once when the dashboard loads
  const checkOnboardingStatus = async () => {
    setIsLoading(true)
    
    try {
      // First, check for completed=true in metadata (most reliable source)
      const metadataResponse = await fetch('/api/user/metadata')
      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json()
        
        // If onboardingCompleted is explicitly set to true, hide the onboarding
        if (metadata.onboardingCompleted === true) {
          console.log("Onboarding explicitly marked as completed")
          setOnboardingCompleted(true)
          setShowOnboarding(false)
          setIsLoading(false)
          return
        }
        
        // Check for completed steps in metadata
        if (metadata.onboarding && Array.isArray(metadata.onboarding)) {
          // Update steps based on what's in metadata
          setSteps(prevSteps => {
            const updatedSteps = { ...prevSteps }
            
            Object.keys(updatedSteps).forEach(stepId => {
              updatedSteps[stepId].completed = metadata.onboarding.includes(stepId)
            })
            
            return updatedSteps
          })
        }
      }
      
      // Check if user has any applications
      const applicationsResponse = await fetch('/api/user/check-application')
      if (applicationsResponse.ok) {
        const data = await applicationsResponse.json()
        const userHasApplications = Array.isArray(data.applications) && data.applications.length > 0
        
        // Update application status
        setHasApplications(userHasApplications)
        
        // If user has applications, mark the selectCohort step as completed
        if (userHasApplications) {
          setSteps(prevSteps => ({
            ...prevSteps,
            selectCohort: {
              ...prevSteps.selectCohort,
              completed: true
            }
          }))
        }
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
  
  // We no longer need to mark onboarding as explicitly completed
  // Instead, we'll just track the completion of individual steps
  // This simplifies our approach and matches the requirement to 
  // just let users close the dialog after they've completed all steps
  const completeOnboarding = async () => {
    try {
      // Mark as completed in local state for this session
      setOnboardingCompleted(true)
      
      // Hide the onboarding UI
      setShowOnboarding(false)
    } catch (error) {
      console.error("Error completing onboarding:", error)
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