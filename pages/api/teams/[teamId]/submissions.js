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
    // Per Airtable schema, Team and Milestone are multipleRecordLinks fields
    // We need to check if one of the linked records matches our ID
    let filterFormula = `FIND("${teamId}", ARRAYJOIN(Team))`;
    
    // Add milestone filter if provided
    if (milestoneId) {
      filterFormula = `AND(${filterFormula}, FIND("${milestoneId}", ARRAYJOIN(Milestone)))`;
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
    const submissions = records.map(record => {
      // Get milestone ID from the linked record
      const milestoneId = record.fields.Milestone && Array.isArray(record.fields.Milestone) && record.fields.Milestone.length > 0
        ? record.fields.Milestone[0]
        : null;

      // Get team IDs from linked records - we already know one matches our teamId
      const teamIds = record.fields.Team && Array.isArray(record.fields.Team)
        ? record.fields.Team
        : [teamId];

      return {
        id: record.id,
        teamId: teamId,
        teamIds: teamIds,
        milestoneId: milestoneId,
        milestoneName: record.fields["Name (from Milestone)"]?.[0] || null,
        deliverableId: record.fields.Deliverable?.[0] || null,
        deliverableName: record.fields["Name (from Deliverable)"]?.[0] || null, 
        createdTime: record.fields["Created Time"] || new Date().toISOString(),
        attachment: record.fields.Attachment,
        comments: record.fields.Comments,
        link: record.fields.Link
      };
    });
    
    // Add diagnostic logging before returning
    if (submissions.length > 0) {
      console.log("First submission details:", {
        id: submissions[0].id,
        teamId: submissions[0].teamId,
        milestoneId: submissions[0].milestoneId,
        milestoneName: submissions[0].milestoneName,
        hasAttachment: !!submissions[0].attachment,
        hasComments: !!submissions[0].comments,
        hasLink: !!submissions[0].link
      });
    }
    
    // If debugging is needed, uncomment this to see the raw Airtable response
    // if (records.length > 0) {
    //   console.log("Raw Airtable record sample:", JSON.stringify(records[0], null, 2));
    // }
    
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