import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import auth0Client from '../../../lib/auth0';
import { getUserProfile, getOnboardingStatus, updateOnboardingStatus } from '../../../lib/airtable';

/**
 * Direct API to check and set onboarding completion status
 * Uses Airtable Contact Onboarding field as the primary source of truth
 * Still updates Auth0 metadata for backwards compatibility
 */
export default withApiAuthRequired(async function onboardingCompleted(req, res) {
  try {
    const session = await getSession(req, res);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = session.user.sub;
    const userEmail = session.user.email;
    
    // First, get the user's Airtable contact record
    const userProfile = await getUserProfile(userId, userEmail);
    
    if (!userProfile || !userProfile.contactId) {
      return res.status(404).json({ error: 'User profile not found in Airtable' });
    }
    
    const contactId = userProfile.contactId;
    
    // GET: Check if onboarding is completed using Airtable as primary source
    if (req.method === 'GET') {
      // Get onboarding status from Airtable
      const airtableStatus = await getOnboardingStatus(contactId);
      
      console.log(`Airtable onboarding status for user ${userId} (contact ${contactId}):`, airtableStatus);
      
      // Set default values if Airtable check fails
      let completed = false;
      let status = "Registered";
      
      if (airtableStatus && !airtableStatus.error) {
        // Use Airtable data (primary source)
        completed = airtableStatus.completed;
        status = airtableStatus.status;
      } else {
        console.warn('Airtable status check failed, falling back to Auth0:', airtableStatus?.error);
        
        // Fall back to Auth0 as secondary source
        try {
          const userData = await auth0Client.getUser({ id: userId });
          
          if (userData && userData.user_metadata) {
            completed = userData.user_metadata.onboardingCompleted === true;
            status = completed ? "Applied" : "Registered";
            
            console.log(`Auth0 fallback for onboarding [user ${userId}]:`, {
              completed,
              onboardingCompleted: userData.user_metadata.onboardingCompleted
            });
            
            // If Auth0 says completed but Airtable failed, update Airtable
            if (completed && contactId) {
              try {
                await updateOnboardingStatus(contactId, "Applied");
                console.log(`Updated Airtable with status from Auth0 for user ${userId}`);
              } catch (syncError) {
                console.error("Failed to sync Auth0 status to Airtable:", syncError);
              }
            }
          }
        } catch (auth0Error) {
          console.warn('Error checking Auth0:', auth0Error.message);
          // Continue with defaults
        }
      }
      
      return res.status(200).json({ 
        completed,
        status,
        userId,
        contactId,
        source: airtableStatus && !airtableStatus.error ? 'airtable' : 'auth0-fallback'
      });
    }
    
    // POST: Mark onboarding as completed - update in both Airtable and Auth0
    if (req.method === 'POST') {
      try {
        const timestamp = new Date().toISOString();
        const results = {
          airtable: null,
          auth0: null
        };
        
        // 1. Update Airtable (primary source)
        try {
          const airtableResult = await updateOnboardingStatus(contactId, "Applied");
          results.airtable = airtableResult;
          console.log(`Updated Airtable onboarding status for contact ${contactId}:`, airtableResult);
        } catch (airtableError) {
          console.error('Error updating Airtable onboarding status:', airtableError);
          results.airtable = { success: false, error: airtableError.message };
        }
        
        // 2. Also update Auth0 for backwards compatibility
        try {
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
          results.auth0 = { success: updateSuccessful, timestamp };
        } catch (auth0Error) {
          console.error('Error updating Auth0 metadata:', auth0Error);
          results.auth0 = { success: false, error: auth0Error.message };
        }
        
        // Consider the operation successful if Airtable (primary) was updated successfully
        const overallSuccess = results.airtable && results.airtable.success;
        
        return res.status(200).json({ 
          success: overallSuccess,
          userId,
          contactId,
          timestamp,
          results
        });
      } catch (error) {
        console.error('Error in onboarding completion update:', error);
        return res.status(500).json({ 
          success: false,
          error: error.message,
          userId,
          contactId
        });
      }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in onboarding completion endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});