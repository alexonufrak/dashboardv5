/**
 * Contact Check API
 * Domain-driven API endpoint for checking if a contact exists by email
 */
import { createApiHandler, createApiResponse } from '@/lib/api/middleware';
import { checkUserExists } from '@/lib/airtable/entities/users';

// Force Node.js runtime for Auth0 compatibility
export const runtime = 'nodejs';

export default createApiHandler({
  // GET handler for checking if a contact exists
  GET: async (req, res, { startTime }) => {
    try {
      const { email } = req.query;
      
      // Validate email parameter
      if (!email) {
        return res.status(400).json(createApiResponse({
          error: "Email parameter is required",
          exists: false
        }, startTime));
      }
      
      // Check if user exists by email
      const exists = await checkUserExists(email);
      
      // Return result
      return res.status(200).json(createApiResponse({
        email,
        exists
      }, startTime));
    } catch (error) {
      console.error("Error checking contact existence:", error);
      throw error;
    }
  }
}, {
  // This endpoint doesn't require authentication
  requireAuth: false,
  cors: true,
  // Allow caching for a short time
  cacheControl: 'private, max-age=60, must-revalidate'
});