import { auth0 } from "@/lib/auth0"
import { batchFetchRecords, getCachedOrFetch } from "@/lib/airtable"

/**
 * API endpoint to get milestones for a specific cohort
 * Optimized with throttling, caching, and improved error handling
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 */
export default async function handler(req, res) {
  try {
    // Record start time for performance measurement
    const startTime = Date.now();
    
    // Get the current session and user using Auth0 v4
    const session = await auth0.getSession(req)
    if (!session?.user) {
      return res.status(401).json({ error: "Not authenticated" })
    }
    
    // Get cohort ID from the route
    const { cohortId } = req.query
    if (!cohortId) {
      return res.status(400).json({ error: "Cohort ID is required" })
    }
    
    // Get the Milestone and Cohort table IDs from environment variables
    const milestonesTableId = process.env.AIRTABLE_MILESTONES_TABLE_ID
    const cohortsTableId = process.env.AIRTABLE_COHORTS_TABLE_ID
    if (!milestonesTableId) {
      return res.status(500).json({ error: "Milestones table not configured" })
    }
    
    // Create cohort-specific cache key
    const cacheKey = `milestones_${cohortId}`;
    
    // Use getCachedOrFetch for optimal caching with throttling
    const milestonesData = await getCachedOrFetch(
      cacheKey,
      async () => {
        console.log(`Cache miss: Fetching milestones for cohort: ${cohortId}`);
        
        // Fetch cohort data first to get milestone links if available
        let milestones = [];
        
        if (cohortsTableId) {
          try {
            // Use batchFetchRecords for cohort lookup
            const cohortRecords = await batchFetchRecords(cohortsTableId, {
              filterByFormula: `RECORD_ID()="${cohortId}"`,
              fields: ['Milestones']
            });
            
            if (cohortRecords.length > 0) {
              const cohort = cohortRecords[0];
              
              if (cohort && cohort.fields.Milestones && Array.isArray(cohort.fields.Milestones)) {
                const milestoneIds = cohort.fields.Milestones;
                console.log(`Found ${milestoneIds.length} milestone links in cohort record`);
                
                if (milestoneIds.length > 0) {
                  // Batch fetch all milestone records at once
                  // Build the formula for a single query instead of multiple calls
                  const idConditions = milestoneIds
                    .map(id => `RECORD_ID()="${id}"`)
                    .join(',');
                  
                  const formula = `OR(${idConditions})`;
                  
                  // Fetch all milestone records in a single batch
                  const milestoneRecords = await batchFetchRecords(milestonesTableId, {
                    filterByFormula: formula,
                    sort: [{ field: 'Number', direction: 'asc' }],
                    fields: [
                      'Name', 'Number', 'Due Datetime', 'Description',
                      'Cohort', 'Due Accuracy'
                    ]
                  });
                  
                  milestones = milestoneRecords;
                  console.log(`Found ${milestones.length} milestones from cohort's Milestones field`);
                }
              }
            }
          } catch (error) {
            console.error("Error fetching milestones from cohort record:", error);
          }
        }
        
        // If no milestones found via cohort links, try direct lookup by cohortId field
        if (milestones.length === 0) {
          try {
            // Use batchFetchRecords for milestones lookup by cohortId
            milestones = await batchFetchRecords(milestonesTableId, {
              filterByFormula: `FIND("${cohortId}", {cohortId})`,
              sort: [{ field: 'Number', direction: 'asc' }],
              fields: [
                'Name', 'Number', 'Due Datetime', 'Description',
                'Cohort', 'Due Accuracy'
              ]
            });
            
            console.log(`Found ${milestones.length} milestones using exact Cohort field lookup`);
          } catch (error) {
            console.error("Error fetching milestones directly:", error);
            milestones = [];
          }
        }
        
        // Process milestone data into consistent format
        const formattedMilestones = milestones.map(milestone => {
          // Determine milestone status based on due date
          let status = "upcoming";
          let progress = 0;
          let completedDate = null;
          let score = null;
          
          // Safely check if milestone is past due
          try {
            const dueDate = milestone.fields["Due Datetime"];
            if (dueDate) {
              const now = new Date();
              const milestoneDate = new Date(dueDate);
              
              if (milestoneDate < now) {
                status = "late";
              }
            }
          } catch (dateError) {
            console.error("Error checking milestone due date:", dateError);
            status = "upcoming"; // Default to upcoming if date comparison fails
          }
          
          return {
            id: milestone.id,
            name: milestone.fields.Name || `Milestone ${milestone.fields.Number}`,
            number: milestone.fields.Number,
            dueDate: milestone.fields["Due Datetime"],
            description: milestone.fields.Description,
            status,
            progress,
            type: milestone.fields["Due Accuracy"],
            completedDate: completedDate ? completedDate.toISOString() : null,
            score
          };
        });
        
        // Calculate processing time
        const processingTime = Date.now() - startTime;
        
        // Return data for caching
        return {
          milestones: formattedMilestones,
          _meta: {
            timestamp: new Date().toISOString(),
            cohortId,
            count: formattedMilestones.length,
            processingTime,
            cached: false
          }
        };
      },
      // Longer TTL (15 minutes) since milestone data rarely changes
      900
    );
    
    // Enhanced cache control headers - milestones rarely change
    // Cache for 5 minutes client-side, 15 minutes server-side, stale-while-revalidate for 60 minutes
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=900, stale-while-revalidate=3600');
    
    // Calculate total processing time including cache operations
    const totalTime = Date.now() - startTime;
    
    // Return milestone data with updated metadata
    return res.status(200).json({
      ...milestonesData,
      _meta: {
        ...(milestonesData._meta || {}),
        totalProcessingTime: totalTime,
        cached: true
      }
    });
  } catch (error) {
    console.error("Error fetching milestones:", error);
    
    // Handle rate limiting errors gracefully
    if (error.statusCode === 429) {
      res.setHeader('Retry-After', '10');
      return res.status(200).json({
        milestones: [],
        _meta: {
          error: "Rate limit exceeded. Please try again later.",
          rateLimited: true,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    return res.status(500).json({ 
      error: "Failed to fetch milestones", 
      details: error.message,
      milestones: []
    });
  }
}