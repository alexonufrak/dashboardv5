"use client"

import { useOnboarding } from '@/contexts/OnboardingContext'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle } from "lucide-react"

export default function OnboardingBanner() {
  const { 
    showOnboarding,
    onboardingCompleted,
    isLoading,
    allStepsCompleted,
    completionPercentage,
    openOnboardingDialog,
    completeOnboarding
  } = useOnboarding()
  
  // Don't show if: onboarding is completed, loading, or all steps are completed
  if (!showOnboarding || isLoading || allStepsCompleted) {
    return null
  }
  
  return (
    <Card className="mb-6 shadow-md border-primary/10 overflow-hidden transition-all">
      <CardHeader className="
        py-5 bg-gradient-to-r from-blue-50 to-cyan-50 
        dark:from-blue-950 dark:to-cyan-950
      ">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl md:text-2xl text-primary">
              Welcome to xFoundry!
            </CardTitle>
            <CardDescription className="mt-1">
              {allStepsCompleted ? "Complete your onboarding" : "Finish setting up your account"}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:block w-48">
              <Progress value={completionPercentage} className="h-2" />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  {completionPercentage}% complete
                </span>
              </div>
            </div>
            
            {allStepsCompleted ? (
              <Button 
                onClick={completeOnboarding}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Onboarding
              </Button>
            ) : (
              <Button onClick={openOnboardingDialog}>
                Continue Setup
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}