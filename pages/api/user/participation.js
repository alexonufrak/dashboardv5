import { auth0 } from "@/lib/auth0"
import { getUserProfile, getParticipationRecords, getCachedOrFetch } from "@/lib/airtable"

/**
 * API endpoint to get a user's active program participation
 * Enhanced version with optimal caching, throttling and rate limiting
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
    
    // Create request-specific cache key based on user email
    // This allows per-user caching for better performance
    const userEmail = session.user.email;
    const cacheKey = `participation_${userEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    // Use getCachedOrFetch for optimal caching with throttling
    // This will automatically handle 429 rate limit errors and caching
    const participationData = await getCachedOrFetch(
      cacheKey,
      async () => {
        console.log(`Cache miss: Fetching participation data for ${userEmail}`);
        
        // Get user profile - wrapped in timeout for safety
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("User profile fetch timed out")), 8000)
        );
        
        const profile = await Promise.race([
          getUserProfile(null, userEmail),
          timeoutPromise
        ]);
        
        if (!profile || !profile.contactId) {
          console.warn("User profile not found or missing contactId");
          return { 
            participation: [],
            hasData: false,
            recordCount: 0,
            _meta: {
              error: "User profile not found",
              timestamp: new Date().toISOString()
            }
          };
        }
        
        console.log(`Looking up participation for contact ID: "${profile.contactId}"`);
        
        // Fetch participation records with timeout
        const recordsTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Participation records fetch timed out")), 8000)
        );
        
        // Use our optimized getParticipationRecords function with timeout
        const enhancedRecords = await Promise.race([
          getParticipationRecords(profile.contactId),
          recordsTimeoutPromise
        ]);
        
        console.log(`Retrieved ${enhancedRecords.length} participation records`);
        
        // Transform the enhanced records to maintain backward compatibility
        const processedParticipation = enhancedRecords.map(record => {
          // Map new data structure to old format for backward compatibility
          return {
            id: record.id,
            recordId: record.id,
            status: record.status,
            capacity: record.capacity,
            cohort: {
              id: record.cohort.id,
              name: record.cohort.name,
              Short_Name: record.cohort.shortName,  // Map new camelCase to old format
              Status: record.cohort.status,
              "Start Date": record.cohort.startDate,
              "End Date": record.cohort.endDate,
              "Current Cohort": record.cohort.isCurrent,
              // Move initiative from top-level to cohort.initiativeDetails for backward compatibility
              initiativeDetails: record.initiative ? {
                id: record.initiative.id,
                name: record.initiative.name,
                description: record.initiative.description,
                "Participation Type": record.initiative["Participation Type"]
              } : null,
              // Include topic names if available
              topicNames: record.cohort.topicNames || [],
              // Include class names if available
              classNames: record.cohort.classNames || [],
              // Add participationType directly to cohort for backward compatibility
              participationType: record.initiative ? record.initiative["Participation Type"] : "Individual"
            },
            // Extract teamId from team object for backward compatibility
            teamId: record.team ? record.team.id : null,
            // Keep recordFields for reference
            recordFields: record.recordFields || {}
          };
        });
        
        // Calculate processing time
        const processingTime = Date.now() - startTime;
        console.log(`Successfully processed ${processedParticipation.length} participation records in ${processingTime}ms`);
        
        // Return data for caching
        return {
          participation: processedParticipation,
          _meta: {
            processingTime,
            timestamp: new Date().toISOString(),
            count: processedParticipation.length,
            cached: false
          }
        };
      },
      // Longer TTL (10 minutes) for participation data since it changes infrequently
      600 
    );
    
    // Set cache headers for client-side caching only, no server-side caching
    // This ensures data is cached in the browser but always fresh on server
    res.setHeader('Cache-Control', 'private, max-age=180, no-store, must-revalidate');
    
    // Add total processing time including cache operations
    const totalTime = Date.now() - startTime;
    
    // Return the participation data with enhanced debugging info
    return res.status(200).json({
      ...participationData,
      _meta: {
        ...(participationData._meta || {}),
        totalProcessingTime: totalTime,
        cached: true,
        timestamp: new Date().toISOString(),
        requestId: `req_${Math.random().toString(36).substring(2, 10)}`,
        userEmail: userEmail,
        recordCount: participationData.participation?.length || 0,
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