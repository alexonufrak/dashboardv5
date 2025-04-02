/**
 * Education API - Current User
 * Domain-driven API endpoint for accessing the user's education record
 */
import { createApiHandler, createApiResponse } from '@/lib/api/middleware';
import { 
  getUserByEmail, 
  getUserByAuth0Id 
} from '@/lib/airtable/entities/users';
import {
  getEducation,
  updateEducation
} from '@/lib/airtable/entities/education';

// Force Node.js runtime for Auth0 compatibility
export const runtime = 'nodejs';

export default createApiHandler({
  // GET handler for retrieving education record
  GET: async (req, res, { user, startTime }) => {
    try {
      // First we need to get the user's contact to determine education relationship
      let contact = await getUserByAuth0Id(user.sub);
      
      if (!contact && user.email) {
        contact = await getUserByEmail(user.email);
      }
      
      // If no contact found, return not found
      if (!contact) {
        return res.status(404).json(createApiResponse({
          error: "Contact not found",
          message: "User contact record not found in database",
          auth0Id: user.sub,
          email: user.email
        }, startTime));
      }
      
      // Check if contact has education record
      if (!contact.education || contact.education.length === 0) {
        return res.status(200).json(createApiResponse({
          contactId: contact.contactId,
          hasEducation: false,
          exists: false
        }, startTime));
      }
      
      // Get education record
      const educationId = contact.education[0]; // Get the first education record
      const education = await getEducation(educationId);
      
      if (!education) {
        return res.status(200).json(createApiResponse({
          contactId: contact.contactId,
          hasEducation: false,
          exists: false,
          educationId: educationId, // Return ID even though record wasn't found
        }, startTime));
      }
      
      // Return education record
      return res.status(200).json(createApiResponse({
        ...education,
        contactId: contact.contactId,
        hasEducation: true,
        exists: true
      }, startTime));
    } catch (error) {
      console.error("Error fetching education:", error);
      throw error;
    }
  },
  
  // PATCH/PUT handler for updating education record
  PATCH: async (req, res, { user, startTime }) => {
    try {
      const { contactId, educationId, ...educationData } = req.body;
      
      // Validate required fields
      if (!contactId) {
        return res.status(400).json({ 
          error: "Contact ID is required",
          message: "The contact ID must be provided to update education"
        });
      }
      
      // Verify user has access to this contact
      let contact = await getUserByAuth0Id(user.sub);
      if (!contact && user.email) {
        contact = await getUserByEmail(user.email);
      }
      
      if (!contact || contact.contactId !== contactId) {
        return res.status(403).json({ 
          error: "Forbidden",
          message: "You do not have permission to update this education record"
        });
      }
      
      // Update or create education record
      const result = await updateEducation({
        educationId,
        contactId,
        ...educationData
      });
      
      // Return updated education
      return res.status(200).json(createApiResponse({
        ...result,
        contactId,
        updated: true
      }, startTime));
    } catch (error) {
      console.error("Error updating education:", error);
      throw error;
    }
  },
  
  // PUT is identical to PATCH for this endpoint
  PUT: async (req, res, { user, startTime }) => {
    try {
      const { contactId, educationId, ...educationData } = req.body;
      
      // Validate required fields
      if (!contactId) {
        return res.status(400).json({ 
          error: "Contact ID is required",
          message: "The contact ID must be provided to update education"
        });
      }
      
      // Verify user has access to this contact
      let contact = await getUserByAuth0Id(user.sub);
      if (!contact && user.email) {
        contact = await getUserByEmail(user.email);
      }
      
      if (!contact || contact.contactId !== contactId) {
        return res.status(403).json({ 
          error: "Forbidden",
          message: "You do not have permission to update this education record"
        });
      }
      
      // Update or create education record
      const result = await updateEducation({
        educationId,
        contactId,
        ...educationData
      });
      
      // Return updated education
      return res.status(200).json(createApiResponse({
        ...result,
        contactId,
        updated: true
      }, startTime));
    } catch (error) {
      console.error("Error updating education:", error);
      throw error;
    }
  }
}, {
  requireAuth: true,
  cors: false,
  cacheControl: 'private, max-age=0, no-cache, no-store, must-revalidate'
});