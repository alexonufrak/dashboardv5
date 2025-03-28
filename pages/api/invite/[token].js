import { getInvitationByToken } from '@/lib/airtable';

/**
 * API handler to get invitation details by token
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
async function getInvitationHandler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Invitation token is required' });
  }

  try {
    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Don't return the full team details to protect sensitive information
    const { team, ...inviteInfo } = invitation;
    
    // Only return minimal team info
    const safeTeamInfo = team ? {
      id: team.id,
      name: team.name,
      memberCount: team.members ? team.members.length : 0,
    } : null;

    // Return the invitation with safe team info
    return res.status(200).json({
      ...inviteInfo,
      team: safeTeamInfo,
      // Add a flag to indicate if the invitation is valid
      isValid: invitation.status === 'Pending' && !invitation.isExpired
    });
  } catch (error) {
    console.error('Error getting invitation details:', error);
    return res.status(500).json({ error: 'Failed to get invitation details' });
  }
}

export default withApiAuthRequired(getInvitationHandler)