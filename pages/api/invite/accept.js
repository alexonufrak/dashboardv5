import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { acceptTeamInvitation, getUserProfile } from '@/lib/airtable';

/**
 * API handler to accept a team invitation
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
export default withApiAuthRequired(async function acceptInvitationHandler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the user session
    const session = await getSession(req, res);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get the request body
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Invitation token is required' });
    }
    
    // Get the user profile to get the contact ID
    const userProfile = await getUserProfile(session.user.sub, session.user.email);
    
    if (!userProfile || !userProfile.contactId) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    
    // Accept the invitation
    const result = await acceptTeamInvitation(token, userProfile.contactId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Failed to accept invitation' });
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Invitation accepted successfully',
      team: result.invitation.team,
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return res.status(500).json({ error: 'Failed to accept invitation: ' + error.message });
  }
});