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
    
    // We'll fetch all submissions for this team and filter on our side
    // This avoids complex formula issues with Airtable linked records
    console.log(`Fetching all submissions for team: ${teamId}`);
    
    // Query all submissions for the team
    // We use simple formula that should work reliably
    // This code is already optimized to use the dedicated ID fields
    // We're keeping it as is since it already follows the best practice
    let formula;
    
    if (milestoneId) {
      // If we have both team and milestone IDs, check both fields using SEARCH
      formula = `AND(
        SEARCH("${teamId}", {teamId}),
        SEARCH("${milestoneId}", {milestoneId})
      )`;
    } else {
      // If we only have team ID, just check that field using SEARCH
      formula = `SEARCH("${teamId}", {teamId})`;
    }
    
    console.log(`Using advanced Airtable formula: ${formula}`);
    
    // Select only the fields we need to reduce data transfer
    // Remove fields that don't exist in the Airtable schema
    const records = await submissionsTable
      .select({
        filterByFormula: formula,
        fields: ['teamId', 'milestoneId', 'Team', 'Milestone', 'Comments', 'Link', 'Attachment', 'Created Time', 
                'Name (from Milestone)'],
        // Sort by created time in descending order to get the most recent first
        sort: [{ field: "Created Time", direction: "desc" }]
      })
      .firstPage();
      
    console.log(`Found ${records.length} total submissions matching our formula`);
    
    // Log field names from the first record if available
    if (records.length > 0) {
      console.log("Available fields in submission records:", Object.keys(records[0].fields));
      
      // Safely log team and milestone fields
      const team = records[0].fields.Team ? JSON.stringify(records[0].fields.Team) : "undefined";
      const milestone = records[0].fields.Milestone ? JSON.stringify(records[0].fields.Milestone) : "undefined";
      console.log(`First record - Team: ${team}, Milestone: ${milestone}`);
    }
    
    // For optimization, we're directly using the records from Airtable's filtered results
    const filteredRecords = records;
    
    // Process the filtered submissions
    const submissions = filteredRecords.map(record => {
      // Get milestone ID from the linked record
      const recordMilestoneId = record.fields.Milestone && Array.isArray(record.fields.Milestone) && record.fields.Milestone.length > 0
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
        milestoneId: recordMilestoneId,
        milestoneName: record.fields["Name (from Milestone)"]?.[0] || null,
        // Remove deliverable fields that aren't in the schema
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
    
    // Show the raw Airtable response for debugging
    if (records.length > 0) {
      console.log("Raw Airtable record sample:", JSON.stringify(records[0], null, 2));
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