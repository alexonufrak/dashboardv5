/**
 * User Lookup API
 * Handles advanced user lookup operations via various identifiers
 */
import { createApiHandler, createApiResponse } from '@/lib/api/middleware';
import usersModule from '@/lib/airtable/entities/users';
import { 
  getUserByEmail, 
  getUserByAuth0Id
} from '@/lib/airtable/entities/users';

// Force Node.js runtime for Auth0 compatibility
export const runtime = 'nodejs';

export default createApiHandler({
  // POST handler for finding users by different identifiers
  POST: async (req, res, { user, startTime }) => {
    try {
      const { identifiers } = req.body;
      
      if (!identifiers) {
        return res.status(400).json({ 
          error: "Missing identifiers",
          message: "You must provide at least one identifier (email, auth0Id, or contactId)"
        });
      }
      
      // Use optimized function to find user by any identifiers
      const foundUser = await usersModule.findUserByAnyIdentifier(identifiers);
      
      // Return appropriate response
      if (!foundUser) {
        return res.status(404).json(createApiResponse({
          message: "User not found",
          identifiers,
          found: false
        }, startTime));
      }
      
      return res.status(200).json(createApiResponse({
        data: foundUser,
        found: true
      }, startTime));
    } catch (error) {
      console.error("Error in user lookup:", error);
      throw error;
    }
  },
  
  // GET handler for finding users by email or Auth0 ID
  GET: async (req, res, { user, startTime }) => {
    try {
      const { email, auth0Id, contactId } = req.query;
      
      if (!email && !auth0Id && !contactId) {
        return res.status(400).json({ 
          error: "Missing identifier",
          message: "You must provide an email, auth0Id, or contactId"
        });
      }
      
      let foundUser = null;
      
      // Try to find user by the provided identifier, prioritizing email
      if (email) {
        foundUser = await getUserByEmail(email);
        
        // If email lookup fails, try finding via linked records
        if (!foundUser) {
          try {
            foundUser = await usersModule.findUserViaLinkedRecords(email);
          } catch (err) {
            console.error("Error finding user via linked records:", err);
          }
        }
      } 
      else if (auth0Id) {
        foundUser = await getUserByAuth0Id(auth0Id);
      }
      
      // Return appropriate response
      if (!foundUser) {
        return res.status(404).json(createApiResponse({
          message: "User not found",
          identifier: email || auth0Id || contactId,
          found: false
        }, startTime));
      }
      
      return res.status(200).json(createApiResponse({
        data: foundUser,
        found: true
      }, startTime));
    } catch (error) {
      console.error("Error in user lookup:", error);
      throw error;
    }
  }
}, {
  requireAuth: true,
  cors: false,
  cacheControl: 'private, max-age=0, no-cache, no-store, must-revalidate'
});