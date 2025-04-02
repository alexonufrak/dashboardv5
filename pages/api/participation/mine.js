/**
 * Participation API - Current User
 * Domain-driven API endpoint for accessing user's participation records
 */
import { createApiHandler, createApiResponse } from '@/lib/api/middleware';
import { getUserByEmail, getUserByAuth0Id } from '@/lib/airtable/entities/users';
import { 
  getParticipationRecords, 
  createParticipationRecord
} from '@/lib/airtable/entities/participation';

// Force Node.js runtime for Auth0 compatibility
export const runtime = 'nodejs';

export default createApiHandler({
  // GET handler for retrieving participation records
  GET: async (req, res, { user, startTime }) => {
    try {
      // First we need to get the user's contact to get the contactId
      let contact = await getUserByAuth0Id(user.sub);
      
      if (!contact && user.email) {
        contact = await getUserByEmail(user.email);
      }
      
      // If no contact found, return empty array
      if (!contact) {
        return res.status(200).json(createApiResponse({
          participation: [],
          hasParticipation: false,
          message: "User contact record not found"
        }, startTime));
      }
      
      // Get participation records for the contact
      const participationRecords = await getParticipationRecords(contact.contactId);
      
      // Return participation records
      return res.status(200).json(createApiResponse({
        participation: participationRecords,
        hasParticipation: participationRecords.length > 0,
        contactId: contact.contactId
      }, startTime));
    } catch (error) {
      console.error("Error fetching participation records:", error);
      throw error;
    }
  },
  
  // POST handler for creating a new participation record
  POST: async (req, res, { user, startTime }) => {
    try {
      const { cohortId, teamId, status, capacity } = req.body;
      
      // Validate required fields
      if (!cohortId) {
        return res.status(400).json({ 
          error: "Cohort ID is required",
          message: "The cohort ID must be provided to create a participation record"
        });
      }
      
      // Get the user's contact
      let contact = await getUserByAuth0Id(user.sub);
      
      if (!contact && user.email) {
        contact = await getUserByEmail(user.email);
      }
      
      // If no contact found, return error
      if (!contact) {
        return res.status(404).json({ 
          error: "Contact not found",
          message: "User contact record not found in database"
        });
      }
      
      // Create the participation record
      const result = await createParticipationRecord({
        contactId: contact.contactId,
        cohortId,
        teamId,
        status: status || "Active",
        capacity: capacity || "Participant"
      });
      
      // Return the created record
      return res.status(201).json(createApiResponse({
        participation: result,
        created: true,
        contactId: contact.contactId
      }, startTime));
    } catch (error) {
      console.error("Error creating participation record:", error);
      throw error;
    }
  }
}, {
  requireAuth: true,
  cors: false,
  cacheControl: 'private, max-age=0, no-cache, no-store, must-revalidate'
});