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
import { Pencil, UserPlus } from "lucide-react"
import TeamEditDialog from "./TeamEditDialog"
import TeamInviteDialog from "./TeamInviteDialog"

const TeamDetailModal = ({ team, isOpen, onClose, onTeamUpdated }) => {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  
  if (!team) return null

  // Get all members (we'll show status for each one)
  let teamMembers = team.members || []
  
  // Sort members: Active first, then Invited, then others
  teamMembers = [...teamMembers].sort((a, b) => {
    const statusOrder = { "Active": 1, "Invited": 2 };
    const statusA = statusOrder[a.status] || 3;
    const statusB = statusOrder[b.status] || 3;
    return statusA - statusB;
  })
  
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
                  {teamMembers.filter(member => member.status === "Active").length} active
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
                {teamMembers.length > 0 ? (
                  <div className="space-y-3">
                    {teamMembers.map((member, index) => (
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
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">
                              {member.name || member.email || "Unknown Member"}
                            </p>
                            
                            {/* Member Status Badge */}
                            {member.status && (
                              <Badge
                                variant={
                                  member.status === "Active" ? "success" : 
                                  member.status === "Invited" ? "outline" : 
                                  "secondary"
                                }
                                className={`text-xs px-2 py-0 h-5 font-normal ${
                                  member.status === "Active" ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200" : 
                                  member.status === "Invited" ? "bg-blue-50 text-blue-800 hover:bg-blue-100 border-blue-200" : 
                                  "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {member.status}
                              </Badge>
                            )}
                          </div>
                          
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
                    No team members found.
                  </p>
                )}
              </ScrollArea>
            </div>
          </div>
          
          <DialogFooter className="flex justify-end sm:justify-end gap-2">
            {isUserTeamMember && (
              <>
                <Button
                  variant="default"
                  size="default"
                  onClick={() => setShowInviteDialog(true)}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Invite Member
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setShowEditDialog(true)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit Details
                </Button>
              </>
            )}
            <Button variant="secondary" onClick={onClose}>
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
      
      <TeamInviteDialog
        team={team}
        open={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        onTeamUpdated={handleTeamUpdated}
      />
    </>
  )
}

export default TeamDetailModal