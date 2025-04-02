/**
 * Cohort Details API
 * Domain-driven API endpoint for accessing a specific cohort
 */
import { createApiHandler, createApiResponse } from '@/lib/api/middleware';
import { getCohortById } from '@/lib/airtable/entities/cohorts';

// Force Node.js runtime for Auth0 compatibility
export const runtime = 'nodejs';

export default createApiHandler({
  // GET handler for retrieving a specific cohort
  GET: async (req, res, { startTime }) => {
    try {
      const { cohortId } = req.query;
      
      // Validate cohort ID
      if (!cohortId) {
        return res.status(400).json({ 
          error: "Cohort ID is required",
          message: "Please provide a cohort ID"
        });
      }
      
      // Get cohort details
      const cohort = await getCohortById(cohortId);
      
      // If cohort not found, return 404
      if (!cohort) {
        return res.status(404).json(createApiResponse({
          error: "Cohort not found",
          message: `No cohort found with ID: ${cohortId}`
        }, startTime));
      }
      
      // Return cohort details
      return res.status(200).json(createApiResponse({
        cohort
      }, startTime));
    } catch (error) {
      console.error(`Error fetching cohort ${req.query.cohortId}:`, error);
      throw error;
    }
  }
}, {
  // Public endpoint for cohort details
  requireAuth: false,
  cors: true,
  // Allow caching for a moderate time since cohort details change infrequently
  cacheControl: 'public, max-age=600, s-maxage=1200'
});