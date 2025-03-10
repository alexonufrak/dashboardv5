import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import type { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSession(req, res);
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // For GET request - return profile data
    if (req.method === 'GET') {
      // In a real implementation, you'd fetch the user profile from your database
      // using the Auth0 user ID as a reference
      const mockProfile = {
        id: session.user.sub,
        email: session.user.email,
        firstName: session.user.given_name || session.user.name?.split(' ')[0] || 'User',
        lastName: session.user.family_name || session.user.name?.split(' ').slice(1).join(' ') || '',
        institutionName: 'University of Technology',
        headshot: session.user.picture || null
      };
      
      return res.status(200).json(mockProfile);
    }
    
    // For PUT request - update profile data
    if (req.method === 'PUT') {
      const updateData = req.body;
      
      // Validate required fields
      if (!updateData) {
        return res.status(400).json({ error: 'No update data provided' });
      }
      
      // In a real implementation, you'd update the user profile in your database
      // For now, just return the data that would be updated
      return res.status(200).json({
        id: session.user.sub,
        ...updateData
      });
    }
    
    // Handle unsupported methods
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Profile API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export default withApiAuthRequired(handler);