import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import auth0Client from '../../../lib/auth0';

/**
 * Direct API to check and set onboarding completion status
 * Uses the Auth0 Management API to ensure correct metadata state
 */
export default withApiAuthRequired(async function onboardingCompleted(req, res) {
  try {
    const session = await getSession(req, res);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = session.user.sub;
    
    // GET: Check if onboarding is completed by checking Auth0 directly
    if (req.method === 'GET') {
      try {
        // Try to get the most up-to-date information from Auth0
        const userData = await auth0Client.getUser({ id: userId });
        
        if (userData && userData.user_metadata) {
          const completed = userData.user_metadata.onboardingCompleted === true;
          
          console.log(`Direct Auth0 check for onboarding completion [user ${userId}]:`, {
            completed,
            onboardingCompleted: userData.user_metadata.onboardingCompleted,
            onboardingCompletedType: typeof userData.user_metadata.onboardingCompleted,
            onboardingCompletedAt: userData.user_metadata.onboardingCompletedAt
          });
          
          return res.status(200).json({ 
            completed,
            userId,
            source: 'auth0-direct'
          });
        }
      } catch (auth0Error) {
        console.warn('Error checking Auth0 directly:', auth0Error.message);
        // Continue to session fallback
      }
      
      // Fallback to session data if Auth0 direct check fails
      const metadata = session.user.user_metadata || {};
      const completed = metadata.onboardingCompleted === true;
      
      console.log(`Session fallback for onboarding completion [user ${userId}]:`, {
        hasMetadata: !!session.user.user_metadata,
        completed,
        onboardingCompleted: metadata.onboardingCompleted,
        onboardingCompletedType: typeof metadata.onboardingCompleted,
        metadataKeys: Object.keys(metadata || {})
      });
      
      return res.status(200).json({ 
        completed,
        userId,
        source: 'session-fallback'
      });
    }
    
    // POST: Mark onboarding as completed - directly update in Auth0
    if (req.method === 'POST') {
      try {
        const timestamp = new Date().toISOString();
        
        // Attempt to update directly in Auth0 with retry logic
        const updateWithRetry = async (retries = 3, delay = 500) => {
          try {
            await auth0Client.updateUserMetadata({ id: userId }, {
              onboardingCompleted: true,
              onboardingCompletedAt: timestamp
            });
            return true;
          } catch (updateError) {
            if (retries > 1) {
              console.log(`Auth0 update failed, retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              return updateWithRetry(retries - 1, delay * 2);
            }
            throw updateError;
          }
        };
        
        const updateSuccessful = await updateWithRetry();
        
        console.log(`Onboarding completion update for user ${userId}:`, {
          updateSuccessful,
          timestamp
        });
        
        return res.status(200).json({ 
          success: true,
          userId,
          timestamp,
          updateSuccessful
        });
      } catch (error) {
        console.error('Error updating onboarding completion in Auth0:', error);
        // Allow the request to succeed but indicate the error
        return res.status(200).json({ 
          success: false,
          error: error.message,
          userId
        });
      }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in onboarding completion endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});