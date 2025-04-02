import { auth0 } from '@/lib/auth0';
import { getApplicationsByUserId } from '@/lib/airtable/entities/applications';

/**
 * API endpoint to check for user applications
 * Can optionally filter by cohort ID
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
async function checkApplicationsHandler(req, res) {
  try {
    // Get the user session
    const session = await auth0.getSession(req, res);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get optional cohort ID filter from query params
    const { cohortId } = req.query;
    
    // Get user applications using our DDD entity function
    const applications = await getApplicationsByUserId(session.user.sub, cohortId);
    
    // Calculate derived values
    const hasApplied = applications.length > 0;
    const application = applications.length > 0 ? applications[0] : null;
    
    // Return success response with applications data
    return res.status(200).json({
      applications,
      hasApplied,
      application,
      // Include specific cohort application if requested
      ...(cohortId ? {
        cohortId,
        hasAppliedToCohort: applications.some(app => app.cohortId === cohortId),
        cohortApplication: applications.find(app => app.cohortId === cohortId) || null
      } : {})
    });
  } catch (error) {
    console.error('Error checking application:', error);
    return res.status(500).json({
      error: 'Failed to check application',
      message: error.message,
      applications: []
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
    return checkApplicationsHandler(req, res);
  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}