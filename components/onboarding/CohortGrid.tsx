import React from "react";
import { Button, Card, CardBody, CardFooter, Chip, Skeleton } from "@heroui/react";
import { Zap, Users, User } from "lucide-react";

interface Cohort {
  id: string;
  name: string;
  description?: string;
  status?: string;
  initiativeDetails?: {
    id: string;
    name: string;
    [key: string]: any;
  };
  participationType?: string;
  isOpen?: boolean;
  deadlineDate?: string;
  [key: string]: any;
}

interface Application {
  id: string;
  cohortId: string;
  status: string;
  submittedDate: string;
  [key: string]: any;
}

interface Profile {
  id?: string;
  firstName?: string;
  lastName?: string;
  institution?: {
    id?: string;
    name?: string;
  };
  [key: string]: any;
}

interface CohortGridProps {
  cohorts: Cohort[];
  profile?: Profile | null;
  isLoading?: boolean;
  isLoadingApplications?: boolean;
  applications?: Application[];
  columns?: { 
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  onApply?: (cohort: Cohort) => void;
  onApplySuccess?: () => void;
  emptyMessage?: string;
}

export default function CohortGrid({
  cohorts,
  profile,
  isLoading = false,
  isLoadingApplications = false,
  applications = [],
  columns = { default: 1, md: 2 },
  onApply,
  onApplySuccess,
  emptyMessage = "No programs available. Check back later."
}: CohortGridProps) {
  
  // If loading, display skeleton cards
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4`}>
        {[...Array(4)].map((_, index) => (
          <Card key={`skeleton-${index}`} className="h-full">
            <CardBody className="p-5">
              <Skeleton className="h-5 w-2/3 mb-2" />
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-4 w-1/2 mb-3" />
              <Skeleton className="h-12 w-full rounded-md" />
            </CardBody>
            <CardFooter className="px-5 py-3 flex-row justify-between border-t">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-20 rounded-md" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
  
  // Check if no cohorts are available
  if (cohorts.length === 0) {
    return (
      <div className="p-6 bg-default-50 border rounded-lg text-center">
        <p className="text-default-600">{emptyMessage}</p>
      </div>
    );
  }
  
  // Check if already applied to any cohorts
  const userHasApplications = applications && applications.length > 0;
  
  // Filter for only open cohorts
  const openCohorts = cohorts.filter(cohort => cohort.isOpen);
  
  // If no open cohorts
  if (openCohorts.length === 0) {
    return (
      <div className="p-6 bg-default-50 border rounded-lg text-center">
        <p className="text-default-600">There are no open programs currently available for applications.</p>
      </div>
    );
  }
  
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4`}>
      {openCohorts.map(cohort => {
        // Check if already applied to this cohort
        const hasApplied = applications?.some(app => app.cohortId === cohort.id);
        
        // Determine participation type
        const participationType = cohort.participationType || 
                                  cohort.initiativeDetails?.["Participation Type"] || 
                                  "Individual";
        
        // Calculate application deadline if exists
        const deadlineDate = cohort.deadlineDate ? new Date(cohort.deadlineDate) : null;
        const today = new Date();
        const daysToDeadline = deadlineDate ? 
          Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
        
        // Format deadline message
        let deadlineMessage = "";
        if (daysToDeadline !== null) {
          if (daysToDeadline < 0) {
            deadlineMessage = "Deadline passed";
          } else if (daysToDeadline === 0) {
            deadlineMessage = "Deadline today";
          } else if (daysToDeadline === 1) {
            deadlineMessage = "Deadline tomorrow";
          } else if (daysToDeadline <= 7) {
            deadlineMessage = `${daysToDeadline} days left`;
          } else if (deadlineDate) {
            deadlineMessage = deadlineDate.toLocaleDateString(undefined, { 
              month: 'short', 
              day: 'numeric' 
            });
          }
        }
        
        return (
          <Card key={cohort.id} className="h-full">
            <CardBody className="p-5">
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-1">
                  {cohort.initiativeDetails?.name || "Program"}
                </h3>
                <p className="text-default-600 text-sm">
                  {cohort.name || "Cohort"}
                </p>
                
                {/* Participation Type */}
                <div className="mt-2 flex items-center gap-1">
                  {participationType.toLowerCase().includes("team") ? (
                    <Chip
                      className="mt-1"
                      size="sm"
                      color="primary"
                      variant="flat"
                      startContent={<Users className="h-3 w-3" />}
                    >
                      Team Participation
                    </Chip>
                  ) : (
                    <Chip
                      className="mt-1"
                      size="sm"
                      color="secondary"
                      variant="flat"
                      startContent={<User className="h-3 w-3" />}
                    >
                      Individual Participation
                    </Chip>
                  )}
                  
                  {/* Show deadline chip if available */}
                  {deadlineMessage && (
                    <Chip
                      className="mt-1"
                      size="sm"
                      color={daysToDeadline !== null && daysToDeadline <= 3 ? "danger" : "default"}
                      variant="flat"
                    >
                      {deadlineMessage}
                    </Chip>
                  )}
                </div>
              </div>
              
              {/* Description */}
              {cohort.description && (
                <p className="text-sm text-default-600 mb-4">
                  {cohort.description}
                </p>
              )}
              
              {/* Apply button */}
              <div className="mt-auto">
                <Button
                  color={hasApplied ? "success" : "primary"}
                  className="w-full"
                  isDisabled={hasApplied || isLoadingApplications}
                  isLoading={isLoadingApplications}
                  startContent={hasApplied ? (
                    <Zap className="h-4 w-4" />
                  ) : undefined}
                  onClick={() => {
                    if (onApply && !hasApplied) {
                      onApply(cohort);
                    }
                  }}
                >
                  {hasApplied ? "Applied" : "Apply Now"}
                </Button>
              </div>
            </CardBody>
            
            <CardFooter className="px-5 py-3 flex-row justify-between border-t">
              <span className="text-xs text-default-500">
                {cohort.initiativeDetails?.semester || ""}
              </span>
              
              {hasApplied && (
                <Chip size="sm" color="success" variant="flat">
                  Application Submitted
                </Chip>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}