import React from "react";
import { Card, CardBody, Progress, Button } from "@heroui/react";
import { CheckIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useOnboarding } from "@/contexts/OnboardingContext";

export default function OnboardingChecklist() {
  const { 
    steps, 
    completionPercentage, 
    openOnboardingDialog, 
    markStepComplete 
  } = useOnboarding();

  return (
    <Card className="mb-6">
      <CardBody className="p-5">
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-1">Getting Started Checklist</h3>
          <p className="text-sm text-default-500">
            Complete these steps to get the most out of xFoundry.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-5">
          <div className="flex justify-between mb-1">
            <p className="text-sm">Your progress</p>
            <p className="text-sm text-default-500 font-medium">
              {completionPercentage}% complete
            </p>
          </div>
          <Progress value={completionPercentage} color="primary" />
        </div>

        {/* Steps List */}
        <div className="space-y-4">
          {/* Register Step */}
          <div className="flex items-start gap-3">
            <div className={`
              shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5
              ${steps.register.completed ? 'bg-success-100 text-success-600' : 'bg-default-100 text-default-600'}
            `}>
              {steps.register.completed ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <span className="text-xs font-medium">1</span>
              )}
            </div>
            <div className="flex-1">
              <h4 className={`text-base font-medium ${steps.register.completed ? 'text-success-600' : 'text-default-700'}`}>
                {steps.register.title}
              </h4>
              <p className="text-sm text-default-500 mb-2">
                {steps.register.description}
              </p>
              {steps.register.completed && (
                <div className="inline-flex items-center text-xs text-success-600 font-medium">
                  <CheckIcon className="h-3.5 w-3.5 mr-1" />
                  Completed
                </div>
              )}
            </div>
          </div>

          {/* Apply to Program Step */}
          <div className="flex items-start gap-3">
            <div className={`
              shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5
              ${steps.selectCohort.completed ? 'bg-success-100 text-success-600' : 'bg-default-100 text-default-600'}
            `}>
              {steps.selectCohort.completed ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <span className="text-xs font-medium">2</span>
              )}
            </div>
            <div className="flex-1">
              <h4 className={`text-base font-medium ${steps.selectCohort.completed ? 'text-success-600' : 'text-default-700'}`}>
                {steps.selectCohort.title}
              </h4>
              <p className="text-sm text-default-500 mb-2">
                {steps.selectCohort.description}
              </p>
              {steps.selectCohort.completed ? (
                <div className="inline-flex items-center text-xs text-success-600 font-medium">
                  <CheckIcon className="h-3.5 w-3.5 mr-1" />
                  Completed
                </div>
              ) : (
                <Button 
                  color="primary" 
                  variant="flat" 
                  size="sm"
                  endContent={<ArrowRightIcon className="h-3.5 w-3.5" />}
                  onClick={openOnboardingDialog}
                >
                  Select a program
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 flex justify-end">
          <Button 
            color="primary"
            onClick={openOnboardingDialog}
          >
            Continue Setup
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}