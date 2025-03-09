"use client"

import React from 'react'
import TeamInviteDialog from "@/components/teams/TeamInviteDialog"
import TeamEditDialog from "@/components/teams/TeamEditDialog"

/**
 * Component that manages team-related dialogs (invite, edit)
 */
export function TeamDialogs({
  isInviteDialogOpen,
  isEditDialogOpen,
  onInviteDialogClose,
  onEditDialogClose,
  team,
  onTeamUpdated
}) {
  return (
    <>
      {/* Invite Dialog */}
      <TeamInviteDialog 
        open={isInviteDialogOpen} 
        onClose={onInviteDialogClose}
        team={team}
        onTeamUpdated={(updatedTeam) => {
          onTeamUpdated(updatedTeam, 'invite');
        }}
      />
      
      {/* Edit Team Dialog */}
      <TeamEditDialog
        open={isEditDialogOpen}
        onClose={onEditDialogClose}
        team={team}
        onTeamUpdated={(updatedTeam) => {
          onTeamUpdated(updatedTeam, 'edit');
        }}
      />
    </>
  )
}