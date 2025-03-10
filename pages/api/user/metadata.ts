import { NextApiRequest, NextApiResponse } from 'next';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getAuth0ManagementClient } from '@/lib/auth0';

/**
 * API endpoint for getting and updating user metadata
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const session = await getSession(req, res);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = session.user.sub;
    
    // GET request - Fetch user metadata
    if (req.method === 'GET') {
      const auth0 = await getAuth0ManagementClient();
      
      const userResponse = await auth0.users.get({ id: userId });
      const user = userResponse?.data || {};
      
      // Return user metadata
      return res.status(200).json({
        ...(user.user_metadata || {})
      });
    }
    
    // POST request - Update user metadata
    if (req.method === 'POST') {
      const auth0 = await getAuth0ManagementClient();
      
      // Extract metadata from request body
      const { onboarding, onboardingCompleted, ...otherMetadata } = req.body;
      
      // Create the metadata update object
      const metadataUpdate: Record<string, any> = { ...otherMetadata };
      
      // If onboarding field is present, update it
      if (onboarding !== undefined) {
        metadataUpdate.onboarding = onboarding;
      }
      
      // If onboardingCompleted field is present, update it
      if (onboardingCompleted !== undefined) {
        metadataUpdate.onboardingCompleted = onboardingCompleted;
      }
      
      // Update user metadata - use the updateAppMetadata method which also handles user_metadata
      await auth0.users.update(
        { id: userId },
        { user_metadata: metadataUpdate }
      );
      
      return res.status(200).json({
        success: true,
        message: 'User metadata updated successfully'
      });
    }
    
    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in metadata API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error?.message || 'Unknown error occurred'
    });
  }
};

export default withApiAuthRequired(handler);