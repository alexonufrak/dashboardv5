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
    // Try a much simpler approach - just fetch records that have a non-empty Team field
    // And then filter on our side to include only records with matching team IDs
    // This should bypass any Airtable formula limitations with linked records
    // Airtable API has a limit on how many records it will return in one query
    // Set maxRecords to ensure we get everything we need
    const formula = `Team != ""`;
    console.log(`Using simplified Airtable formula: ${formula}`);
    
    const records = await submissionsTable
      .select({
        filterByFormula: formula,
        // Set a high maximum to make sure we get all records
        maxRecords: 1000,
        // Sort by created time in descending order to get the most recent first
        sort: [{ field: "Created Time", direction: "desc" }]
      })
      .firstPage();
      
    console.log(`Found ${records.length} total submissions with any team assigned`);
    
    // Log field names from the first record if available
    if (records.length > 0) {
      console.log("Available fields in submission records:", Object.keys(records[0].fields));
    }
    
    // First filter to only records that include our team ID
    const teamRecords = records.filter(record => {
      if (!record.fields.Team || !Array.isArray(record.fields.Team)) {
        return false;
      }
      // Log each record's team array to help debug
      console.log(`Record ${record.id} has teams: ${JSON.stringify(record.fields.Team)}`);
      return record.fields.Team.includes(teamId);
    });
    
    console.log(`Filtered to ${teamRecords.length} submissions for team ID: ${teamId}`);
    
    // Process and filter submissions
    // If milestoneId is provided, we filter here in code rather than in the Airtable query
    let filteredRecords = teamRecords;
    if (milestoneId) {
      // Log the raw data before filtering to see what we're working with
      if (teamRecords.length > 0) {
        console.log(`First team record milestone field:`, teamRecords[0].fields.Milestone);
        // Check data type and structure to help debug issues
        if (teamRecords[0].fields.Milestone) {
          console.log(`Milestone field type: ${typeof teamRecords[0].fields.Milestone}, isArray: ${Array.isArray(teamRecords[0].fields.Milestone)}`);
        }
      }
      
      filteredRecords = teamRecords.filter(record => {
        if (!record.fields.Milestone || !Array.isArray(record.fields.Milestone)) {
          return false;
        }
        const includes = record.fields.Milestone.includes(milestoneId);
        console.log(`Record ID ${record.id} - Milestone: ${record.fields.Milestone}, includes ${milestoneId}: ${includes}`);
        return includes;
      });
      console.log(`Filtered to ${filteredRecords.length} submissions for milestone ID: ${milestoneId}`);
    }
    
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