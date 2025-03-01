"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@auth0/nextjs-auth0/client'
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  UserPlus,
  Compass,
  Users,
  ExternalLink
} from "lucide-react"

const OnboardingChecklistCondensed = ({ profile, onViewAll, onComplete }) => {
  const { user } = useUser()
  const router = useRouter()
  const [steps, setSteps] = useState([
    { 
      id: 'register', 
      title: 'Create an account', 
      completed: true,
      icon: <UserPlus className="h-4 w-4" />
    },
    { 
      id: 'selectCohort', 
      title: 'Get involved', 
      completed: false,
      icon: <Compass className="h-4 w-4" />
    },
    { 
      id: 'connexions', 
      title: 'Join ConneXions', 
      completed: false,
      icon: <Users className="h-4 w-4" />
    }
  ])
  const [loading, setLoading] = useState(true)
  const [completionPercentage, setCompletionPercentage] = useState(33)
  const [isExpanded, setIsExpanded] = useState(false)
  
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
            setCompletionPercentage(percentage)
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
  
  // Check if user has applied to a program
  const hasAppliedToProgram = steps.find(step => step.id === 'selectCohort')?.completed || false
  
  // Complete onboarding
  const completeOnboarding = async () => {
    try {
      // Only mark as truly completed if the user has applied to a program
      const metadata = hasAppliedToProgram 
        ? {
            onboardingCompleted: true,
            onboardingSkipped: false,
            keepOnboardingVisible: false
          }
        : {
            onboardingSkipped: true,
            keepOnboardingVisible: true
          };
      
      // Call API to persist the preference
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
      
      // Even on error, still update UI
      if (onComplete) {
        onComplete(false, hasAppliedToProgram);
      }
    }
  }
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(prev => !prev);
  }
  
  // Skip onboarding but keep showing banner
  const skipOnboarding = async () => {
    try {
      // Mark as skipped but with keepVisible flag
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
      
      // Call parent callback
      if (onComplete) {
        onComplete(true, false);
      }
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      
      // Even on error, still update UI
      if (onComplete) {
        onComplete(true, false);
      }
    }
  }
  
  // Get the next incomplete step
  const nextIncompleteStep = steps.find(step => !step.completed)
  
  // Skip rendering if still loading
  if (loading) {
    return null
  }
  
  // If all steps are completed, show success message
  const allCompleted = steps.every(step => step.completed)
  
  // If all steps are completed and user has applied, show success card
  if (allCompleted && hasAppliedToProgram) {
    return (
      <Card className="mb-6 overflow-hidden border border-green-200 shadow-sm">
        <CardContent className="p-4 bg-green-50">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-full mr-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-medium text-green-800">Onboarding Complete</h3>
              <p className="text-sm text-green-700">You've completed all onboarding steps!</p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              className="ml-2 text-green-700 border-green-300"
              onClick={completeOnboarding}
            >
              Dismiss
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Regular mini-card
  return (
    <Card className="mb-6 overflow-hidden border border-primary/20 shadow-sm">
      <CardContent className={`p-4 ${hasAppliedToProgram ? 'bg-gradient-to-r from-green-50 to-green-100/50' : 'bg-gradient-to-r from-blue-50 to-blue-100/50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`p-2 rounded-full mr-3 ${hasAppliedToProgram ? 'bg-green-100' : 'bg-primary/10'}`}>
              {hasAppliedToProgram ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-primary" />
              )}
            </div>
            
            <div>
              <h3 className="font-medium text-gray-800">
                {hasAppliedToProgram ? "Complete Your Onboarding" : "Continue Setting Up Your Account"}
              </h3>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <span className="font-medium">{completionPercentage}% complete</span>
                <span className="mx-2">•</span>
                <span>{steps.filter(s => s.completed).length}/{steps.length} steps</span>
              </div>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleExpanded}
            className="h-8 w-8 p-0 rounded-full"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <Progress 
            value={completionPercentage} 
            className="h-1.5 bg-white/80" 
          />
        </div>
        
        {/* Expanded details */}
        {isExpanded && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            {/* Steps list */}
            <div className="space-y-2 mb-4">
              {steps.map(step => (
                <div 
                  key={step.id}
                  className={`
                    flex items-center p-2 rounded-md
                    ${step.completed 
                      ? 'bg-white/30 text-green-700' 
                      : 'bg-white/30 text-gray-700'}
                  `}
                >
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center mr-2
                    ${step.completed ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}
                  `}>
                    {step.completed ? <CheckCircle className="h-3.5 w-3.5" /> : step.icon}
                  </div>
                  <span className="text-sm font-medium">
                    {step.title}
                  </span>
                  {step.completed && (
                    <Badge className="ml-auto bg-green-100 text-green-700 border-green-200">
                      Done
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            
            {/* Action button */}
            <div className="flex justify-end mt-1">
              <Button 
                size="sm"
                className={`gap-1 ${hasAppliedToProgram ? 'bg-green-600 hover:bg-green-700' : ''}`}
                onClick={() => {
                  if (onViewAll) onViewAll();
                }}
              >
                {hasAppliedToProgram ? "Complete Remaining Steps" : "Continue Setup"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      
      {!isExpanded && (
        <CardFooter className="p-0 justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs m-2 h-7 px-2 hover:bg-primary/10 hover:text-primary"
            onClick={() => {
              if (onViewAll) onViewAll();
            }}
          >
            {nextIncompleteStep 
              ? hasAppliedToProgram 
                ? "Complete Remaining" 
                : `Next: ${nextIncompleteStep.title}`
              : "View All Steps"
            }
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

export default OnboardingChecklistCondensed