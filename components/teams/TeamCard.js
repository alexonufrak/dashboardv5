import React from 'react';
import { useRouter } from 'next/router';
import { useTeam, useTeamMembers } from '@/lib/airtable/hooks';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, ExternalLink, ChevronRight } from 'lucide-react';

/**
 * TeamCard Component - Refactored to use the new Airtable hooks
 * Displays a card with summary information about a team
 * 
 * @param {Object} props - Component props
 * @param {string} props.teamId - The ID of the team to display
 * @param {boolean} props.showFooter - Whether to show the footer with action buttons
 * @param {function} props.onViewDetails - Callback when the view details button is clicked
 */
export default function TeamCard({ teamId, showFooter = true, onViewDetails }) {
  const router = useRouter();
  
  // Use the team hook to fetch team data
  const { 
    data: team, 
    isLoading: teamLoading, 
    error: teamError 
  } = useTeam(teamId);
  
  // Use the team members hook to fetch member data
  const { 
    data: members, 
    isLoading: membersLoading 
  } = useTeamMembers(teamId);
  
  const isLoading = teamLoading || membersLoading;
  
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
          <div className="flex mt-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full -ml-2" />
            <Skeleton className="h-8 w-8 rounded-full -ml-2" />
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
  if (teamError) {
    return (
      <Card className="w-full border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Error Loading Team</CardTitle>
          <CardDescription className="text-red-600">
            {teamError.message || 'Failed to load team details'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Handle case where team is not found
  if (!team) {
    return (
      <Card className="w-full border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-700">Team Not Found</CardTitle>
          <CardDescription className="text-orange-600">
            The team you&apos;re looking for doesn&apos;t exist or you may not have access.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Get the team member count
  const memberCount = members?.length || team.memberCount || 0;
  
  // Display a subset of members for the avatar group
  const displayMembers = members?.slice(0, 3) || [];
  
  // Handle view details click
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(team);
    } else {
      // Default behavior: navigate to team details page
      router.push(`/dashboard/teams/${team.id}`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{team.name}</CardTitle>
            {team.programName && (
              <CardDescription>
                {team.programName}
                {team.cohortName && ` • ${team.cohortName}`}
              </CardDescription>
            )}
          </div>
          {team.status && (
            <Badge className={
              team.status === 'Active' ? 'bg-green-100 text-green-800' : 
              team.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800'
            }>
              {team.status}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {team.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {team.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {displayMembers.length > 0 ? (
              <div className="flex -space-x-2">
                {displayMembers.map((member, i) => (
                  <Avatar key={member.id || i} className="border-2 border-background">
                    <AvatarImage 
                      src={member.avatarUrl} 
                      alt={member.name} 
                    />
                    <AvatarFallback>
                      {member.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {memberCount > displayMembers.length && (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-medium -ml-2 border-2 border-background">
                    +{memberCount - displayMembers.length}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center text-muted-foreground">
                <Users className="h-4 w-4 mr-1" />
                <span className="text-sm">{memberCount} members</span>
              </div>
            )}
          </div>
          
          {team.createdTime && (
            <span className="text-xs text-muted-foreground">
              {new Date(team.createdTime).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
      
      {showFooter && (
        <CardFooter className="border-t px-6 py-4">
          <div className="flex w-full justify-between">
            {team.externalUrl ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                onClick={() => window.open(team.externalUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                External Link
              </Button>
            ) : (
              <div></div>
            )}
            
            <Button 
              variant="default" 
              size="sm" 
              className="gap-1"
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