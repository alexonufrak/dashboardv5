import { auth0 } from '@/lib/auth0';
import { getApplicationsByUserId } from '@/lib/airtable/entities/applications';

/**
 * API handler for fetching the current user's applications
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
async function getMyApplicationsHandler(req, res) {
  try {
    // Get the user session
    const session = await auth0.getSession(req, res);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Optional cohort filter
    const { cohortId } = req.query;
    
    // Get applications for the authenticated user
    const applications = await getApplicationsByUserId(session.user.sub, cohortId);
    
    // Return success response
    return res.status(200).json({ applications });
  } catch (error) {
    console.error('Error fetching user applications:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch applications',
      message: error.message
    });
  }
}

export default async function handlerImpl(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Check for valid Auth0 session
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Call the handler with the authenticated session
    return getMyApplicationsHandler(req, res);
  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}