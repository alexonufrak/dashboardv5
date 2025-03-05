import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0"
import { base } from "@/lib/airtable"

/**
 * API endpoint to get milestones for a specific cohort
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
    
    // Get cohort ID from the route
    const { cohortId } = req.query
    if (!cohortId) {
      return res.status(400).json({ error: "Cohort ID is required" })
    }
    
    // Get the Milestone and Cohort table IDs from environment variables
    const milestonesTableId = process.env.AIRTABLE_MILESTONES_TABLE_ID
    const cohortsTableId = process.env.AIRTABLE_COHORTS_TABLE_ID
    if (!milestonesTableId) {
      return res.status(500).json({ error: "Milestones table not configured" })
    }
    
    // Initialize the tables
    const milestonesTable = base(milestonesTableId)
    const cohortsTable = cohortsTableId ? base(cohortsTableId) : null
    
    console.log(`Fetching milestones for cohort: ${cohortId}`)
    
    // Simplified approach: Get milestone IDs from the cohort, then fetch those milestones
    let milestones = []
    
    try {
      // First check if we can get the Milestones field from the cohort directly
      if (cohortsTable) {
        try {
          const cohort = await cohortsTable.find(cohortId)
          if (cohort && cohort.fields.Milestones && Array.isArray(cohort.fields.Milestones)) {
            // The cohort has a Milestones field with milestone IDs, use them directly
            const milestoneIds = cohort.fields.Milestones
            
            // Fetch all those milestone records
            if (milestoneIds.length > 0) {
              const milestoneRecords = await Promise.all(
                milestoneIds.map(id => milestonesTable.find(id).catch(() => null))
              )
              
              // Filter out null results (in case any weren't found)
              milestones = milestoneRecords.filter(Boolean)
              
              console.log(`Found ${milestones.length} milestones from cohort's Milestones field`)
              
              // Sort milestones by number
              milestones.sort((a, b) => 
                (a.fields.Number || 999) - (b.fields.Number || 999)
              )
            }
          }
        } catch (error) {
          console.error("Error fetching milestones from cohort record:", error)
        }
      }
      
      // If we couldn't get milestones from the cohort directly, use the cohort ID to find milestones
      if (milestones.length === 0) {
        // Fetch milestones using the dedicated cohortId field for direct matching
        milestones = await milestonesTable
          .select({
            filterByFormula: `{cohortId} = "${cohortId}"`,
            sort: [{ field: 'Number', direction: 'asc' }]
          })
          .firstPage()
        
        console.log(`Found ${milestones.length} milestones using Cohort field lookup`)
      }
    } catch (error) {
      console.error("Error fetching milestones:", error)
      // Continue with empty milestones array
    }
    
    // Log the milestones found
    console.log(`Found ${milestones.length} milestones in total for cohort ${cohortId}`)
    if (milestones.length > 0) {
      console.log("First milestone:", {
        id: milestones[0].id,
        name: milestones[0].fields.Name,
        cohort: milestones[0].fields.Cohort
      })
    }
    
    // Process each milestone to get the required data
    const formattedMilestones = milestones.map(milestone => {
      // Initial status is always "upcoming" unless we have data indicating otherwise
      let status = "upcoming"
      let progress = 0
      let completedDate = null
      let score = null // Initialize score variable
      
      // Get due date and calculate whether it's past due
      const dueDate = milestone.fields["Due Datetime"]
      const now = new Date()
      const milestoneDate = dueDate ? new Date(dueDate) : null
      const isPastDue = milestoneDate && milestoneDate < now
      
      // Mark past due milestones as "late", future milestones as "upcoming"
      // Make sure we're doing reliable date handling
      try {
        if (isPastDue) {
          status = "late"
        }
      } catch (dateError) {
        console.error("Error checking milestone due date:", dateError)
        // Default to upcoming if date comparison fails
        status = "upcoming"
      }
      
      // The client-side MilestoneSubmissionChecker component will handle
      // checking for actual submissions and updating status to "completed" accordingly
      
      return {
        id: milestone.id,
        name: milestone.fields.Name || `Milestone ${milestone.fields.Number}`,
        number: milestone.fields.Number,
        dueDate: milestone.fields["Due Datetime"],
        description: milestone.fields.Description,
        status,
        progress,
        completedDate: completedDate ? completedDate.toISOString() : null,
        score
      }
    })
    
    // Return the formatted milestones
    return res.status(200).json({
      milestones: formattedMilestones
    })
  } catch (error) {
    console.error("Error fetching milestones:", error)
    return res.status(500).json({ error: "Failed to fetch milestones", details: error.message })
  }
})