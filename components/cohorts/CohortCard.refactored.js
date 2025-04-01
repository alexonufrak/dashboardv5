import React from 'react';
import { useRouter } from 'next/router';
import { useCohort, useTeamsByCohort } from '@/lib/airtable/hooks';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Users, Building, ChevronRight } from 'lucide-react';
import { format, isAfter, isBefore, isToday } from 'date-fns';

/**
 * CohortCard Component - Refactored to use the new Airtable hooks
 * Displays a card with summary information about a cohort
 * 
 * @param {Object} props - Component props
 * @param {string} props.cohortId - The ID of the cohort to display
 * @param {boolean} props.showFooter - Whether to show the footer with action buttons
 * @param {function} props.onViewDetails - Callback when the view details button is clicked
 */
export default function CohortCard({ cohortId, showFooter = true, onViewDetails }) {
  const router = useRouter();
  
  // Use the cohort hook to fetch cohort data
  const { 
    data: cohort, 
    isLoading: cohortLoading, 
    error: cohortError 
  } = useCohort(cohortId);
  
  // Use the teams hook to fetch teams in this cohort
  const { 
    data: teams, 
    isLoading: teamsLoading 
  } = useTeamsByCohort(cohortId, {
    enabled: !!cohortId
  });
  
  const isLoading = cohortLoading || teamsLoading;
  
  // Handle loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex justify-between mt-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
          </div>
        </CardContent>
        {showFooter && (
          <CardFooter className="border-t px-6 py-4">
            <Skeleton className="h-9 w-full" />
          </CardFooter>
        )}
      </Card>
    );
  }
  
  // Handle error state
  if (cohortError) {
    return (
      <Card className="w-full border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Error Loading Cohort</CardTitle>
          <CardDescription className="text-red-600">
            {cohortError.message || 'Failed to load cohort details'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Handle case where cohort is not found
  if (!cohort) {
    return (
      <Card className="w-full border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-700">Cohort Not Found</CardTitle>
          <CardDescription className="text-orange-600">
            The cohort you&apos;re looking for doesn&apos;t exist or you may not have access.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Format cohort dates
  const formattedStartDate = cohort.startDate 
    ? format(new Date(cohort.startDate), 'MMM d, yyyy')
    : 'TBD';
    
  const formattedEndDate = cohort.endDate 
    ? format(new Date(cohort.endDate), 'MMM d, yyyy')
    : 'TBD';
  
  // Determine cohort status based on dates
  let derivedStatus = cohort.status || 'Unknown';
  
  if (!cohort.status && cohort.startDate && cohort.endDate) {
    const now = new Date();
    const startDate = new Date(cohort.startDate);
    const endDate = new Date(cohort.endDate);
    
    if (isBefore(now, startDate)) {
      derivedStatus = 'Upcoming';
    } else if (isAfter(now, endDate)) {
      derivedStatus = 'Completed';
    } else if (isToday(startDate) || (isAfter(now, startDate) && isBefore(now, endDate))) {
      derivedStatus = 'Active';
    }
  }
  
  // Number of teams in the cohort
  const teamCount = teams?.length || 0;
  
  // Handle view details click
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(cohort);
    } else {
      // Default behavior: navigate to cohort details page
      router.push(`/dashboard/cohorts/${cohort.id}`);
    }
  };
  
  // Handle apply click
  const handleApply = () => {
    router.push(`/dashboard/programs/apply/${cohort.id}`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{cohort.name}</CardTitle>
            {cohort.programName && (
              <CardDescription>
                {cohort.programName}
              </CardDescription>
            )}
          </div>
          <Badge className={
            derivedStatus === 'Active' ? 'bg-green-100 text-green-800' : 
            derivedStatus === 'Upcoming' ? 'bg-blue-100 text-blue-800' : 
            derivedStatus === 'Completed' ? 'bg-gray-100 text-gray-800' : 
            derivedStatus === 'Open' ? 'bg-purple-100 text-purple-800' : 
            'bg-gray-100 text-gray-800'
          }>
            {derivedStatus}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {cohort.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {cohort.description}
          </p>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              {formattedStartDate} - {formattedEndDate}
            </span>
          </div>
          
          <div className="flex items-center text-sm">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{teamCount} teams</span>
          </div>
          
          {cohort.institutionName && (
            <div className="flex items-center text-sm col-span-2">
              <Building className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{cohort.institutionName}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      {showFooter && (
        <CardFooter className="border-t px-6 py-4">
          <div className="flex w-full justify-between gap-2">
            {(derivedStatus === 'Open' || derivedStatus === 'Upcoming') && (
              <Button 
                variant="default" 
                size="sm" 
                className="gap-1"
                onClick={handleApply}
              >
                Apply Now
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1 ml-auto"
              onClick={handleViewDetails}
            >
              View Details
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}