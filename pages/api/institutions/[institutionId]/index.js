import { auth0 } from '@/lib/auth0';
import { getInstitution } from '@/lib/airtable/entities/institutions';

/**
 * Get institution details by ID
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
async function getInstitutionHandler(req, res) {
  try {
    // Get institution ID from URL
    const { institutionId } = req.query;
    
    if (!institutionId) {
      return res.status(400).json({ error: 'Institution ID is required' });
    }
    
    // Fetch institution
    const institution = await getInstitution(institutionId);
    
    if (!institution) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    
    // Return institution data
    return res.status(200).json({
      institution,
      _meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching institution:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch institution',
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
    
    return getInstitutionHandler(req, res);
  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}