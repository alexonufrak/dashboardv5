import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0"
import { base } from "@/lib/airtable"

/**
 * API endpoint to get submissions for a specific team, optionally filtered by milestone or deliverable
 * 
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 */
export default withApiAuthRequired(async function handler(req, res) {
  try {
    // Get the current session and user
    const session = await getSession(req, res)
    if (!session?.user) {
      return res.status(401).json({ error: "Not authenticated" })
    }

    // Get team ID from the route
    const { teamId } = req.query
    if (!teamId) {
      return res.status(400).json({ error: "Team ID is required" })
    }

    // Get optional filter parameter
    const { milestoneId } = req.query

    // Get the Submissions table ID from environment variables
    const submissionsTableId = process.env.AIRTABLE_SUBMISSIONS_TABLE_ID
    if (!submissionsTableId) {
      return res.status(500).json({ error: "Submissions table not configured" })
    }
    
    // Initialize the submissions table
    const submissionsTable = base(submissionsTableId)
    
    // Create filter formula based on provided parameters
    let filterFormula = `FIND("${teamId}", ARRAYJOIN(Team, ","))`
    
    // If we have a milestone ID, filter by direct milestone reference
    if (milestoneId) {
      // Use multiple approaches to ensure milestone ID matching is accurate
      // This handles different formats that might exist in the Airtable data
      
      // First approach: Check if the milestone ID exactly matches an element in the Milestone array
      // Second approach: Check if the milestone ID is found within the Milestone array string representation
      // Third approach: Directly check if the field itself contains the milestone ID (fallback)
      filterFormula = `AND(
        ${filterFormula}, 
        OR(
          {Milestone} = "${milestoneId}",
          ARRAYJOIN({Milestone}, ",") = "${milestoneId}",
          SEARCH(",${milestoneId},", CONCATENATE(",", ARRAYJOIN({Milestone}, ","), ",")),
          SEARCH("${milestoneId}", ARRAYJOIN({Milestone}, ","))
        )
      )`
      
      console.log(`Using advanced filter formula for milestone ${milestoneId}: ${filterFormula}`)
    } else {
      // If no milestone ID is provided, we should return a 400 error
      // because querying all submissions is likely to be inefficient
      return res.status(400).json({ error: "Milestone ID is required for efficiency. Please provide a milestoneId parameter." })
    }

    // Query submissions with the constructed filter
    console.log(`Fetching submissions for team ${teamId} with filter: ${filterFormula}`)
    
    const submissions = await submissionsTable
      .select({
        filterByFormula: filterFormula,
        sort: [{ field: 'Created Time', direction: 'desc' }]
      })
      .firstPage()

    // Process submissions to a cleaner format with extensive debugging information
    const formattedSubmissions = submissions.map(submission => {
      // Log detailed submission data for debugging
      console.log(`Processing submission ${submission.id} with complete field data:`);
      console.log(`- Milestone: ${JSON.stringify(submission.fields.Milestone)}`);
      console.log(`- Team: ${JSON.stringify(submission.fields.Team)}`);
      console.log(`- Created Time: ${submission.fields["Created Time"]}`);
      
      // Carefully handle Milestone field which could be in various formats
      let extractedMilestoneId = null;
      
      // Try multiple approaches to extract the milestone ID
      if (Array.isArray(submission.fields.Milestone) && submission.fields.Milestone.length > 0) {
        extractedMilestoneId = submission.fields.Milestone[0];
      } else if (typeof submission.fields.Milestone === 'string') {
        extractedMilestoneId = submission.fields.Milestone;
      }
      
      console.log(`- Extracted milestone ID: ${extractedMilestoneId}`);
      console.log(`- Requested milestone ID: ${milestoneId}`);
      console.log(`- Match status: ${extractedMilestoneId === milestoneId ? 'EXACT MATCH' : 'NO EXACT MATCH'}`);
      
      return {
        id: submission.id,
        createdTime: submission.fields["Created Time"],
        teamId: submission.fields.Team?.[0] || null,
        milestoneId: extractedMilestoneId,
        attachments: submission.fields.Attachment || [],
        comments: submission.fields.Comments || "",
        link: submission.fields.Link || "",
        memberId: submission.fields.Member?.[0] || null,
        // Additional fields with extensive metadata
        rawMilestone: submission.fields.Milestone, // For debugging relationship issues
        rawTeam: submission.fields.Team, // For debugging relationship issues
        // Include timestamp in milliseconds for precise sorting
        submissionTimestamp: new Date(submission.fields["Created Time"]).getTime(),
        // Original requested milestone ID for verification
        requestedMilestoneId: milestoneId
      }
    })

    return res.status(200).json({
      submissions: formattedSubmissions
    })
  } catch (error) {
    console.error("Error fetching submissions:", error)
    return res.status(500).json({ 
      error: "Failed to fetch submissions", 
      details: error.message 
    })
  }
})