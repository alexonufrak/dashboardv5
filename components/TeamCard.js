// components/TeamCard.js
import { useState } from "react"
import { Card, CardHeader, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { ChevronDown, ChevronUp, Users, Medal } from "lucide-react"

const TeamCard = ({ team }) => {
  const [expanded, setExpanded] = useState(false)
  
  // If no team data is provided, show a not found message
  if (!team) {
    return (
      <Card className="mb-5">
        <CardContent className="py-6 text-center italic text-muted-foreground">
          You are not currently part of any team.
        </CardContent>
      </Card>
    )
  }
  
  // Get active members only
  const activeMembers = team.members ? team.members.filter(member => member.status === "Active") : []
  
  return (
    <Card className="mb-5 overflow-hidden">
      <CardHeader className="p-4 sm:p-6 flex flex-row justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-primary">{team.name}</h3>
          {team.points !== undefined && (
            <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
              <Medal className="h-4 w-4" />
              <span>Team Points: <span className="font-medium text-foreground">{team.points || 0}</span></span>
            </div>
          )}
        </div>
        <Button 
          variant="ghost"
          size="icon"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? "Collapse team details" : "Expand team details"}
          className="h-8 w-8 rounded-full"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CardHeader>
      
      {expanded && (
        <CardContent className="p-4 sm:p-6 pt-0 space-y-6">
          <div>
            <h4 className="text-base font-semibold border-b border-border pb-2 mb-3">Description</h4>
            <p className="text-sm text-muted-foreground">
              {team.description || "No description available."}
            </p>
          </div>
          
          <div>
            <h4 className="text-base font-semibold border-b border-border pb-2 mb-3 flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>Team Members ({activeMembers.length})</span>
            </h4>
            
            {activeMembers.length > 0 ? (
              <ul className="space-y-2 divide-y divide-border">
                {activeMembers.map((member, index) => (
                  <li key={member.id || index} className="py-3 first:pt-0">
                    <div>
                      <span className="font-medium">
                        {member.name || member.email || "Unknown Member"}
                        {member.isCurrentUser && (
                          <span className="italic text-primary ml-1">(You)</span>
                        )}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="italic text-muted-foreground">No active team members found.</p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default TeamCard