import { auth0 } from '@/lib/auth0';
import { users } from '@/lib/airtable/entities';

/**
 * API endpoint to handle onboarding completion status
 * Refactored to use the domain-driven Airtable architecture
 * 
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 */
export default async function handler(req, res) {
  try {
    // Check for valid Auth0 session
    const session = await auth0.getSession(req, res);
    if (!session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.user.sub;
    const userEmail = session.user.email;
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return handleGetOnboardingStatus(req, res, session.user);
      case 'POST':
        return handleCompleteOnboarding(req, res, session.user);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}

/**
 * Handle GET request to check onboarding status
 * 
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 * @param {object} user - Auth0 user object
 */
async function handleGetOnboardingStatus(req, res, user) {
  try {
    const userId = user.sub;
    const userEmail = user.email;
    
    // Get user from Airtable by Auth0 ID or email
    const userProfile = await users.getUserByAuth0Id(userId) || await users.getUserByEmail(userEmail);
    
    if (!userProfile || !userProfile.contactId) {
      return res.status(404).json({ error: 'User profile not found in Airtable' });
    }

    const contactId = userProfile.contactId;
    
    // Get onboarding status directly from user entity
    const onboardingStatus = userProfile.onboardingStatus || "Registered";
    const hasParticipation = userProfile.hasActiveParticipation === true;
    const hasApplications = userProfile.applications && userProfile.applications.length > 0;
    
    // Determine if onboarding is completed
    const completed = onboardingStatus === "Applied" || hasParticipation || hasApplications;
    
    // Return the onboarding status
    return res.status(200).json({ 
      completed,
      status: completed ? "Applied" : onboardingStatus,
      userId,
      contactId,
      source: 'airtable-entity'
    });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return res.status(500).json({ error: 'Failed to check onboarding status' });
  }
}

/**
 * Handle POST request to complete onboarding
 * 
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 * @param {object} user - Auth0 user object
 */
async function handleCompleteOnboarding(req, res, user) {
  try {
    const userId = user.sub;
    const userEmail = user.email;
    const timestamp = new Date().toISOString();
    
    // Get user from Airtable by Auth0 ID or email
    const userProfile = await users.getUserByAuth0Id(userId) || await users.getUserByEmail(userEmail);
    
    if (!userProfile || !userProfile.contactId) {
      return res.status(404).json({ error: 'User profile not found in Airtable' });
    }

    const contactId = userProfile.contactId;
    
    // Update Airtable using the users entity
    try {
      // Update the user's onboarding status in Airtable
      const airtableResult = await users.updateOnboardingStatus(contactId, "Applied");
      console.log(`Updated Airtable onboarding status for contact ${contactId}:`, airtableResult);
      
      return res.status(200).json({ 
        success: true,
        userId,
        contactId,
        timestamp,
        onboardingStatus: "Applied"
      });
    } catch (error) {
      console.error('Error updating Airtable onboarding status:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  } catch (error) {
    console.error('Error in onboarding completion update:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}