/**
 * Contacts API - Current User
 * Domain-driven API endpoint for accessing the user's contact record
 */
import { createApiHandler, createApiResponse } from '@/lib/api/middleware';
import { 
  getUserByEmail, 
  getUserByAuth0Id, 
  updateUserProfile,
  updateOnboardingStatus
} from '@/lib/airtable/entities/users';

// Force Node.js runtime for Auth0 compatibility
export const runtime = 'nodejs';

export default createApiHandler({
  // GET handler for retrieving current user's contact
  GET: async (req, res, { user, startTime }) => {
    try {
      // First try to fetch by Auth0 ID, then by email
      let contact = await getUserByAuth0Id(user.sub);
      
      if (!contact && user.email) {
        contact = await getUserByEmail(user.email);
      }
      
      // If no contact found, return basic user info
      if (!contact) {
        return res.status(200).json(createApiResponse({
          auth0Id: user.sub,
          email: user.email,
          name: user.name || '',
          firstName: user.given_name || user.name?.split(' ')[0] || '',
          lastName: user.family_name || user.name?.split(' ').slice(1).join(' ') || '',
          picture: user.picture,
          exists: false
        }, startTime));
      }
      
      // Return contact record with standardized fields
      return res.status(200).json(createApiResponse({
        ...contact,
        exists: true
      }, startTime));
    } catch (error) {
      console.error("Error fetching contact:", error);
      throw error;
    }
  },
  
  // PATCH handler for updating contact
  PATCH: async (req, res, { user, startTime }) => {
    try {
      const { contactId, ...updateData } = req.body;
      
      // Validate required fields
      if (!contactId) {
        return res.status(400).json({ 
          error: "Contact ID is required for updates",
          message: "The contact ID must be provided to update a contact record"
        });
      }
      
      // Update contact record
      const updatedContact = await updateUserProfile(contactId, updateData);
      
      // Return updated contact
      return res.status(200).json(createApiResponse({
        ...updatedContact,
        updated: true
      }, startTime));
    } catch (error) {
      console.error("Error updating contact:", error);
      throw error;
    }
  },
  
  // PUT handler (same as PATCH for this endpoint)
  PUT: async (req, res, { user, startTime }) => {
    try {
      const { contactId, ...updateData } = req.body;
      
      // Validate required fields
      if (!contactId) {
        return res.status(400).json({ 
          error: "Contact ID is required for updates",
          message: "The contact ID must be provided to update a contact record"
        });
      }
      
      // Update contact record
      const updatedContact = await updateUserProfile(contactId, updateData);
      
      // Return updated contact
      return res.status(200).json(createApiResponse({
        ...updatedContact,
        updated: true
      }, startTime));
    } catch (error) {
      console.error("Error updating contact:", error);
      throw error;
    }
  },
  
  // POST handler for specific operations
  POST: async (req, res, { user, startTime }) => {
    try {
      const { action, contactId, ...actionData } = req.body;
      
      // Validate required fields
      if (!contactId) {
        return res.status(400).json({ 
          error: "Contact ID is required",
          message: "The contact ID must be provided for this operation"
        });
      }
      
      // Handle different actions
      switch (action) {
        case 'updateOnboarding':
          // Update onboarding status
          if (!actionData.status) {
            return res.status(400).json({ 
              error: "Status is required",
              message: "The onboarding status must be provided"
            });
          }
          
          const result = await updateOnboardingStatus(contactId, actionData.status);
          return res.status(200).json(createApiResponse({
            ...result,
            action: 'updateOnboarding',
            updated: true
          }, startTime));
          
        default:
          return res.status(400).json({ 
            error: "Invalid action",
            message: `The action "${action}" is not supported`
          });
      }
    } catch (error) {
      console.error("Error processing contact action:", error);
      throw error;
    }
  }
}, {
  requireAuth: true,
  cors: false,
  cacheControl: 'private, max-age=0, no-cache, no-store, must-revalidate'
});