import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0"
import { getUserProfile, getParticipationRecords } from "@/lib/airtable"

/**
 * API endpoint to get a user's active program participation
 * Using the optimized getParticipationRecords function while maintaining
 * backward compatibility with existing data structure
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 */
export default withApiAuthRequired(async function handler(req, res) {
  try {
    // Record start time for performance measurement
    const startTime = Date.now();
    
    // Get the current session and user
    const session = await getSession(req, res)
    if (!session?.user) {
      return res.status(401).json({ error: "Not authenticated" })
    }
    
    // Add timeout control
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Participation fetch timed out")), 9000)
    );
    
    // Get the user profile using the email with timeout
    let profile = null;
    try {
      profile = await Promise.race([
        getUserProfile(null, session.user.email),
        timeoutPromise
      ]);
      
      if (!profile || !profile.contactId) {
        console.warn("User profile not found or missing contactId");
        return res.status(200).json({ 
          participation: [],
          hasData: false,
          recordCount: 0,
          _meta: {
            error: "User profile not found",
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (profileError) {
      console.error("Error fetching user profile:", profileError);
      return res.status(200).json({ 
        participation: [],
        hasData: false,
        recordCount: 0,
        _meta: {
          error: profileError.message,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    console.log(`Looking up participation for contact ID: "${profile.contactId}"`)
    
    // Use our optimized getParticipationRecords function with timeout
    let enhancedRecords = [];
    try {
      enhancedRecords = await Promise.race([
        getParticipationRecords(profile.contactId),
        new Promise((_, reject) => setTimeout(() => 
          reject(new Error("Participation records fetch timed out")), 8000))
      ]);
      console.log(`Retrieved ${enhancedRecords.length} participation records`);
    } catch (participationError) {
      console.error("Error fetching participation records:", participationError);
      enhancedRecords = [];
    }
    
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
          // Add participationType directly to cohort for backward compatibility
          participationType: record.initiative ? record.initiative["Participation Type"] : "Individual"
        },
        // Extract teamId from team object for backward compatibility
        teamId: record.team ? record.team.id : null,
        // Keep recordFields for reference
        recordFields: record.recordFields || {}
      };
    });
    
    // Calculate total processing time
    const processingTime = Date.now() - startTime;
    console.log(`Successfully processed ${processedParticipation.length} participation records in ${processingTime}ms`);
    
    // Set cache control headers for better performance
    // Cache for 5 minutes server-side, 1 minute client-side
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    
    // Return the transformed participation records in the same format as before
    return res.status(200).json({
      participation: processedParticipation,
      _meta: {
        processingTime,
        timestamp: new Date().toISOString(),
        count: processedParticipation.length
      }
    });
  } catch (error) {
    console.error("Error fetching participation:", error);
    return res.status(500).json({ error: "Failed to fetch participation", details: error.message });
  }
})