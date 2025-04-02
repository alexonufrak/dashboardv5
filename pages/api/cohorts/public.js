/**
 * Public Cohorts API
 * Domain-driven API endpoint for accessing public cohorts
 */
import { createApiHandler, createApiResponse } from '@/lib/api/middleware';
import { getPublicCohorts, getCurrentCohorts } from '@/lib/airtable/entities/cohorts';

// Force Node.js runtime for Auth0 compatibility
export const runtime = 'nodejs';

export default createApiHandler({
  // GET handler for retrieving public cohorts
  GET: async (req, res, { startTime }) => {
    try {
      const { current } = req.query;
      
      // Either get all public cohorts or only current ones
      const cohorts = current === 'true' 
        ? await getCurrentCohorts()
        : await getPublicCohorts();
      
      // Return cohorts
      return res.status(200).json(createApiResponse({
        cohorts,
        count: cohorts.length
      }, startTime));
    } catch (error) {
      console.error("Error fetching public cohorts:", error);
      throw error;
    }
  }
}, {
  // Public endpoint, no authentication required
  requireAuth: false,
  cors: true,
  // Allow caching for short time since these don't change often
  cacheControl: 'public, max-age=300, s-maxage=600'
});