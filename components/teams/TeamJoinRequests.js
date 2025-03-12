"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Hourglass, CheckCircle, XCircle, ExternalLink, Clock } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from '@tanstack/react-query'

/**
 * Component to display pending team join requests for the current user
 * Shows all applications with applicationType 'joinTeam'
 * 
 * @param {Object} props Component props
 * @param {Array} props.applications Array of application objects from API
 * @param {boolean} props.isLoading Whether applications are still loading
 * @param {Object} props.teams Object mapping team IDs to team data
 */
export default function TeamJoinRequests({ applications = [], isLoading = false, teams = {} }) {
  // Get all join team applications
  const teamJoinApplications = applications.filter(app => {
    // Look for applications with join team message or team to join field
    // Also check applicationType if available
    return (
      (app.applicationType === 'joinTeam' || app.joinTeamMessage || app['Team to Join'] || app.teamToJoin) && 
      app.status?.toLowerCase() !== 'rejected'
    );
  });
  
  // If there are no join applications and not loading, don't render anything
  if (teamJoinApplications.length === 0 && !isLoading) return null;
  
  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Get status display elements
  const getStatusDisplay = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Accepted
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      case 'submitted':
      default:
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  // Get team name from application
  const getTeamName = (application) => {
    // Try to get team ID from application
    const teamId = application['Team to Join']?.[0] || application.teamToJoin;
    
    // If we have the teams mapping and this team ID
    if (teams && teamId && teams[teamId]) {
      return teams[teamId].name || 'Unknown Team';
    }
    
    // Fallback to cohort name
    return application.cohortDetails?.name || 'Unknown Team';
  };
  
  return (
    <div className="my-6">
      <h3 className="text-lg font-medium mb-3">Your Team Join Requests</h3>
      
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <div className="space-y-4">
          {teamJoinApplications.map((application) => (
            <Card key={application.id} className="overflow-hidden">
              <CardHeader className="pb-3 pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{getTeamName(application)}</CardTitle>
                    <CardDescription>
                      {application.cohortDetails?.initiativeDetails?.name || 'Program'} • 
                      Applied on {formatDate(application.createdAt)}
                    </CardDescription>
                  </div>
                  {getStatusDisplay(application.status)}
                </div>
              </CardHeader>
              
              <CardContent className="pb-3 pt-0">
                {application.joinTeamMessage && (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Your message:</p>
                    <p className="italic">"{application.joinTeamMessage}"</p>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="pt-0 pb-3">
                <div className="flex justify-between w-full">
                  <div className="text-xs text-muted-foreground">
                    ID: {application.id}
                  </div>
                  
                  {application.status === 'Accepted' && (
                    <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                      <ExternalLink className="h-3 w-3" />
                      View Team
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}