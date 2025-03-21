"use client"

import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Award } from "lucide-react"

/**
 * Team card component that displays team information with member avatars
 * and a fading cover photo
 */
export function TeamCard({ team }) {
  if (!team) return null;
  
  return (
    <Card className="w-full h-full overflow-hidden relative">
      {/* Cover Photo with Fade Effect */}
      {team.image && (
        <div className="absolute top-0 left-0 w-full h-24 z-0">
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${team.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background"></div>
        </div>
      )}
      
      <div className="relative z-10">
        <CardHeader className="pb-2 pt-8">
          <CardTitle className="text-lg">
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
            <div className="flex items-center text-muted-foreground">
              <Award className="h-4 w-4 mr-1" />
              <span data-testid="team-points">
                {team.points} point{team.points !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}