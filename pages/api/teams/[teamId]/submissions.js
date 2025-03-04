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
      // Simplify the filtering approach with reliable formula components
      // Use only fields that are confirmed to exist in the Airtable schema
      filterFormula = `AND(
        ${filterFormula}, 
        OR(
          {Milestone} = "${milestoneId}",
          FIND("${milestoneId}", ARRAYJOIN({Milestone}, ",")),
          {Deliverable} = "${milestoneId}",
          FIND("${milestoneId}", ARRAYJOIN({Deliverable}, ","))
        )
      )`
      
      console.log(`Using enhanced filter formula for milestone ${milestoneId}: ${filterFormula}`)
    } else {
      // If no milestone ID is provided, we should return a 400 error
      // because querying all submissions is likely to be inefficient
      return res.status(400).json({ error: "Milestone ID is required for efficiency. Please provide a milestoneId parameter." })
    }

    // Query submissions with the constructed filter
    console.log(`Fetching submissions for team ${teamId} with filter: ${filterFormula}`)
    
    // Use a very simple filter to avoid timeouts
    const simpleFilter = `FIND("${teamId}", ARRAYJOIN(Team, ","))`
    
    // Limit to a small number of records to prevent timeout
    const submissions = await submissionsTable
      .select({
        filterByFormula: simpleFilter,
        sort: [{ field: 'Created Time', direction: 'desc' }],
        maxRecords: 20 // Limit records to avoid timeout
      })
      .firstPage()
    
    // If we get submissions, filter them in code 
    console.log(`Retrieved ${submissions.length} team submissions, filtering for milestone ${milestoneId}`)
    
    // Return only the submissions matching our milestone
    return submissions.filter(submission => {
      const milestoneField = submission.fields.Milestone || [];
      const deliverableField = submission.fields.Deliverable || [];
      
      // Process as arrays
      const milestones = Array.isArray(milestoneField) ? milestoneField : [milestoneField].filter(Boolean);
      const deliverables = Array.isArray(deliverableField) ? deliverableField : [deliverableField].filter(Boolean);
      
      // Check for exact match
      return milestones.includes(milestoneId) || deliverables.includes(milestoneId);
    })

    // Process submissions to a cleaner format with extensive debugging information
    const formattedSubmissions = submissions.map(submission => {
      // More concise logging to prevent console flooding
      console.log(`Processing submission ${submission.id}`);
      
      // Log important fields only to keep logs manageable
      const milestoneField = submission.fields.Milestone || submission.fields.Deliverable;
      // Keep original Created Time from Airtable
      const createdTime = submission.fields["Created Time"];
      const teamField = submission.fields.Team;
      
      // Simplify extraction - we already filtered for milestone match
      // Just use the requested milestone ID
      let extractedMilestoneId = milestoneId;
      
      return {
        id: submission.id,
        createdTime: createdTime,
        teamId: teamField?.[0] || teamId, // Fall back to teamId from query if not available
        milestoneId: extractedMilestoneId,
        attachments: submission.fields.Attachment || [],
        comments: submission.fields.Comments || submission.fields.notes || "",
        link: submission.fields.Link || submission.fields.URL || "",
        memberId: submission.fields.Member?.[0] || null,
        // Additional fields with minimal metadata to reduce response size
        rawMilestone: milestoneField, 
        // Include timestamp in milliseconds for precise sorting (if created time exists)
        submissionTimestamp: createdTime ? new Date(createdTime).getTime() : Date.now(),
        // Milestone ID verification
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