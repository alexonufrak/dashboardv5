"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@auth0/nextjs-auth0/client'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertCircle, ArrowRight } from "lucide-react"

const OnboardingChecklistCondensed = ({ profile, onViewAll, onComplete }) => {
  const { user } = useUser()
  const router = useRouter()
  const [steps, setSteps] = useState([
    { id: 'register', title: 'Create an account', completed: true },
    { id: 'selectCohort', title: 'Get involved', completed: false },
    { id: 'connexions', title: 'Join ConneXions', completed: false }
  ])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(33)

  useEffect(() => {
    const checkUserMetadata = async () => {
      try {
        setLoading(true)
        // Fetch user metadata to see if steps are already completed
        const response = await fetch('/api/user/metadata')
        if (response.ok) {
          const metadata = await response.json()
          
          // Update steps based on metadata
          if (metadata.onboarding) {
            const updatedSteps = steps.map(step => ({
              ...step,
              completed: metadata.onboarding.includes(step.id)
            }))
            
            setSteps(updatedSteps)
            
            // Calculate progress
            const completedCount = updatedSteps.filter(step => step.completed).length
            const percentage = Math.round((completedCount / updatedSteps.length) * 100)
            setProgress(percentage)
          }
        }
      } catch (error) {
        console.error('Error fetching user metadata:', error)
      } finally {
        setLoading(false)
      }
    }
    
    checkUserMetadata()
  }, [])

  // Complete onboarding
  const completeOnboarding = async () => {
    try {
      await fetch('/api/user/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          onboardingCompleted: true
        })
      })
      
      if (onComplete) onComplete()
    } catch (error) {
      console.error('Error completing onboarding:', error)
    }
  }

  // Skip onboarding (but keep notification visible)
  const skipOnboarding = async () => {
    try {
      await fetch('/api/user/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          onboardingSkipped: true,
          keepOnboardingVisible: true
        })
      })
      
      if (onComplete) onComplete()
    } catch (error) {
      console.error('Error skipping onboarding:', error)
    }
  }

  const allCompleted = steps.every(step => step.completed)
  const nextIncompleteStep = steps.find(step => !step.completed)

  if (loading) {
    return null
  }

  if (allCompleted) {
    return (
      <Alert className="mb-6 bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Onboarding Complete</AlertTitle>
        <AlertDescription className="text-green-700 flex justify-between items-center">
          <span>You've completed all onboarding steps!</span>
          <Button 
            variant="outline" 
            size="sm"
            className="text-green-700 border-green-300"
            onClick={completeOnboarding}
          >
            Confirm
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Continue Setting Up Your Account</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span>Progress: {progress}% complete</span>
            <Button 
              variant="link" 
              size="sm" 
              className="h-auto p-0"
              onClick={onViewAll}
            >
              View All Steps
            </Button>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          <div className="flex justify-between items-center mt-2">
            {nextIncompleteStep && (
              <div className="flex-1">
                <span className="text-sm font-medium">Next: {nextIncompleteStep.title}</span>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={skipOnboarding}
              >
                Skip for Now
              </Button>
              <Button 
                size="sm"
                className="gap-1"
                onClick={onViewAll}
              >
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}

export default OnboardingChecklistCondensed