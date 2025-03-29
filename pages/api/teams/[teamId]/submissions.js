import { base } from "@/lib/airtable"
import { auth0 } from "@/lib/auth0"

/**
 * API endpoint to get submissions for a specific team
 * Simplified implementation with consistent response format and HTTP caching
 * 
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 */
async function handlerImpl(req, res) {
  try {
    // Start timer for performance monitoring
    const startTime = Date.now();
    
    // Get team ID and milestone ID from the query
    const { teamId, milestoneId } = req.query
    
    console.log(`Fetching submissions for teamId=${teamId}, milestoneId=${milestoneId}`);
    
    // Validate required parameters
    if (!teamId) {
      return res.status(400).json({ error: "Team ID is required" });
    }
    
    // Get the Submissions table ID from environment variables
    const submissionsTableId = process.env.AIRTABLE_SUBMISSIONS_TABLE_ID;
    if (!submissionsTableId) {
      console.error("Submissions table ID not configured");
      return res.status(200).json({ 
        submissions: [],
        meta: {
          error: true,
          message: "Submissions table ID not configured",
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Get the submission table
    const submissionsTable = base(submissionsTableId);
    
    // Sanitize inputs to prevent formula injection
    const safeTeamId = teamId.replace(/["'\\]/g, '');
    const safeMilestoneId = milestoneId ? milestoneId.replace(/["'\\]/g, '') : null;
    
    // Construct the query formula
    let formula;
    if (safeMilestoneId) {
      formula = `AND(
        FIND("${safeTeamId}", {teamId}),
        FIND("${safeMilestoneId}", {milestoneId})
      )`;
    } else {
      formula = `FIND("${safeTeamId}", {teamId})`;
    }
    
    console.log(`Using Airtable formula: ${formula}`);
    
    // Query parameters
    const queryParams = {
      filterByFormula: formula,
      fields: [
        'teamId', 'milestoneId', 'Team', 'Milestone', 
        'Comments', 'Link', 'Attachment', 'Created Time', 
        'Name (from Milestone)'
      ],
      sort: [{ field: "Created Time", direction: "desc" }]
    };
    
    // Fetch records directly from Airtable
    // This allows client-side caching to be the source of truth
    const records = await submissionsTable.select(queryParams).all();
    
    console.log(`Found ${records.length} total submissions for team ${teamId}`);
    
    // Log field names from the first record if available (for debugging)
    if (records.length > 0) {
      // Safely log team and milestone fields
      const team = records[0].fields.Team ? JSON.stringify(records[0].fields.Team) : "undefined";
      const milestone = records[0].fields.Milestone ? JSON.stringify(records[0].fields.Milestone) : "undefined";
      console.log(`First record - Team: ${team}, Milestone: ${milestone}`);
    }
    
    // Process the submissions with a standardized format
    const submissions = records.map(record => {
      try {
        // Get milestone ID from the linked record - enforce consistent format
        const recordMilestoneId = record.fields.Milestone && 
          Array.isArray(record.fields.Milestone) && 
          record.fields.Milestone.length > 0
            ? record.fields.Milestone[0]
            : null;

        // Get team IDs from linked records - enforce consistent format
        const teamIds = record.fields.Team && Array.isArray(record.fields.Team)
          ? record.fields.Team
          : [teamId];

        // Process attachments from Airtable format - ensure valid attachments only
        let attachments = [];
        if (record.fields.Attachment && Array.isArray(record.fields.Attachment)) {
          attachments = record.fields.Attachment
            .filter(file => file && file.url) // Only include valid attachments
            .map(file => ({
              id: file.id || `att_${Date.now()}`, // Ensure ID exists
              url: file.url,
              filename: file.filename || 'attachment',
              size: file.size || 0,
              type: file.type || 'application/octet-stream',
              thumbnails: file.thumbnails || null
            }));
        }

        // Process date with validation
        let createdTime = record.fields["Created Time"];
        if (!createdTime) {
          createdTime = new Date().toISOString();
        } else {
          // Ensure valid ISO format
          try {
            const date = new Date(createdTime);
            if (isNaN(date.getTime())) {
              createdTime = new Date().toISOString();
            }
          } catch (e) {
            createdTime = new Date().toISOString();
          }
        }

        // Return standardized submission object
        return {
          id: record.id,
          teamId: teamId,
          teamIds: teamIds, 
          milestoneId: recordMilestoneId,
          milestoneName: record.fields["Name (from Milestone)"]?.[0] || null,
          createdTime: createdTime,
          attachments: attachments,
          comments: record.fields.Comments || "",
          link: record.fields.Link || ""
        };
      } catch (recordError) {
        // Handle individual record processing errors
        console.error(`Error processing submission record ${record.id}:`, recordError);
        
        // Return partial record with error flag
        return {
          id: record.id,
          teamId: teamId,
          error: true,
          errorMessage: recordError.message
        };
      }
    })
    .filter(submission => !submission.error); // Filter out failed records
    
    // Add diagnostic logging for the first submission
    if (submissions.length > 0) {
      console.log("First submission details:", {
        id: submissions[0].id,
        teamId: submissions[0].teamId,
        milestoneId: submissions[0].milestoneId,
        milestoneName: submissions[0].milestoneName,
        attachments: submissions[0].attachments.length,
        hasComments: !!submissions[0].comments,
        hasLink: !!submissions[0].link
      });
    }
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Set cache control headers for client-side caching
    // Private: Only browser should cache, not CDNs
    // max-age: Cache for 3 minutes
    // must-revalidate: Check with server before using stale data
    res.setHeader('Cache-Control', 'private, max-age=180, must-revalidate');
    
    // Return the submissions with enhanced metadata
    return res.status(200).json({
      submissions,
      meta: {
        count: submissions.length,
        filters: {
          teamId,
          milestoneId: milestoneId || null
        },
        timestamp: new Date().toISOString(),
        processingTime: `${processingTime}ms`,
        requestId: `req_${Date.now().toString(36)}`
      }
    });
  } catch (error) {
    console.error("Error in submissions endpoint:", error);
    
    // Add specific error information for better debugging
    let errorCode = "UNKNOWN_ERROR";
    let errorMessage = "An error occurred retrieving submissions";
    let status = 200; // Default to 200 to prevent UI issues
    
    // Handle specific error types
    if (error.statusCode === 429) {
      // Rate limit error
      errorCode = "RATE_LIMIT_EXCEEDED";
      errorMessage = "Rate limit exceeded. Please try again later.";
      res.setHeader('Retry-After', '10'); // Suggest client retry after 10 seconds
      console.warn('Rate limit exceeded in submissions endpoint. Adding Retry-After header.');
    } else if (error.message && error.message.includes("authentication")) {
      // Authentication error
      errorCode = "AUTHENTICATION_ERROR";
      errorMessage = "Authentication error with Airtable API.";
    } else if (error.message && error.message.includes("permission")) {
      // Permission error
      errorCode = "PERMISSION_ERROR";
      errorMessage = "Permission error accessing Airtable data.";
    } else if (error.message && error.message.includes("network")) {
      // Network error
      errorCode = "NETWORK_ERROR";
      errorMessage = "Network error connecting to Airtable API.";
    }
    
    // Return standardized error response
    return res.status(status).json({ 
      submissions: [],
      meta: {
        error: true,
        errorCode,
        errorMessage,
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now().toString(36)}`
      }
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