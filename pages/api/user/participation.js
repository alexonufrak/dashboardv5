import { auth0 } from "@/lib/auth0"
import { participation } from '@/lib/airtable/entities';

/**
 * API endpoint to get a user's active program participation
 * Now uses the new refactored implementation through the entity layer
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 */
async function handlerImpl(req, res) {
  try {
    // Record start time for performance measurement
    const startTime = Date.now();
    
    // Get the current session and user using Auth0 v4
    const session = await auth0.getSession(req, res)
    if (!session?.user) {
      return res.status(401).json({ error: "Not authenticated" })
    }
    
    const { user } = session;
    
    // Use the refactored implementation directly
    // Get participation records for the user using Auth0 ID
    const participationRecords = await participation.getParticipationRecords(user.sub);
    
    // Transform the records to maintain backward compatibility if needed
    const processedParticipation = participationRecords.map(record => {
      // Map new data structure to old format for backward compatibility
      return {
        id: record.id,
        recordId: record.id,
        status: record.status,
        capacity: record.capacity,
        cohort: {
          id: record.cohort?.id,
          name: record.cohort?.name,
          Short_Name: record.cohort?.shortName,
          Status: record.cohort?.status,
          "Start Date": record.cohort?.startDate,
          "End Date": record.cohort?.endDate,
          "Current Cohort": record.cohort?.isCurrent,
          // Move initiative from top-level to cohort.initiativeDetails for backward compatibility
          initiativeDetails: record.initiative ? {
            id: record.initiative.id,
            name: record.initiative.name,
            description: record.initiative.description,
            "Participation Type": record.initiative["Participation Type"]
          } : null,
          // Include topic names if available
          topicNames: record.cohort?.topicNames || [],
          // Include class names if available
          classNames: record.cohort?.classNames || [],
          // Add participationType directly to cohort for backward compatibility
          participationType: record.initiative ? record.initiative["Participation Type"] : "Individual"
        },
        // Extract teamId from team object for backward compatibility
        teamId: record.team ? record.team.id : null,
        // Add team name for convenience
        teamName: record.team ? record.team.name : null,
        // Keep recordFields for reference
        recordFields: record.recordFields || {}
      };
    });
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Set headers to prevent server/CDN caching, allow client caching via TanStack Query
    res.setHeader('Cache-Control', 'private, no-store, must-revalidate');
    
    // Return the participation data with enhanced debugging info
    return res.status(200).json({
      participation: processedParticipation,
      _meta: {
        processingTime,
        timestamp: new Date().toISOString(),
        count: processedParticipation.length,
        cached: false,
        refactored: true,
        requestId: `req_${Math.random().toString(36).substring(2, 10)}`,
        userEmail: user.email,
        recordCount: processedParticipation.length,
        requestHeaders: {
          referer: req.headers.referer || 'unknown',
          'user-agent': req.headers['user-agent'] || 'unknown'
        }
      }
    });
  } catch (error) {
    console.error("Error fetching participation:", error);
    
    // Handle rate limiting errors gracefully
    if (error.statusCode === 429) {
      res.setHeader('Retry-After', '10');
      return res.status(200).json({ 
        participation: [],
        _meta: {
          error: "Rate limit exceeded. Please try again later.", 
          rateLimited: true,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    return res.status(500).json({ 
      error: "Failed to fetch participation", 
      details: error.message,
      participation: []
    });
  }
}

export default async function handler(req, res) {
  try {
    // Check for valid Auth0 session
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Call the original handler with the authenticated session
    return handlerImpl(req, res);
  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}
