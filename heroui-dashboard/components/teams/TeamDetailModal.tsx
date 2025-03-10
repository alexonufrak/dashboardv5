"use client"

import { useState } from "react"
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Avatar,
  Badge,
  Divider,
  ScrollArea
} from "@heroui/react"
import { Button } from "@heroui/button"
import { Pencil, UserPlus } from "lucide-react"
import { TeamEditDialog, TeamInviteDialog } from "./index"
import { Team, TeamMember } from "@/types/dashboard"

interface TeamDetailModalProps {
  team: Team;
  isOpen: boolean;
  onClose: () => void;
  onTeamUpdated?: (team: Team) => void;
}

const TeamDetailModal = ({ team, isOpen, onClose, onTeamUpdated }: TeamDetailModalProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  
  if (!team) return null

  // Get all members (we'll show status for each one)
  let teamMembers = team.members || []
  
  // Sort members: Active first, then Invited, then others
  teamMembers = [...teamMembers].sort((a, b) => {
    const statusOrder = { "Active": 1, "Invited": 2 };
    const statusA = statusOrder[a.role as string] || 3;
    const statusB = statusOrder[b.role as string] || 3;
    return statusA - statusB;
  })
  
  // Check if user is a team member (by checking if any member has isCurrentUser property)
  const isUserTeamMember = teamMembers.some(member => 
    (member as any).isCurrentUser && member.role === "Active"
  ) || false
  
  // Get initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return "M"
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }
  
  // Handle team update
  const handleTeamUpdated = (updatedTeam: Team) => {
    if (onTeamUpdated) {
      onTeamUpdated(updatedTeam)
    }
  }
  
  // Get badge color based on member status
  const getMemberStatusColor = (status?: string) => {
    switch(status) {
      case "Active":
        return "success";
      case "Invited": 
        return "primary";
      default:
        return "default";
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onClose}>
        <ModalContent>
          {(closeModal) => (
            <>
              <ModalHeader>
                <div className="flex flex-col">
                  <h3 className="text-xl font-semibold">{team.name}</h3>
                  <p className="text-sm text-default-500">
                    Team details and members
                  </p>
                </div>
              </ModalHeader>
              
              <ModalBody>
                <div className="space-y-4 my-2">
                  {/* Team Description */}
                  <div>
                    <h4 className="text-sm font-semibold mb-1">About</h4>
                    <p className="text-sm text-default-500">
                      {team.description || "No description available."}
                    </p>
                  </div>
                  
                  <Divider />
                  
                  {/* Team Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Members</h4>
                      <p className="text-lg font-medium">
                        {teamMembers.filter(member => member.role === "Active").length} active
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
                  
                  <Divider />
                  
                  {/* Team Members */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Team Members</h4>
                    
                    <ScrollArea className="h-48 pr-4">
                      {teamMembers.length > 0 ? (
                        <div className="space-y-3">
                          {teamMembers.map((member, index) => (
                            <div 
                              key={member.id || index} 
                              className="flex items-center gap-3 p-2 rounded-md hover:bg-default-100"
                            >
                              <Avatar 
                                size="sm"
                                src={member.avatar || ""}
                                showFallback
                                name={getInitials(member.name)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium truncate">
                                    {member.name || member.email || "Unknown Member"}
                                  </p>
                                  
                                  {/* Member Status Badge */}
                                  {member.role && (
                                    <Badge
                                      variant="flat"
                                      color={getMemberStatusColor(member.role)}
                                      size="sm"
                                      className="px-2 py-0 h-5 font-normal"
                                    >
                                      {member.role}
                                    </Badge>
                                  )}
                                </div>
                                
                                {member.email && member.name && (
                                  <p className="text-xs text-default-500 truncate">
                                    {member.email}
                                  </p>
                                )}
                              </div>
                              
                              {(member as any).isCurrentUser && (
                                <Badge color="secondary" className="ml-auto">You</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center py-8 text-default-500 italic">
                          No team members found.
                        </p>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </ModalBody>
              
              <ModalFooter>
                {isUserTeamMember && (
                  <>
                    <Button
                      color="primary"
                      size="md"
                      onPress={() => setShowInviteDialog(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Invite Member
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      onPress={() => setShowEditDialog(true)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit Details
                    </Button>
                  </>
                )}
                <Button variant="flat" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      
      <TeamEditDialog 
        team={team}
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onTeamUpdated={handleTeamUpdated}
      />
      
      <TeamInviteDialog
        team={team}
        isOpen={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        onTeamUpdated={handleTeamUpdated}
      />
    </>
  )
}

export default TeamDetailModal