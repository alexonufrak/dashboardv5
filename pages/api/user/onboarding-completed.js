import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';

// Use process-global variable to track completion state across requests
// This is the most reliable approach - no dependencies on other systems
if (!global.onboardingCompletedUsers) {
  global.onboardingCompletedUsers = new Set();
}

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
      // Simply check if the user is in our completion set
      const completed = global.onboardingCompletedUsers.has(userId);
      console.log(`Checking onboarding completion for user ${userId}: ${completed ? 'COMPLETED' : 'NOT COMPLETED'}`);
      
      return res.status(200).json({ 
        completed, 
        userId 
      });
    }
    
    // POST: Mark onboarding as completed
    if (req.method === 'POST') {
      console.log(`Marking onboarding as completed for user ${userId}`);
      
      // Add the user to the completion set - this is the source of truth
      global.onboardingCompletedUsers.add(userId);
      
      // Return success immediately - this is a critical path
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in onboarding completion endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});