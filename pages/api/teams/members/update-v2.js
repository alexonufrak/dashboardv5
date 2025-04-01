import { teams, participation } from '@/lib/airtable/entities';
import { auth0 } from '@/lib/auth0';

/**
 * API endpoint to update team member roles or remove members
 * Uses the new domain-driven Airtable architecture
 * 
 * @param {object} req - Next.js request object
 * @param {object} res - Next.js response object
 */
export default async function handler(req, res) {
  try {
    // Get Auth0 session and validate user is authenticated
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({
        error: 'Not authenticated'
      });
    }
    const { user } = session;

    if (req.method !== 'PATCH' && req.method !== 'DELETE') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { teamId, memberId } = req.body;

    // Validate required fields
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    if (!memberId) {
      return res.status(400).json({ error: 'Member ID is required' });
    }

    // Fetch the team to check if the user is authorized to modify it
    const team = await teams.getTeamById(teamId);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Get team members to check permissions
    const teamMembers = await teams.getTeamMembers(teamId);
    
    // Find the current user in the team
    const currentUser = teamMembers.find(member => member.userId === user.sub);
    
    // Find the target member
    const targetMember = teamMembers.find(member => member.id === memberId);
    
    if (!targetMember) {
      return res.status(404).json({ error: 'Member not found in this team' });
    }
    
    // Check if the user is authorized (must be a team lead or the user themselves)
    const isTeamLead = currentUser && currentUser.role === 'Team Lead';
    const isCurrentUser = targetMember.userId === user.sub;
    
    if (!isTeamLead && !isCurrentUser) {
      return res.status(403).json({ 
        error: 'You are not authorized to modify this team member' 
      });
    }
    
    // Handle DELETE request (remove member)
    if (req.method === 'DELETE') {
      // Don't allow removing the last team lead
      if (targetMember.role === 'Team Lead') {
        const teamLeads = teamMembers.filter(m => m.role === 'Team Lead');
        if (teamLeads.length <= 1) {
          return res.status(400).json({ 
            error: 'Cannot remove the last team lead. Assign another team lead first.' 
          });
        }
      }
      
      // Use updateTeam to remove member directly
      const updatedTeamMembers = teamMembers.filter(m => m.id !== memberId);
      const updatedTeam = await teams.updateTeam(teamId, {
        members: updatedTeamMembers.map(m => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          name: m.name,
          email: m.email
        }))
      });
      
      // Also update their participation record if they're leaving the team
      if (targetMember.userId) {
        try {
          // Get the user's participation in this team's program/cohort
          const participationRecords = await participation.getParticipationRecords(targetMember.userId);
          
          const relevantParticipation = participationRecords.find(p => 
            p.teamId === teamId && 
            (p.programId === team.programId || p.cohortId === team.cohortId)
          );
          
          if (relevantParticipation) {
            // Update to remove team association - need to use direct table operation
            // as updateParticipationRecord is not available
            const updatedParticipation = {
              ...relevantParticipation,
              teamId: null
            };
            delete updatedParticipation.id; // Remove ID from update payload
            
            // Get table through the entity and update directly
            const participationTable = await import('@/lib/airtable/tables');
            const table = participationTable.getParticipationTable();
            await table.update(relevantParticipation.id, updatedParticipation);
          }
        } catch (error) {
          console.error('Error updating participation record:', error);
          // Continue anyway since the team update worked
        }
      }
      
      return res.status(200).json({
        success: true,
        message: 'Member removed from team',
        team: updatedTeam
      });
    }
    
    // Handle PATCH request (update member role)
    if (req.method === 'PATCH') {
      const { role } = req.body;
      
      if (!role) {
        return res.status(400).json({ error: 'Role is required for updates' });
      }
      
      // Only team leads can change roles
      if (!isTeamLead) {
        return res.status(403).json({ 
          error: 'Only team leads can change member roles' 
        });
      }
      
      // Update team with new member role
      const updatedTeamMembers = teamMembers.map(m => {
        if (m.id === memberId) {
          return { ...m, role };
        }
        return m;
      });
      
      const updatedTeam = await teams.updateTeam(teamId, {
        members: updatedTeamMembers.map(m => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          name: m.name,
          email: m.email
        }))
      });
      
      return res.status(200).json({
        success: true,
        message: 'Member role updated',
        team: updatedTeam
      });
    }
  } catch (error) {
    console.error('Error updating team member:', error);
    return res.status(500).json({
      error: 'An error occurred while updating the team member',
      message: error.message,
      details: error.details || {}
    });
  }
}