"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Pencil } from "lucide-react"
import TeamEditDialog from "./TeamEditDialog"

const TeamDetailModal = ({ team, isOpen, onClose, onTeamUpdated }) => {
  const [showEditDialog, setShowEditDialog] = useState(false)
  
  if (!team) return null

  // Get active members only
  const activeMembers = team.members ? team.members.filter(member => member.status === "Active") : []
  
  // Check if user is a team member
  const isUserTeamMember = team.members?.some(member => member.isCurrentUser && member.status === "Active") || false
  
  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return "M"
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }
  
  // Handle team update
  const handleTeamUpdated = (updatedTeam) => {
    if (onTeamUpdated) {
      onTeamUpdated(updatedTeam)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose} className="transition-all duration-300 ease-in-out">
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl flex items-center">
                {team.name}
              </DialogTitle>
            </div>
            <DialogDescription>
              Team details and members
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-2">
            {/* Team Description */}
            <div>
              <h4 className="text-sm font-semibold mb-1">About</h4>
              <p className="text-sm text-muted-foreground">
                {team.description || "No description available."}
              </p>
            </div>
            
            <Separator />
            
            {/* Team Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-1">Members</h4>
                <p className="text-lg font-medium">
                  {activeMembers.length}
                </p>
              </div>
              {team.points !== undefined && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Team Points</h4>
                  <p className="text-lg font-medium">
                    {team.points || 0}
                  </p>
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Team Members */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Team Members</h4>
              
              <ScrollArea className="h-[200px] pr-4">
                {activeMembers.length > 0 ? (
                  <div className="space-y-3">
                    {activeMembers.map((member, index) => (
                      <div 
                        key={member.id || index} 
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.profilePicture} />
                          <AvatarFallback>
                            {getInitials(member.name || member.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {member.name || member.email || "Unknown Member"}
                          </p>
                          {member.email && member.name && (
                            <p className="text-xs text-muted-foreground truncate">
                              {member.email}
                            </p>
                          )}
                        </div>
                        {member.isCurrentUser && (
                          <Badge variant="secondary" className="ml-auto">You</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground italic">
                    No active team members found.
                  </p>
                )}
              </ScrollArea>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between gap-2">
            <div className="flex-grow"></div>
            {isUserTeamMember && (
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(true)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Details
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <TeamEditDialog 
        team={team}
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onTeamUpdated={handleTeamUpdated}
      />
    </>
  )
}

export default TeamDetailModal