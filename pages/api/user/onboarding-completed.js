import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';

/**
 * Direct API to check and set onboarding completion status
 * Uses the user's session metadata as the source of truth
 */
export default withApiAuthRequired(async function onboardingCompleted(req, res) {
  try {
    const session = await getSession(req, res);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = session.user.sub;
    
    // GET: Check if onboarding is completed by reading directly from the session
    if (req.method === 'GET') {
      // Read completion status from user's session metadata (the source of truth)
      const metadata = session.user.user_metadata || {};
      const completed = metadata.onboardingCompleted === true;
      
      console.log(`Checking onboarding completion for user ${userId}:`, {
        hasMetadata: !!session.user.user_metadata,
        completed,
        onboardingCompleted: metadata.onboardingCompleted,
        onboardingCompletedType: typeof metadata.onboardingCompleted,
        metadataKeys: Object.keys(metadata || {})
      });
      
      return res.status(200).json({ 
        completed,
        userId 
      });
    }
    
    // POST: Mark onboarding as completed - this is handled client-side
    if (req.method === 'POST') {
      // Just acknowledge the request - the client will update metadata directly
      console.log(`Received completion request for user ${userId}`);
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in onboarding completion endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});