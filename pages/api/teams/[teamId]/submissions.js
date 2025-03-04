import { base } from "@/lib/airtable"

/**
 * API endpoint to get submissions for a specific team
 * Strictly uses only Team and Member fields for fetching submissions
 * 
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 */
export default async function handler(req, res) {
  try {
    // Get team ID from the query (milestoneId still received but not used for filtering)
    const { teamId, milestoneId } = req.query
    
    console.log(`Fetching submissions for teamId=${teamId}, milestone=${milestoneId} (not used for filtering)`);
    
    // Validate required parameters
    if (!teamId) {
      return res.status(400).json({ error: "Team ID is required" });
    }
    
    // Get the Submissions table ID from environment variables
    const submissionsTableId = process.env.AIRTABLE_SUBMISSIONS_TABLE_ID;
    if (!submissionsTableId) {
      console.error("Submissions table ID not configured");
      return res.status(200).json({ submissions: [], meta: { error: "Submissions table not configured" } });
    }
    
    // Initialize the submissions table
    const submissionsTable = base(submissionsTableId);
    
    // Get the Members table ID for potential member lookup
    const membersTableId = process.env.AIRTABLE_MEMBERS_TABLE_ID;
    const teamsTableId = process.env.AIRTABLE_TEAMS_TABLE_ID;
    
    // Initialize empty array to store the submissions
    let submissions = [];
    let approachUsed = "none";
    
    // Inspect a sample submission record to verify field structure
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
        
        // Check for Member field
        if (sampleRecord[0].fields.Member) {
          console.log("Member field exists with type:", typeof sampleRecord[0].fields.Member);
          if (Array.isArray(sampleRecord[0].fields.Member)) {
            console.log("Member field is an array with length:", sampleRecord[0].fields.Member.length);
          }
        } else {
          console.warn("Member field not found in submission record");
        }
      } else {
        console.log("No sample submission records found");
      }
    } catch (error) {
      console.error("Error fetching sample submission record:", error);
    }
    
    // APPROACH 1: Query submissions directly by Team field
    try {
      console.log("APPROACH 1: Querying submissions by Team field");
      
      // Build a filter formula using only the Team field
      let filterFormula = `{Team}="${teamId}"`;
      
      // Make the query to the Submissions table
      const records = await submissionsTable
        .select({
          filterByFormula: filterFormula,
          sort: [{ field: "Created Time", direction: "desc" }]
        })
        .firstPage();
      
      console.log(`Found ${records.length} submissions using Team field direct query`);
      
      if (records && records.length > 0) {
        approachUsed = "direct-team";
        submissions = records.map(record => ({
          id: record.id,
          teamId: teamId,
          createdTime: record.fields["Created Time"],
          attachment: record.fields.Attachment,
          comments: record.fields.Comments,
          link: record.fields.Link,
          // Include raw Team field value for debugging
          _teamField: record.fields.Team,
          _memberField: record.fields.Member
        }));
      }
    } catch (error) {
      console.error("Error querying submissions by Team field:", error);
    }
    
    // APPROACH 2: If no results from direct Team query, try using Member IDs
    if (submissions.length === 0 && membersTableId && teamsTableId) {
      try {
        console.log("APPROACH 2: Querying submissions by Member IDs");
        
        // Initialize tables
        const membersTable = base(membersTableId);
        const teamsTable = base(teamsTableId);
        
        // First get the team record to access Members field
        const teamRecord = await teamsTable.find(teamId);
        console.log(`Team record retrieved: ${teamRecord.id}`);
        
        // Get member IDs from the team record
        const memberIds = teamRecord.fields.Members || [];
        console.log(`Found ${memberIds.length} member IDs from team record`);
        
        if (memberIds.length > 0) {
          // Create OR conditions for all member IDs (handling in batches for long queries)
          const batchSize = 10;
          let batchedSubmissions = [];
          
          for (let i = 0; i < memberIds.length; i += batchSize) {
            const batchMemberIds = memberIds.slice(i, i + batchSize);
            const memberConditions = batchMemberIds.map(id => `{Member}="${id}"`).join(",");
            const batchFilter = `OR(${memberConditions})`;
            
            console.log(`Querying batch ${Math.floor(i/batchSize) + 1} with ${batchMemberIds.length} members`);
            
            const batchRecords = await submissionsTable.select({
              filterByFormula: batchFilter,
              sort: [{ field: "Created Time", direction: "desc" }]
            }).firstPage();
            
            console.log(`Found ${batchRecords.length} submissions for member batch ${Math.floor(i/batchSize) + 1}`);
            
            if (batchRecords.length > 0) {
              batchedSubmissions = [...batchedSubmissions, ...batchRecords];
            }
          }
          
          if (batchedSubmissions.length > 0) {
            console.log(`Found ${batchedSubmissions.length} total submissions via Member relationship`);
            approachUsed = "member-based";
            
            submissions = batchedSubmissions.map(record => ({
              id: record.id,
              teamId: teamId,
              createdTime: record.fields["Created Time"] || new Date().toISOString(),
              attachment: record.fields.Attachment,
              comments: record.fields.Comments,
              link: record.fields.Link,
              // Include raw Member field value for debugging
              _memberField: record.fields.Member,
              _teamField: record.fields.Team
            }));
          }
        }
      } catch (error) {
        console.error("Error querying submissions by Member IDs:", error);
      }
    }
    
    // APPROACH 3: Try alternative field names for Team and Member as fallback
    if (submissions.length === 0) {
      try {
        console.log("APPROACH 3: Trying alternative field names");
        
        // For Team field variations
        const possibleTeamFields = ["Team", "Teams", "team", "teams"];
        const teamConditions = possibleTeamFields.map(field => `{${field}}="${teamId}"`).join(",");
        const filterFormula = `OR(${teamConditions})`;
        
        console.log(`Using alternative field formula: ${filterFormula}`);
        
        const records = await submissionsTable
          .select({
            filterByFormula: filterFormula,
            sort: [{ field: "Created Time", direction: "desc" }]
          })
          .firstPage();
        
        console.log(`Found ${records.length} submissions using alternative field names`);
        
        if (records.length > 0) {
          approachUsed = "alternative-field-names";
          
          submissions = records.map(record => ({
            id: record.id,
            teamId: teamId,
            createdTime: record.fields["Created Time"] || new Date().toISOString(),
            attachment: record.fields.Attachment,
            comments: record.fields.Comments,
            link: record.fields.Link,
            // For each record, note which field variant matched
            _matchedField: possibleTeamFields.find(field => record.fields[field])
          }));
        }
      } catch (error) {
        console.error("Error with alternative field names approach:", error);
      }
    }
    
    // Add diagnostic logging before returning
    console.log(`Final result: Returning ${submissions.length} submissions using approach: ${approachUsed}`);
    
    if (submissions.length > 0) {
      console.log("First submission details:", {
        id: submissions[0].id,
        teamId: submissions[0].teamId,
        attachmentCount: submissions[0].attachment ? 
          (Array.isArray(submissions[0].attachment) ? submissions[0].attachment.length : 1) : 0,
        hasComments: !!submissions[0].comments,
        hasLink: !!submissions[0].link,
        teamField: submissions[0]._teamField,
        memberField: submissions[0]._memberField
      });
    }
    
    // Return the submissions we found
    return res.status(200).json({
      submissions,
      // Include detailed metadata for debugging
      meta: {
        queryDetails: {
          teamId,
          requestedMilestoneId: milestoneId, // Note we received it but didn't use it
          timestamp: new Date().toISOString()
        },
        approach: approachUsed,
        resultCount: submissions.length,
        message: "Using only Team and Member fields for filtering"
      }
    });
  } catch (error) {
    console.error("Error in submissions endpoint:", error);
    // Return empty array rather than an error to prevent UI issues
    return res.status(200).json({ 
      submissions: [],
      meta: {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
}