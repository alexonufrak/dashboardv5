import { base } from "@/lib/airtable"

/**
 * API endpoint to get submissions for a specific team
 * Simplified to efficiently fetch and filter by milestone
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
    
    // Initialize the submissions table
    const submissionsTable = base(submissionsTableId);
    
    // Build the filter formula based on the provided parameters
    let filterFormula = `{Team}="${teamId}"`;
    
    // Add milestone filter if provided
    if (milestoneId) {
      filterFormula = `AND(${filterFormula}, {Milestone}="${milestoneId}")`;
    }
    
    console.log(`Using filter formula: ${filterFormula}`);
    
    // Query the submissions table
    const records = await submissionsTable
      .select({
        filterByFormula: filterFormula,
        // Sort by created time in descending order to get the most recent first
        sort: [{ field: "Created Time", direction: "desc" }]
      })
      .firstPage();
    
    console.log(`Found ${records.length} submissions for team ID: ${teamId}${milestoneId ? ` and milestone ID: ${milestoneId}` : ''}`);
    
    // Process the submissions
    const submissions = records.map(record => ({
      id: record.id,
      teamId: teamId,
      milestoneId: record.fields.Milestone?.[0] || null,
      createdTime: record.fields["Created Time"] || new Date().toISOString(),
      attachment: record.fields.Attachment,
      comments: record.fields.Comments,
      link: record.fields.Link
    }));
    
    // Add diagnostic logging before returning
    if (submissions.length > 0) {
      console.log("First submission details:", {
        id: submissions[0].id,
        teamId: submissions[0].teamId,
        milestoneId: submissions[0].milestoneId,
        hasAttachment: !!submissions[0].attachment,
        hasComments: !!submissions[0].comments,
        hasLink: !!submissions[0].link
      });
    }
    
    // Return the submissions we found
    return res.status(200).json({
      submissions,
      meta: {
        count: submissions.length,
        filters: {
          teamId,
          milestoneId: milestoneId || null
        }
      }
    });
  } catch (error) {
    console.error("Error in submissions endpoint:", error);
    // Return empty array rather than an error to prevent UI issues
    return res.status(200).json({ 
      submissions: []
    });
  }
}