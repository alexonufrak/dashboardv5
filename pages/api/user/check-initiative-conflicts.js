import { auth0 } from '@/lib/auth0';
import { checkInitiativeConflicts } from '@/lib/airtable';
import { getCompleteUserProfile } from '@/lib/userProfile';

/**
 * API endpoint to check if the current user has conflicts with the specified initiative
 * Uses the Participation table as source of truth instead of applications
 */
async function checkInitiativeConflictsHandler(req, res) {
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
    const session = await auth0.getSession(req, res);
    
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
    
    // Use moderate caching for initiative conflicts
    // Cache for 5 minutes max, but require revalidation on refresh
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, must-revalidate');
    
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
};

export default async function handlerImpl(req, res) {
  try {
    // Check for valid Auth0 session
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Call the original handler with the authenticated session
    return checkInitiativeConflictsHandler(req, res);
  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}