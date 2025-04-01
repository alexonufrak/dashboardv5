import React from 'react';
import { useRouter } from 'next/router';
import { useProgram, useCohortsByProgram } from '@/lib/airtable/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorDisplay from '@/components/common/ErrorDisplay';

/**
 * ProgramOverview Component - Refactored to use the new Airtable hooks
 * Displays program details and its active cohorts
 */
export default function ProgramOverview() {
  const router = useRouter();
  const { programId } = router.query;

  // Using our custom React Query hooks from the new architecture
  const { 
    data: program, 
    isLoading: programLoading, 
    error: programError 
  } = useProgram(programId);

  const { 
    data: cohorts, 
    isLoading: cohortsLoading, 
    error: cohortsError 
  } = useCohortsByProgram(programId);

  // Handle loading state
  if (programLoading || cohortsLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle error state
  if (programError || cohortsError) {
    return (
      <ErrorDisplay 
        error={programError || cohortsError} 
        message="Could not load program details" 
      />
    );
  }

  // Handle missing data
  if (!program) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        Program not found
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Program Details */}
      <Card>
        <CardHeader>
          <CardTitle>{program.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            {program.description || 'No description available'}
          </p>
          
          {/* Additional program details would go here */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-muted-foreground">Institution</p>
              <p>{program.institution?.name || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p>{program.status || 'Unknown'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cohorts List */}
      <div>
        <h3 className="text-lg font-medium mb-4">Available Cohorts</h3>
        
        {cohorts && cohorts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cohorts.map((cohort) => (
              <Card key={cohort.id}>
                <CardHeader>
                  <CardTitle className="text-base">{cohort.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    {cohort.description || 'No description available'}
                  </p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {cohort.startDate && cohort.endDate ? 
                          `${new Date(cohort.startDate).toLocaleDateString()} - ${new Date(cohort.endDate).toLocaleDateString()}` : 
                          'Dates not specified'}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => router.push(`/programs/apply/${cohort.id}`)}
                    >
                      Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No cohorts currently available for this program</p>
        )}
      </div>
    </div>
  );
}