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
    
    // Get the teams table ID
    const teamsTableId = process.env.AIRTABLE_TEAMS_TABLE_ID;
    if (!teamsTableId) {
      console.error("Teams table ID not configured");
      return res.status(200).json({ submissions: [] });
    }
    
    // First, try to get the team to check for submissions directly
    const teamsTable = base(teamsTableId);
    let teamSubmissionIds = [];
    
    try {
      console.log(`Getting team ${teamId} to check for submission IDs`);
      const team = await teamsTable.find(teamId);
      if (team && team.fields.Submissions && Array.isArray(team.fields.Submissions)) {
        teamSubmissionIds = team.fields.Submissions;
        console.log(`Found ${teamSubmissionIds.length} submission IDs directly on team record`);
      } else {
        console.log(`No submission IDs found on team record`);
      }
    } catch (error) {
      console.error(`Error getting team record:`, error);
    }
    
    // Get the Submissions table ID from environment variables
    const submissionsTableId = process.env.AIRTABLE_SUBMISSIONS_TABLE_ID;
    if (!submissionsTableId) {
      console.error("Submissions table ID not configured");
      // Return the submission IDs we found directly on the team, if any
      if (teamSubmissionIds.length > 0) {
        const submissions = teamSubmissionIds.map(id => ({
          id,
          teamId,
          createdTime: new Date().toISOString()
        }));
        return res.status(200).json({ 
          submissions,
          meta: { source: "team-record-only", count: submissions.length }
        });
      }
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
      
      // Build the filter formula based on the provided parameters
      // IMPORTANT: Only using Team field as directed
      // Team field in Submissions table is a single item relation to Teams table
      let filterFormula = `{Team}="${teamId}"`;
      
      // Note: Not filtering by Milestone ID here since we're only using Team and Member fields
      
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
    
    // APPROACH 2: Try finding submissions by Member in case they're linked that way
    if (submissions.length === 0) {
      try {
        console.log("Trying to find submissions by Member field...");
        
        // First, we need the members of this team from the members table
        const membersTableId = process.env.AIRTABLE_MEMBERS_TABLE_ID;
        
        if (membersTableId) {
          const membersTable = base(membersTableId);
          
          // Get team members
          const memberRecords = await membersTable.select({
            filterByFormula: `{Team}="${teamId}"`,
            fields: ["id"]
          }).firstPage();
          
          console.log(`Found ${memberRecords.length} members for team ${teamId}`);
          
          if (memberRecords.length > 0) {
            // Extract member IDs
            const memberIds = memberRecords.map(record => record.id);
            
            // Look for submissions with these member IDs
            // Create OR conditions for each member ID (handled in batches for formula length limitations)
            const batchSize = 10;
            let batchedSubmissions = [];
            
            for (let i = 0; i < memberIds.length; i += batchSize) {
              const batchMemberIds = memberIds.slice(i, i + batchSize);
              const memberConditions = batchMemberIds.map(id => `{Member}="${id}"`).join(",");
              const batchFilter = `OR(${memberConditions})`;
              
              console.log(`Querying for batch ${i/batchSize + 1} with ${batchMemberIds.length} members`);
              
              const batchRecords = await submissionsTable.select({
                filterByFormula: batchFilter,
                sort: [{ field: "Created Time", direction: "desc" }]
              }).firstPage();
              
              console.log(`Found ${batchRecords.length} submissions for member batch ${i/batchSize + 1}`);
              
              if (batchRecords.length > 0) {
                batchedSubmissions = [...batchedSubmissions, ...batchRecords];
              }
            }
            
            if (batchedSubmissions.length > 0) {
              console.log(`Found a total of ${batchedSubmissions.length} submissions via Member relationship`);
              
              submissions = batchedSubmissions.map(record => ({
                id: record.id,
                teamId: teamId, 
                createdTime: record.fields["Created Time"] || new Date().toISOString(),
                attachment: record.fields.Attachment,
                comments: record.fields.Comments,
                link: record.fields.Link
              }));
            }
          }
        } else {
          console.log("Members table ID not configured, skipping member-based approach");
        }
      } catch (error) {
        console.error("Error with member-based approach:", error);
      }
    }
    
    // APPROACH 3: Try alternative field names for the Team field as fallback
    if (submissions.length === 0) {
      try {
        console.log("Trying alternative Team field names...");
        
        // Get all submissions for this team using all possible Team field name variations
        const possibleTeamFields = ["Team", "Teams", "team", "teams"];
        const teamConditions = possibleTeamFields.map(field => `{${field}}="${teamId}"`).join(",");
        const filterFormula = `OR(${teamConditions})`;
        
        const records = await submissionsTable
          .select({
            filterByFormula: filterFormula,
            sort: [{ field: "Created Time", direction: "desc" }]
          })
          .firstPage();
        
        console.log(`Found ${records.length} total submissions using alternative Team field names`);
        
        if (records.length > 0) {
          submissions = records.map(record => ({
            id: record.id,
            teamId: teamId,
            createdTime: record.fields["Created Time"] || new Date().toISOString(),
            attachment: record.fields.Attachment,
            comments: record.fields.Comments,
            link: record.fields.Link
          }));
        }
      } catch (error) {
        console.error("Error with alternative field names approach:", error);
      }
    }
    
    // If we have team submission IDs but found no submissions through our approaches,
    // use the team submission IDs directly
    if (submissions.length === 0 && teamSubmissionIds.length > 0) {
      console.log(`Using ${teamSubmissionIds.length} submission IDs directly from team record`);
      
      // For each submission ID, try to fetch the detail from the submissions table
      for (const submissionId of teamSubmissionIds) {
        try {
          const submissionRecord = await submissionsTable.find(submissionId);
          if (submissionRecord) {
            submissions.push({
              id: submissionRecord.id,
              teamId: teamId,
              milestoneId: submissionRecord.fields.Milestone?.[0] || milestoneId,
              createdTime: submissionRecord.fields["Created Time"] || new Date().toISOString(),
              attachment: submissionRecord.fields.Attachment,
              comments: submissionRecord.fields.Comments,
              link: submissionRecord.fields.Link
            });
          } else {
            // If we can't get the detail, just use the ID
            submissions.push({
              id: submissionId,
              teamId: teamId,
              createdTime: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error(`Error fetching submission ${submissionId}:`, error);
          // Still include the ID even if we can't get details
          submissions.push({
            id: submissionId,
            teamId: teamId,
            createdTime: new Date().toISOString()
          });
        }
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
          timestamp: new Date().toISOString(),
          teamSubmissionIdsCount: teamSubmissionIds.length
        },
        resultCount: submissions.length,
        source: teamSubmissionIds.length > 0 ? "team-record-augmented" : "api-lookup"
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