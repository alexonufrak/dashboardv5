import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0'
import { getUserProfile, getTeamById } from '@/lib/airtable'
import { updateMemberStatus, deleteTeamInvitation } from '@/lib/leaveOperations'

/**
 * API handler to manage team members - update status or delete 
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
async function teamMemberHandler(req, res) {
  const { teamId, memberId } = req.query

  // Only allow PATCH (status update) and DELETE (remove invite) requests
  if (req.method !== 'PATCH' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the user session
    const session = await getSession(req, res)
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    
    // Get user profile from Airtable
    const userProfile = await getUserProfile(session.user.sub, session.user.email)
    
    if (!userProfile || !userProfile.contactId) {
      return res.status(404).json({ error: 'User profile not found' })
    }

    // Check if user is a member of the team
    const team = await getTeamById(teamId, userProfile.contactId)
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' })
    }
    
    // Check if user is an active member of the team
    const isTeamMember = team.members.some(
      member => member.id === userProfile.contactId && member.status === 'Active'
    )
    
    if (!isTeamMember) {
      return res.status(403).json({ error: 'You must be an active team member to manage team members' })
    }
    
    // Don't allow modification of the user's own record through this endpoint
    if (memberId === userProfile.contactId) {
      return res.status(403).json({ error: 'You cannot remove yourself from the team through this endpoint. Use the leave team function instead.' })
    }
    
    // Find the member in the team
    const memberToManage = team.members.find(member => member.id === memberId)
    
    if (!memberToManage) {
      return res.status(404).json({ error: 'Member not found in team' })
    }

    // PATCH request - update member status (for active members to inactive)
    if (req.method === 'PATCH') {
      // Only allow updating status from Active to Inactive
      if (memberToManage.status !== 'Active') {
        return res.status(400).json({ error: 'Only active members can be made inactive' })
      }
      
      // Update the member record to Inactive status
      const result = await updateMemberStatus(memberId, teamId)
      
      if (!result.success) {
        return res.status(500).json({ error: result.error || 'Failed to update member status' })
      }
      
      // Get the updated team data
      const updatedTeam = await getTeamById(teamId, userProfile.contactId)
      
      // Set cache-control header to prevent caching on this mutation endpoint
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      
      return res.status(200).json({ 
        success: true, 
        message: 'Member status updated to Inactive',
        team: updatedTeam,
        invalidateCaches: ['teams'] // Include which caches should be invalidated by the client
      })
    }
    
    // DELETE request - delete invitation record
    if (req.method === 'DELETE') {
      // Only allow deleting if status is Invited
      if (memberToManage.status !== 'Invited') {
        return res.status(400).json({ error: 'Only invited members can be deleted. Use PATCH to mark active members as inactive.' })
      }
      
      // Delete the invitation
      const result = await deleteTeamInvitation(memberId, teamId)
      
      if (!result.success) {
        return res.status(500).json({ error: result.error || 'Failed to delete invitation' })
      }
      
      // Get the updated team data
      const updatedTeam = await getTeamById(teamId, userProfile.contactId)
      
      // Set cache-control header to prevent caching on this mutation endpoint
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      
      return res.status(200).json({ 
        success: true, 
        message: 'Invitation deleted successfully',
        team: updatedTeam,
        invalidateCaches: ['teams'] // Include which caches should be invalidated by the client
      })
    }
  } catch (error) {
    console.error('Error managing team member:', error)
    return res.status(500).json({ error: 'Failed to manage team member: ' + error.message })
  }
}

export default withApiAuthRequired(teamMemberHandler)