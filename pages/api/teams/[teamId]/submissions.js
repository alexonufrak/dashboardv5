import { base, batchFetchRecords, CACHE_TYPES, createCacheKey } from "@/lib/airtable"

/**
 * API endpoint to get submissions for a specific team
 * Optimized with throttling, caching, and improved error handling
 * 
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 */
export default async function handler(req, res) {
  try {
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
      return res.status(200).json({ submissions: [] });
    }
    
    // Construct the query formula
    let formula;
    if (milestoneId) {
      formula = `AND(
        FIND("${teamId}", {teamId}),
        FIND("${milestoneId}", {milestoneId})
      )`;
    } else {
      formula = `FIND("${teamId}", {teamId})`;
    }
    
    console.log(`Using Airtable formula: ${formula}`);
    
    // Create a structured cache key using the new system
    // This replaces the old string concatenation approach with a more predictable system
    const queryParams = { 
      filterByFormula: formula,
      sort: [{ field: "Created Time", direction: "desc" }]
    };
    
    // Use batchFetchRecords which handles caching, throttling and pagination
    const records = await batchFetchRecords(
      submissionsTableId, 
      {
        filterByFormula: formula,
        fields: [
          'teamId', 'milestoneId', 'Team', 'Milestone', 
          'Comments', 'Link', 'Attachment', 'Created Time', 
          'Name (from Milestone)'
        ],
        sort: [{ field: "Created Time", direction: "desc" }]
      },
      // Pass the cache type and ID for structured caching
      CACHE_TYPES.SUBMISSIONS,
      milestoneId ? `${teamId}-${milestoneId}` : teamId
    );
    
    console.log(`Found ${records.length} total submissions for team ${teamId}`);
    
    // Log field names from the first record if available (for debugging)
    if (records.length > 0) {
      // Safely log team and milestone fields
      const team = records[0].fields.Team ? JSON.stringify(records[0].fields.Team) : "undefined";
      const milestone = records[0].fields.Milestone ? JSON.stringify(records[0].fields.Milestone) : "undefined";
      console.log(`First record - Team: ${team}, Milestone: ${milestone}`);
    }
    
    // Process the filtered submissions - preserve all functionality from the original implementation
    const submissions = records.map(record => {
      // Get milestone ID from the linked record
      const recordMilestoneId = record.fields.Milestone && 
        Array.isArray(record.fields.Milestone) && 
        record.fields.Milestone.length > 0
          ? record.fields.Milestone[0]
          : null;

      // Get team IDs from linked records - we already know one matches our teamId
      const teamIds = record.fields.Team && Array.isArray(record.fields.Team)
        ? record.fields.Team
        : [teamId];

      // Process attachments from Airtable format
      let attachments = [];
      if (record.fields.Attachment && Array.isArray(record.fields.Attachment)) {
        attachments = record.fields.Attachment.map(file => ({
          id: file.id,
          url: file.url,
          filename: file.filename,
          size: file.size,
          type: file.type,
          thumbnails: file.thumbnails
        }));
      }

      return {
        id: record.id,
        teamId: teamId,
        teamIds: teamIds,
        milestoneId: recordMilestoneId,
        milestoneName: record.fields["Name (from Milestone)"]?.[0] || null,
        createdTime: record.fields["Created Time"] || new Date().toISOString(),
        attachments: attachments,
        comments: record.fields.Comments,
        link: record.fields.Link
      };
    });
    
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
    
    // Enhanced caching strategy
    // - Client-side cache for 5 minutes (300 seconds)
    // - Edge/CDN cache for 10 minutes (600 seconds)
    // - Stale-while-revalidate for 30 minutes (1800 seconds)
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=1800');
    
    // Return the submissions with the same response structure as before
    return res.status(200).json({
      submissions,
      meta: {
        count: submissions.length,
        filters: {
          teamId,
          milestoneId: milestoneId || null
        },
        timestamp: new Date().toISOString(),
        cached: true // Indicate this may be cached data
      }
    });
  } catch (error) {
    console.error("Error in submissions endpoint:", error);
    
    // Add Retry-After header for rate limit errors
    if (error.statusCode === 429) {
      res.setHeader('Retry-After', '10'); // Suggest client retry after 10 seconds
      console.warn('Rate limit exceeded in submissions endpoint. Adding Retry-After header.');
    }
    
    // Return empty array rather than an error to prevent UI issues
    return res.status(200).json({ 
      submissions: [],
      meta: {
        error: true,
        message: "An error occurred retrieving submissions",
        timestamp: new Date().toISOString()
      }
    });
  }
}