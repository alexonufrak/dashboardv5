import { base } from "@/lib/airtable"

/**
 * API endpoint to get submissions for a specific team
 * Correctly fetches and filters submissions based on Airtable schema relationships
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
    
    // Initialize empty array to store the submissions
    let submissions = [];
    
    // APPROACH 1: Use direct relationship to query Submissions for this team + milestone
    try {
      console.log("Fetching submissions using direct team and milestone relationship");
      
      // Inspect a sample submission record to verify field names
      try {
        const sampleRecord = await submissionsTable
          .select({
            maxRecords: 1
          })
          .firstPage();
          
        if (sampleRecord && sampleRecord.length > 0) {
          console.log("Sample submission record fields:", Object.keys(sampleRecord[0].fields));
          
          // Check for Team field
          if (sampleRecord[0].fields.Team) {
            console.log("Team field exists with type:", typeof sampleRecord[0].fields.Team);
            if (Array.isArray(sampleRecord[0].fields.Team)) {
              console.log("Team field is an array with length:", sampleRecord[0].fields.Team.length);
            }
          } else {
            console.warn("Team field not found in submission record");
          }
          
          // Check for Milestone field
          if (sampleRecord[0].fields.Milestone) {
            console.log("Milestone field exists with type:", typeof sampleRecord[0].fields.Milestone);
            if (Array.isArray(sampleRecord[0].fields.Milestone)) {
              console.log("Milestone field is an array with length:", sampleRecord[0].fields.Milestone.length);
            }
          } else {
            console.warn("Milestone field not found in submission record");
          }
        } else {
          console.log("No sample submission records found");
        }
      } catch (error) {
        console.error("Error fetching sample submission record:", error);
      }
      
      // Build the filter formula based on the provided parameters and verified field names
      // Team field in Submissions table should be a reference to Teams table (from AIRTABLE_SCHEMA.md)
      let filterFormula = `{Team}="${teamId}"`;
      
      // If milestone ID is provided, add that to the filter
      if (milestoneId) {
        filterFormula = `AND(${filterFormula}, {Milestone}="${milestoneId}")`;
      }
      
      // Make the query to the Submissions table
      const records = await submissionsTable
        .select({
          filterByFormula: filterFormula,
          // Sort by created time in descending order to get the most recent first
          sort: [{ field: "Created Time", direction: "desc" }]
        })
        .firstPage();
      
      console.log(`Found ${records.length} direct submissions for team ID: ${teamId}`);
      
      // Process the submissions
      submissions = records.map(record => ({
        id: record.id,
        teamId: teamId,
        // Use the milestone from the record if available, otherwise use the one from the query
        milestoneId: record.fields.Milestone?.[0] || milestoneId,
        createdTime: record.fields["Created Time"],
        // Include additional fields that might be useful
        attachment: record.fields.Attachment,
        comments: record.fields.Comments,
        link: record.fields.Link
      }));
    } catch (error) {
      console.error("Error fetching submissions by team and milestone:", error);
      // Continue to next approach if this one fails
    }
    
    // APPROACH 2: Try alternative field names based on schema variations
    // Some environments might have slight differences in field naming
    if (submissions.length === 0) {
      try {
        console.log("Trying alternative field names...");
        
        // Get the sample record again to check for alternative field names
        const sampleRecords = await submissionsTable
          .select({
            maxRecords: 1
          })
          .firstPage();
        
        if (sampleRecords && sampleRecords.length > 0) {
          const fieldNames = Object.keys(sampleRecords[0].fields);
          console.log("Available fields:", fieldNames);
          
          // Check for alternative Team field names
          const possibleTeamFields = ["Team", "Teams", "team", "teams"];
          const teamField = possibleTeamFields.find(field => fieldNames.includes(field));
          
          // Check for alternative Milestone field names
          const possibleMilestoneFields = ["Milestone", "Milestones", "milestone", "milestones", "Deliverable", "Deliverables"];
          const milestoneField = possibleMilestoneFields.find(field => fieldNames.includes(field));
          
          if (teamField) {
            console.log(`Found alternative Team field: ${teamField}`);
            let filterFormula = `{${teamField}}="${teamId}"`;
            
            if (milestoneId && milestoneField) {
              console.log(`Found alternative Milestone field: ${milestoneField}`);
              filterFormula = `AND(${filterFormula}, {${milestoneField}}="${milestoneId}")`;
            }
            
            // Query with alternative field names
            const records = await submissionsTable
              .select({
                filterByFormula: filterFormula,
                sort: [{ field: "Created Time", direction: "desc" }]
              })
              .firstPage();
            
            console.log(`Found ${records.length} submissions using alternative fields`);
            
            if (records.length > 0) {
              submissions = records.map(record => ({
                id: record.id,
                teamId: teamId,
                milestoneId: milestoneId || (record.fields[milestoneField]?.[0] || null),
                createdTime: record.fields["Created Time"] || new Date().toISOString(),
                attachment: record.fields.Attachment,
                comments: record.fields.Comments,
                link: record.fields.Link
              }));
            }
          }
        }
      } catch (error) {
        console.error("Error with alternative field names approach:", error);
      }
    }
    
    // APPROACH 3: If previous approaches didn't find any submissions,
    // and we have a milestone ID, try to search all team submissions
    // and filter them manually
    if (submissions.length === 0 && milestoneId) {
      try {
        console.log("No matches found with direct queries. Trying manual filtering...");
        
        // Get all submissions for this team using all possible field names
        const possibleTeamFields = ["Team", "Teams", "team", "teams"];
        const teamConditions = possibleTeamFields.map(field => `{${field}}="${teamId}"`).join(",");
        const filterFormula = `OR(${teamConditions})`;
        
        const records = await submissionsTable
          .select({
            filterByFormula: filterFormula,
            sort: [{ field: "Created Time", direction: "desc" }]
          })
          .firstPage();
        
        console.log(`Found ${records.length} total submissions for team ID: ${teamId}`);
        
        if (records.length > 0) {
          // Process and filter the submissions
          const possibleMilestoneFields = ["Milestone", "Milestones", "milestone", "milestones", "Deliverable", "Deliverables"];
          
          submissions = records
            .filter(record => {
              // Check each possible milestone field
              for (const field of possibleMilestoneFields) {
                if (record.fields[field] && Array.isArray(record.fields[field])) {
                  if (record.fields[field].includes(milestoneId)) {
                    return true;
                  }
                }
              }
              return false;
            })
            .map(record => ({
              id: record.id,
              teamId: teamId,
              milestoneId: milestoneId,
              createdTime: record.fields["Created Time"] || new Date().toISOString(),
              attachment: record.fields.Attachment,
              comments: record.fields.Comments,
              link: record.fields.Link
            }));
          
          console.log(`After filtering, found ${submissions.length} submissions for milestone ID: ${milestoneId}`);
        }
      } catch (error) {
        console.error("Error with manual filtering approach:", error);
      }
    }
    
    // Add diagnostic logging before returning
    console.log(`Final result: Returning ${submissions.length} submissions`);
    if (submissions.length > 0) {
      console.log("First submission details:", {
        id: submissions[0].id,
        teamId: submissions[0].teamId,
        milestoneId: submissions[0].milestoneId,
        attachmentCount: submissions[0].attachment ? 
          (Array.isArray(submissions[0].attachment) ? submissions[0].attachment.length : 1) : 0,
        hasComments: !!submissions[0].comments,
        hasLink: !!submissions[0].link
      });
    }
    
    // Return the submissions we found
    return res.status(200).json({
      submissions,
      // Include metadata to help with debugging
      meta: {
        queryDetails: {
          teamId,
          milestoneId,
          timestamp: new Date().toISOString()
        },
        resultCount: submissions.length
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