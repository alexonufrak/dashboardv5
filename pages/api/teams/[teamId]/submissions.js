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
    
    try {
      const submissions = await submissionsTable
        .select({
          filterByFormula: filterFormula,
          sort: [{ field: 'Created Time', direction: 'desc' }]
        })
        .firstPage()
      
      // If we get here, the formula worked
      console.log(`Successfully fetched ${submissions.length} submissions with filter formula`)
      return submissions
    } catch (error) {
      // If the formula failed, try with just the team filter
      console.error(`Error with filter formula: ${error.message}`)
      console.log(`Falling back to simple team filter`)
      
      const simpleFilter = `FIND("${teamId}", ARRAYJOIN(Team, ","))`
      
      const fallbackSubmissions = await submissionsTable
        .select({
          filterByFormula: simpleFilter,
          sort: [{ field: 'Created Time', direction: 'desc' }]
        })
        .firstPage()
      
      // If we get submissions, filter them in code instead of in the query
      return fallbackSubmissions.filter(submission => {
        // Check if milestone fields contain the milestone ID
        const milestoneField = submission.fields.Milestone || [];
        const deliverableField = submission.fields.Deliverable || [];
        
        // Convert to arrays if they're not already
        const milestones = Array.isArray(milestoneField) ? milestoneField : [milestoneField];
        const deliverables = Array.isArray(deliverableField) ? deliverableField : [deliverableField];
        
        // Check if the milestone ID is in either field
        return milestones.includes(milestoneId) || deliverables.includes(milestoneId);
      })
    }

    // Use the submissions returned from our try/catch block
    const submissionsData = await submissions;
    
    // Process submissions to a cleaner format with extensive debugging information
    const formattedSubmissions = submissionsData.map(submission => {
      // More concise logging to prevent console flooding
      console.log(`Processing submission ${submission.id}`);
      
      // Log important fields only to keep logs manageable
      const milestoneField = submission.fields.Milestone || submission.fields.Deliverable;
      const createdTime = submission.fields["Created Time"] || submission.fields.created;
      const teamField = submission.fields.Team;
      
      // Try multiple approaches to extract the milestone ID from various possible field names
      let extractedMilestoneId = null;
      
      // Check various field names that could contain the milestone reference
      if (Array.isArray(submission.fields.Milestone) && submission.fields.Milestone.length > 0) {
        extractedMilestoneId = submission.fields.Milestone[0];
      } else if (typeof submission.fields.Milestone === 'string') {
        extractedMilestoneId = submission.fields.Milestone;
      } else if (Array.isArray(submission.fields.Deliverable) && submission.fields.Deliverable.length > 0) {
        extractedMilestoneId = submission.fields.Deliverable[0];
      } else if (typeof submission.fields.Deliverable === 'string') {
        extractedMilestoneId = submission.fields.Deliverable;
      } else if (submission.fields.Milestone_ID) {
        extractedMilestoneId = submission.fields.Milestone_ID;
      } else if (submission.fields.MilestoneID) {
        extractedMilestoneId = submission.fields.MilestoneID;
      }
      
      // If we still don't have a milestone ID, force it to the requested one
      // This ensures the submission is associated with the milestone even if the field naming is unexpected
      if (!extractedMilestoneId && milestoneId) {
        extractedMilestoneId = milestoneId;
        console.log(`No milestone ID found in submission ${submission.id}, using requested milestone ID: ${milestoneId}`);
      }
      
      // Get created time in a standardized format with error handling
      let standardCreatedTime = null;
      try {
        standardCreatedTime = createdTime ? new Date(createdTime).toISOString() : new Date().toISOString();
      } catch (err) {
        console.error(`Error parsing created time for submission ${submission.id}:`, err);
        standardCreatedTime = new Date().toISOString(); // Fallback to current time
      }
      
      // Log match status for debugging
      console.log(`- Match status for ${submission.id}: ${extractedMilestoneId === milestoneId ? 'EXACT MATCH' : 'NO EXACT MATCH'}`);
      
      return {
        id: submission.id,
        createdTime: standardCreatedTime,
        teamId: teamField?.[0] || teamId, // Fall back to teamId from query if not available
        milestoneId: extractedMilestoneId,
        attachments: submission.fields.Attachment || [],
        comments: submission.fields.Comments || submission.fields.notes || "",
        link: submission.fields.Link || submission.fields.URL || "",
        memberId: submission.fields.Member?.[0] || null,
        // Additional fields with extensive metadata
        rawMilestone: milestoneField, // For debugging relationship issues
        rawTeam: teamField, // For debugging relationship issues
        rawDeliverable: submission.fields.Deliverable, // Add deliverable field for debugging
        // Include timestamp in milliseconds for precise sorting
        submissionTimestamp: new Date(standardCreatedTime).getTime(),
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