"use client"

import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Users, Award, Edit } from "lucide-react"

/**
 * Team card component that displays team information with member avatars
 */
export function TeamCard({ team, onInviteClick, onEditTeamClick }) {
  if (!team) return null;
  
  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Avatar className="h-6 w-6 border">
            <AvatarImage src={team.image} alt={team.name} />
            <AvatarFallback>{team.name?.substring(0, 2).toUpperCase() || "TM"}</AvatarFallback>
          </Avatar>
          {team.name || "Your Team"}
        </CardTitle>
        {team.description && (
          <CardDescription className="line-clamp-2">{team.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {/* Team member avatars stacked */}
        <div className="flex -space-x-2 overflow-hidden mb-4">
          {team.members && team.members.length > 0 ? (
            <>
              {team.members.slice(0, 5).map((member, index) => (
                <Avatar key={member.id || index} className="border-2 border-background">
                  <AvatarImage src={member.image || member.avatar} alt={member.name || `Team member ${index + 1}`} />
                  <AvatarFallback>
                    {member.name ? member.name.substring(0, 2).toUpperCase() : `M${index + 1}`}
                  </AvatarFallback>
                </Avatar>
              ))}
              {team.members.length > 5 && (
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-xs font-medium border-2 border-background">
                  +{team.members.length - 5}
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No team members</div>
          )}
        </div>
        
        {/* Points if available */}
        {team.points > 0 && (
          <div className="flex items-center text-muted-foreground mb-2">
            <Award className="h-4 w-4 mr-1" />
            <span data-testid="team-points">
              {team.points} point{team.points !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 pt-0">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={onInviteClick}
        >
          <Users className="h-4 w-4 mr-2" />
          Invite
        </Button>
        <Button 
          size="sm"
          className="w-full"
          onClick={onEditTeamClick}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </CardFooter>
    </Card>
  )
}