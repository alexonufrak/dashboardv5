"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

/**
 * Panel component for selecting an existing team
 */
const TeamSelectPanel = ({ teams, selectedTeam, onSelectTeam }) => {
  // Handle team selection
  const handleTeamChange = (teamId) => {
    const team = teams.find(t => t.id === teamId)
    if (team) {
      onSelectTeam(team)
    }
  }
  
  if (!teams || teams.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">You don&apos;t have any teams yet.</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <RadioGroup
        value={selectedTeam?.id}
        onValueChange={handleTeamChange}
        className="space-y-4"
      >
        {teams.map(team => (
          <div
            key={team.id}
            className="cursor-pointer"
            onClick={() => handleTeamChange(team.id)}
          >
            <Card className={`overflow-hidden transition-all ${
              selectedTeam?.id === team.id ? 
              'ring-2 ring-primary ring-offset-2' : 
              'hover:border-primary/50'
            }`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={team.id} 
                      id={`team-${team.id}`} 
                      className="mt-0.5" 
                    />
                    <CardTitle className="text-lg font-semibold">
                      {team.name}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-slate-50">
                    {team.memberCount || team.members?.length || 0} Members
                  </Badge>
                </div>
                <CardDescription>
                  {team.institution?.name || "No Institution"}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {team.description || "No description provided"}
                </p>
                
                {/* Team members avatars */}
                {team.displayMembers && team.displayMembers.length > 0 ? (
                  <div className="flex items-center mt-4">
                    <div className="flex -space-x-2 mr-2">
                      {team.displayMembers.slice(0, 3).map((member, i) => (
                        <Avatar key={i} className="border-2 border-background w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {member?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    {team.memberCount > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{team.memberCount - 3} more
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    {team.memberCount || 0} members
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

export default TeamSelectPanel