import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { checkInitiativeConflicts } from '@/lib/airtable';
import { getCompleteUserProfile } from '@/lib/userProfile';

/**
 * API endpoint to check if the current user has conflicts with the specified initiative
 * Uses the Participation table as source of truth instead of applications
 */
export default withApiAuthRequired(async function checkInitiativeConflictsHandler(req, res) {
  try {
    // Get initiative name from query params
    const { initiative } = req.query;
    
    if (!initiative) {
      return res.status(400).json({ 
        error: 'Initiative name is required',
        hasConflict: false 
      });
    }

    // Get the user session
    const session = await getSession(req, res);
    
    if (!session || !session.user) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        hasConflict: false 
      });
    }
    
    // Get user profile to get the contact ID
    const userProfile = await getCompleteUserProfile(session.user);
    
    if (!userProfile) {
      return res.status(404).json({ 
        error: 'User profile not found',
        hasConflict: false
      });
    }
    
    const contactId = userProfile.contactId;
    
    // If we don't have a contact ID, we can't check conflicts
    if (!contactId) {
      return res.status(404).json({
        error: 'Contact record not found',
        hasConflict: false
      });
    }
    
    // Check for conflicts using the Participation table
    const conflictResult = await checkInitiativeConflicts(contactId, initiative);
    
    // Add cache control headers - cache for 1 hour (3600 seconds)
    // Client caching for 30 minutes, CDN/edge caching for 1 hour
    // Adding must-revalidate to force checking with server on page refresh
    res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=7200, must-revalidate');
    
    // Return conflict status with details if there's a conflict
    return res.status(200).json({
      ...conflictResult,
      _meta: {
        timestamp: new Date().toISOString(),
        contactId,
        initiative
      }
    });
  } catch (error) {
    console.error('Error checking initiative conflicts:', error);
    return res.status(500).json({
      error: 'Failed to check initiative conflicts',
      hasConflict: false
    });
  }
});