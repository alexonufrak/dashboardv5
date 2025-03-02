import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import auth0Client from '../../../lib/auth0';

/**
 * Simple dedicated endpoint just for setting onboarding completion
 * This ensures a clean, reliable way to mark onboarding as completed
 */
export default withApiAuthRequired(async function onboardingCompleted(req, res) {
  try {
    const session = await getSession(req, res);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = session.user.sub;
    
    // Ensure we have a global map to track completed users
    if (typeof global.onboardingCompletedUsers === 'undefined') {
      global.onboardingCompletedUsers = new Map();
    }
    
    // GET: Check if onboarding is completed
    if (req.method === 'GET') {
      // Check if user is in our global map
      const completed = global.onboardingCompletedUsers.has(userId);
      
      // If not in the map, check Auth0 metadata as a fallback
      if (!completed) {
        try {
          // Try to get from actual metadata if possible
          const response = await fetch('/api/user/metadata');
          if (response.ok) {
            const metadata = await response.json();
            
            // If we find it's completed in metadata, add to our map for faster lookups
            if (metadata.onboardingCompleted === true) {
              global.onboardingCompletedUsers.set(userId, true);
              return res.status(200).json({ completed: true, userId });
            }
          }
        } catch (err) {
          console.error("Error checking metadata for onboarding status:", err);
        }
      }
      
      return res.status(200).json({ completed, userId });
    }
    
    // POST: Mark onboarding as completed
    if (req.method === 'POST') {
      // Add the user to the global map
      global.onboardingCompletedUsers.set(userId, true);
      
      // Make the update to Auth0 metadata
      try {
        const metadataResponse = await fetch('/api/user/metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            onboardingCompleted: true,
            completedAt: new Date().toISOString()
          })
        });
        
        if (!metadataResponse.ok) {
          console.warn("Failed to update onboarding in metadata, but global map is updated");
        }
      } catch (error) {
        console.error('Failed to update metadata:', error);
      }
      
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in onboarding completion endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});