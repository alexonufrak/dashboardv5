import { auth0 } from '@/lib/auth0';
import { acceptTeamInvitation, getUserProfile } from '@/lib/airtable';

/**
 * API handler to accept a team invitation
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
export default async function acceptInvitationHandler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the user session using Auth0 v4
    const session = await auth0.getSession(req);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get the request body or check for pending invitation in the session
    let { token } = req.body;
    let contactId;
    
    // If token wasn't provided in request body, check for pendingInvitation in session
    if (!token && session.user.pendingInvitation) {
      console.log("Using pending invitation from session");
      token = session.user.pendingInvitation.token;
      contactId = session.user.pendingInvitation.contactId;
      
      // Clear the pending invitation from session metadata after use
      try {
        const userId = session.user.sub;
        const metadata = {
          ...session.user.user_metadata,
          pendingInvitation: null
        };
        
        // Get direct management API token for Auth0
        const authToken = await auth0.default.getDirectAuth0Token();
        if (authToken) {
          const domain = (process.env.AUTH0_ISSUER_BASE_URL || '').replace('https://', '');
          
          // Use Axios to make a direct API call
          const axios = require('axios');
          await axios({
            method: 'PATCH',
            url: `https://${domain}/api/v2/users/${userId}`,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            data: {
              user_metadata: metadata
            }
          });
          
          console.log("Successfully cleared pending invitation from metadata");
        }
      } catch (clearError) {
        console.error("Error clearing invitation from metadata:", clearError);
        // Don't fail the entire request if we can't clear the metadata
      }
    }
    
    if (!token) {
      return res.status(400).json({ error: 'Invitation token is required' });
    }
    
    // Use contactId from session if available, otherwise get from user profile
    if (!contactId) {
      const userProfile = await getUserProfile(session.user.sub, session.user.email);
      
      if (!userProfile || !userProfile.contactId) {
        return res.status(404).json({ error: 'User profile not found' });
      }
      
      contactId = userProfile.contactId;
    }
    
    // Accept the invitation
    const result = await acceptTeamInvitation(token, contactId);
    
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
};