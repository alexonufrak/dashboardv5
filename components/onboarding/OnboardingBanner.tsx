import React from "react";

import { Progress } from "@heroui/react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Button } from "@heroui/react";

export default function OnboardingBanner() {
  const { 
    showOnboarding,
    steps,
    completionPercentage,
    allStepsCompleted, 
    openOnboardingDialog,
    completeOnboarding
  } = useOnboarding();

  // Don't render if onboarding is hidden
  if (!showOnboarding) {
    return null;
  }
  
  return (
    <div className="w-full bg-primary/5 border-b border-primary/10 py-3 px-4">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Complete your onboarding</span>
            <span className="text-sm text-foreground/70">
              {Math.round(completionPercentage)}% complete
            </span>
          </div>
          <Progress value={completionPercentage} size="sm" />
        </div>
        
        <div className="flex space-x-2 ml-auto shrink-0">
          {allStepsCompleted ? (
            <Button 
              color="success" 
              variant="flat" 
              onClick={completeOnboarding}
            >
              Complete Onboarding
            </Button>
          ) : (
            <Button 
              color="primary" 
              onClick={openOnboardingDialog}
            >
              Continue Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}