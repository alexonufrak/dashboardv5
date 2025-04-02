import { auth0 } from '@/lib/auth0';
import { users } from '@/lib/airtable/entities';

/**
 * API endpoint to handle onboarding completion status - V2 Implementation
 * Uses the domain-driven Airtable architecture from /lib/airtable/entities
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
    
    // Get user from Airtable with email-first lookup strategy
    let userProfile = null;
    
    if (userEmail) {
      // Try email lookup first
      userProfile = await users.getUserByEmail(userEmail);
      
      // If email lookup fails, try finding via linked records
      if (!userProfile) {
        try {
          userProfile = await users.findUserViaLinkedRecords(userEmail);
        } catch (err) {
          console.error("Error finding user via linked records:", err);
        }
      }
    }
    
    // Fallback to Auth0 ID lookup only if email methods failed
    if (!userProfile && userId) {
      userProfile = await users.getUserByAuth0Id(userId);
    }
    
    if (!userProfile || !userProfile.contactId) {
      return res.status(404).json({ error: 'User profile not found in Airtable' });
    }

    const contactId = userProfile.contactId;
    
    // Get onboarding status directly from user entity
    const onboardingStatus = userProfile.onboardingStatus || "Registered";
    const hasParticipation = userProfile.hasParticipation === true;
    const hasApplications = userProfile.applications && userProfile.applications.length > 0;
    
    // Determine if onboarding is completed
    const completed = onboardingStatus === "Applied" || hasParticipation || hasApplications;
    
    // Return the onboarding status
    return res.status(200).json({ 
      completed,
      status: completed ? "Applied" : onboardingStatus,
      userId,
      contactId,
      source: 'airtable-entity-v2'
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
    
    // Get status from request body, default to "Applied"
    const { status = "Applied", contactId: requestContactId } = req.body;
    
    // If contactId is provided in the request, use it directly
    let contactId = requestContactId;
    
    // Otherwise look up the user to get their contactId with email-first strategy
    if (!contactId) {
      let userProfile = null;
      
      if (userEmail) {
        // Try email lookup first
        userProfile = await users.getUserByEmail(userEmail);
        
        // If email lookup fails, try finding via linked records
        if (!userProfile) {
          try {
            userProfile = await users.findUserViaLinkedRecords(userEmail);
          } catch (err) {
            console.error("Error finding user via linked records:", err);
          }
        }
      }
      
      // Fallback to Auth0 ID lookup only if email methods failed
      if (!userProfile && userId) {
        userProfile = await users.getUserByAuth0Id(userId);
      }
      
      if (!userProfile || !userProfile.contactId) {
        return res.status(404).json({ error: 'User profile not found in Airtable' });
      }
      
      contactId = userProfile.contactId;
    }
    
    try {
      // Update the user's onboarding status in Airtable using entity function
      const result = await users.updateOnboardingStatus(contactId, status);
      console.log(`Updated Airtable onboarding status for contact ${contactId}:`, result);
      
      return res.status(200).json({ 
        success: true,
        userId,
        contactId,
        timestamp,
        onboardingStatus: status,
        source: 'airtable-entity-v2'
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