import { auth0 } from '@/lib/auth0';
import { searchInstitutionsByName } from '@/lib/airtable/entities/institutions';

/**
 * Search for institutions by name
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
async function searchInstitutionsHandler(req, res) {
  try {
    // Get query parameter
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ 
        error: 'Query parameter must be at least 2 characters long' 
      });
    }
    
    // Perform the search
    const institutions = await searchInstitutionsByName(q, parseInt(limit, 10));
    
    // Return results
    return res.status(200).json({
      institutions,
      count: institutions.length,
      query: q,
      _meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error searching institutions:', error);
    return res.status(500).json({ 
      error: 'Failed to search institutions',
      message: error.message
    });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Check for valid Auth0 session
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    return searchInstitutionsHandler(req, res);
  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}