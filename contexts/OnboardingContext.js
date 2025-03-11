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
      // First, check onboarding status using the dedicated API endpoint
      // which now uses Airtable's Contact Onboarding field as primary source
      const onboardingResponse = await fetch('/api/user/onboarding-completed')
      
      if (onboardingResponse.ok) {
        const data = await onboardingResponse.json()
        console.log("Onboarding status check response:", data)
        
        // If completed is true (status is "Applied"), hide onboarding
        if (data.completed === true) {
          console.log("Onboarding marked as completed (status: Applied)")
          setOnboardingCompleted(true)
          setShowOnboarding(false)
          setIsLoading(false)
          return
        }
        
        // If the status is "Registered", mark the register step as completed
        if (data.status === "Registered") {
          setSteps(prevSteps => ({
            ...prevSteps,
            register: {
              ...prevSteps.register,
              completed: true
            }
          }))
        }
      }
      
      // Check if user has any applications (this is still useful to determine selectCohort completion)
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
          
          // Also update Airtable Onboarding status to "Applied" if they have applications
          try {
            await fetch('/api/user/onboarding-completed', { method: 'POST' })
            console.log("Updated onboarding status to Applied based on existing applications")
          } catch (error) {
            console.error("Error updating onboarding status:", error)
          }
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