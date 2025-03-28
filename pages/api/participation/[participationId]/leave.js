import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0'
import { getUserProfile } from '@/lib/airtable'
import { leaveParticipation } from '@/lib/leaveOperations'

/**
 * API handler for leaving a participation record (leaving a program/initiative)
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
async function leaveParticipationHandler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Get participation ID from the URL parameter
  const { participationId } = req.query

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
    
    // Get specific cohort ID and program ID from request body if available
    const { cohortId, programId } = req.body || {}
    console.log(`Request to leave participation: participationId=${participationId}, cohortId=${cohortId}, programId=${programId}`)
    
    // If participationId is "unknown" and no identifiers are provided, return an error
    if (participationId === "unknown" && !cohortId && !programId) {
      return res.status(400).json({ 
        error: 'When participationId is "unknown", either cohortId or programId is required' 
      })
    }

    // Use our shared leaveParticipation utility
    const participationLeaveResult = await leaveParticipation(
      userProfile.contactId, 
      participationId !== "unknown" ? participationId : null,
      cohortId,
      programId
    )
    
    if (!participationLeaveResult.success) {
      console.error('Error in participation leave operation:', participationLeaveResult.error)
      return res.status(500).json({ error: participationLeaveResult.error || 'Failed to leave program' })
    }
    
    console.log(`Participation leave operation result: ${participationLeaveResult.message}`)
    
    // Set cache-control header to prevent caching on this mutation endpoint
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    
    // If we didn't update any records, it's a potential caveat but not an error
    if (participationLeaveResult.updatedRecords === 0) {
      return res.status(200).json({
        success: true, 
        warning: "No participation records were updated",
        message: "Operation completed, but no records were updated",
        invalidateCaches: ['participation', 'initiativeConflicts']
      })
    }
    
    // Respond with success
    return res.status(200).json({
      success: true,
      message: 'Successfully left the program',
      recordsUpdated: participationLeaveResult.updatedRecords || 0,
      invalidateCaches: ['participation', 'initiativeConflicts'] // Caches to invalidate
    })
  } catch (error) {
    console.error(`Error in leave participation handler:`, error)
    return res.status(500).json({ error: 'Failed to leave program' })
  }
}

export default withApiAuthRequired(leaveParticipationHandler)