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
    // Use simple equality checks for linked record filtering
    let formula;
    
    if (milestoneId) {
      // If we have both team and milestone IDs, filter for both directly in Airtable
      formula = `AND(
        SEARCH("${teamId}", ARRAYJOIN(Team)),
        SEARCH("${milestoneId}", ARRAYJOIN(Milestone))
      )`;
    } else {
      // If we only have team ID, just filter for that
      formula = `SEARCH("${teamId}", ARRAYJOIN(Team))`;
    }
    
    console.log(`Using advanced Airtable formula: ${formula}`);
    
    // Select only the fields we need to reduce data transfer
    // Remove fields that don't exist in the Airtable schema
    // Added returnFieldsByFieldId parameter
    const records = await submissionsTable
      .select({
        filterByFormula: formula,
        fields: ['Team', 'Milestone', 'Comments', 'Link', 'Attachment', 'Created Time', 
                'Name (from Milestone)'],
        // Sort by created time in descending order to get the most recent first
        sort: [{ field: "Created Time", direction: "desc" }],
        // Return fields identified by field ID instead of field name
        returnFieldsByFieldId: true
      })
      .firstPage();
      
    console.log(`Found ${records.length} total submissions matching our formula`);
    
    // Log field names from the first record if available
    if (records.length > 0) {
      console.log("Available field IDs in submission records:", Object.keys(records[0].fields));
      
      // With returnFieldsByFieldId, we need to adapt our code to work with field IDs
      // Log all fields to help identify the correct field IDs
      console.log("First record fields:", records[0].fields);
    }
    
    // For optimization, we're directly using the records from Airtable's filtered results
    const filteredRecords = records;
    
    // For the first test, we'll just return the raw records
    // so we can see the field IDs in the logs
    // Then we'll update the mapping in the next iteration
    
    // Return empty submissions for now - we'll update after seeing the field IDs
    const submissions = [];
    
    // Log raw record for debugging
    if (filteredRecords.length > 0) {
      console.log("Raw first record:", JSON.stringify(filteredRecords[0], null, 2));
    }
    
    // We're returning empty submissions for the initial test
    // to discover the field IDs
    
    // Keep the raw Airtable response for debugging
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