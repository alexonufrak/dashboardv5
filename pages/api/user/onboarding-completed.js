import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';

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
    
    // GET: Check if onboarding is completed
    if (req.method === 'GET') {
      // Check in memory and session
      const completed = global.onboardingCompletedUsers?.has(userId) === true;
      
      return res.status(200).json({ 
        completed, 
        userId 
      });
    }
    
    // POST: Mark onboarding as completed
    if (req.method === 'POST') {
      // Initialize the global set if it doesn't exist
      if (!global.onboardingCompletedUsers) {
        global.onboardingCompletedUsers = new Set();
      }
      
      // Add the user to the completed set
      global.onboardingCompletedUsers.add(userId);
      
      // Make regular metadata update in the background, but don't wait for it
      try {
        fetch('/api/user/metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            onboardingCompleted: true,
            completedAt: new Date().toISOString()
          })
        }).catch(e => console.error('Background metadata update failed:', e));
      } catch (error) {
        console.error('Failed to trigger background metadata update:', error);
      }
      
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in onboarding completion endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});