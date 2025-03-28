import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0'
import { getUserProfile, getTeamById } from '@/lib/airtable'
import { leaveTeam } from '@/lib/leaveOperations'

/**
 * API handler for leaving a team
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
async function leaveTeamHandler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { teamId } = req.query

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
    
    // Get specific cohort ID from request body if available
    const { cohortId, programId } = req.body || {}
    console.log(`Request includes specific cohortId: ${cohortId}, programId: ${programId}`)

    // Use our shared leaveTeam utility to update team member records
    const teamLeaveResult = await leaveTeam(userProfile.contactId, teamId)
    
    if (!teamLeaveResult.success) {
      console.error('Error in team leave operation:', teamLeaveResult.error)
      return res.status(500).json({ error: teamLeaveResult.error || 'Failed to leave team' })
    }
    
    console.log(`Team leave operation result: ${teamLeaveResult.message}`)

    // Set cache-control header to prevent caching on this mutation endpoint
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    
    // Respond with success - include cache invalidation info
    return res.status(200).json({
      success: true,
      message: 'Successfully left the team',
      recordsUpdated: teamLeaveResult.updatedRecords || 0,
      invalidateCaches: ['participation', 'teams', 'initiativeConflicts'] // Include which caches should be invalidated by the client
    })
  } catch (error) {
    console.error(`Error leaving team ${teamId}:`, error)
    return res.status(500).json({ error: 'Failed to leave team' })
  }
}

export default withApiAuthRequired(leaveTeamHandler)