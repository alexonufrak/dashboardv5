'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProgramApplicationDialog } from './ProgramApplicationDialog';

/**
 * Apply Button Wrapper - Client Component
 * Handles the Apply button UI logic based on cohort options
 */
export function ApplyButtonWrapper({ programId, cohorts, buttonText = "Apply Now", className = "" }) {
  const [selectedCohort, setSelectedCohort] = useState(null);
  
  // Filter to only active cohorts
  const activeCohorts = cohorts.filter(cohort => 
    cohort.status === 'Active' || cohort.isActive
  );
  
  // No active cohorts? Show disabled button
  if (activeCohorts.length === 0) {
    return (
      <Button disabled variant="outline" className={className}>
        Applications Closed
      </Button>
    );
  }
  
  // Only one active cohort? Show direct apply button
  if (activeCohorts.length === 1) {
    return (
      <ProgramApplicationDialog
        programId={programId}
        cohortId={activeCohorts[0].id}
        cohortName={activeCohorts[0].name}
        buttonLabel={buttonText}
      />
    );
  }
  
  // Multiple cohorts? Show dropdown
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className={className}>{buttonText}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {activeCohorts.map(cohort => (
            <DropdownMenuItem 
              key={cohort.id}
              onClick={() => setSelectedCohort(cohort)}
            >
              Apply to {cohort.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {selectedCohort && (
        <ProgramApplicationDialog
          programId={programId}
          cohortId={selectedCohort.id}
          cohortName={selectedCohort.name}
          buttonLabel={buttonText}
          isOpen={true}
          onOpenChange={(open) => {
            if (!open) setSelectedCohort(null);
          }}
        />
      )}
    </>
  );
}