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

    // Get optional filter parameters
    const { milestoneId, deliverableId } = req.query

    // Get the Submissions table ID from environment variables
    const submissionsTableId = process.env.AIRTABLE_SUBMISSIONS_TABLE_ID
    if (!submissionsTableId) {
      return res.status(500).json({ error: "Submissions table not configured" })
    }

    // Get the Deliverables table ID for cross-reference
    const deliverablesTableId = process.env.AIRTABLE_DELIVERABLES_TABLE_ID
    
    // Initialize the submissions table
    const submissionsTable = base(submissionsTableId)
    
    // Create filter formula based on provided parameters
    let filterFormula = `FIND("${teamId}", ARRAYJOIN(Team, ","))`
    
    // If we have a deliverable ID filter directly
    if (deliverableId) {
      filterFormula = `AND(${filterFormula}, FIND("${deliverableId}", ARRAYJOIN(Deliverable, ",")))`
    }
    // If we have a milestone ID but no deliverable ID, we need to find deliverables for this milestone
    else if (milestoneId && deliverablesTableId) {
      try {
        // First, get all deliverables for this milestone
        const deliverablesTable = base(deliverablesTableId)
        
        const deliverables = await deliverablesTable
          .select({
            filterByFormula: `FIND("${milestoneId}", ARRAYJOIN(Milestones, ","))`
          })
          .firstPage()
          
        // If there are deliverables, build an OR filter for all of them
        if (deliverables && deliverables.length > 0) {
          const deliverableFilters = deliverables.map(d => 
            `FIND("${d.id}", ARRAYJOIN(Deliverable, ","))`
          )
          
          filterFormula = `AND(${filterFormula}, OR(${deliverableFilters.join(",")}))`
        } else {
          // No deliverables found for this milestone
          // This would mean no submissions are possible, but we'll continue the query anyway
          console.log(`No deliverables found for milestone ${milestoneId}`)
        }
      } catch (error) {
        console.error("Error fetching deliverables:", error)
        // Continue with just the team filter if this fails
      }
    }

    // Query submissions with the constructed filter
    console.log(`Fetching submissions for team ${teamId} with filter: ${filterFormula}`)
    
    const submissions = await submissionsTable
      .select({
        filterByFormula: filterFormula,
        sort: [{ field: 'Created Time', direction: 'desc' }]
      })
      .firstPage()

    // Process submissions to a cleaner format
    const formattedSubmissions = submissions.map(submission => {
      return {
        id: submission.id,
        createdTime: submission.fields["Created Time"],
        teamId: submission.fields.Team?.[0] || null,
        deliverableId: submission.fields.Deliverable?.[0] || null,
        attachments: submission.fields.Attachment || [],
        comments: submission.fields.Comments || "",
        link: submission.fields.Link || "",
        memberId: submission.fields.Member?.[0] || null
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