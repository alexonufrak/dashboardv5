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
    
    // Get the Milestone table ID from environment variables
    const milestonesTableId = process.env.AIRTABLE_MILESTONES_TABLE_ID
    if (!milestonesTableId) {
      return res.status(500).json({ error: "Milestones table not configured" })
    }
    
    // Initialize the milestones table
    const milestonesTable = base(milestonesTableId)
    
    console.log(`Fetching milestones for cohort: ${cohortId}`)
    
    // Try multiple approaches for finding milestones
    // First, use FIND_RECORD for exact record matching (preferred for linked records)
    let milestones = []
    
    try {
      console.log("Trying with FIND_RECORD formula...")
      milestones = await milestonesTable
        .select({
          filterByFormula: `FIND_RECORD({Cohort}, "${cohortId}")`,
          sort: [{ field: 'Number', direction: 'asc' }]
        })
        .firstPage()
      
      console.log(`FIND_RECORD approach found ${milestones.length} milestones`)
    } catch (error) {
      console.error("Error with FIND_RECORD approach:", error)
    }
    
    // If the first approach didn't work, try with OR and IS_SAME for multipleRecordLinks
    if (milestones.length === 0) {
      try {
        console.log("Trying with IS_SAME formula...")
        const formula = `OR(
          IS_SAME({Cohort}, ARRAYJOIN(ARRAYWRAP("${cohortId}"))),
          IS_SAME(ARRAYJOIN({Cohort}), "${cohortId}")
        )`
        
        milestones = await milestonesTable
          .select({
            filterByFormula: formula,
            sort: [{ field: 'Number', direction: 'asc' }]
          })
          .firstPage()
        
        console.log(`IS_SAME approach found ${milestones.length} milestones`)
      } catch (error) {
        console.error("Error with IS_SAME approach:", error)
      }
    }
    
    // If all previous approaches failed, use the simpler FIND function as a last resort
    if (milestones.length === 0) {
      console.log("Trying with FIND approach...")
      milestones = await milestonesTable
        .select({
          filterByFormula: `FIND("${cohortId}", {Cohort})`,
          sort: [{ field: 'Number', direction: 'asc' }]
        })
        .firstPage()
      
      console.log(`FIND approach found ${milestones.length} milestones`)
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
      // Determine status based on milestone data - this is simplified logic
      // In production, you would have more complex logic based on submissions, dates, etc.
      let status = "not_started"
      let progress = 0
      let completedDate = null
      let score = null
      
      // This is placeholder logic - in production, you would check for actual submission data
      // and calculate these values accordingly
      const dueDate = milestone.fields["Due Datetime"]
      const now = new Date()
      const milestoneDate = dueDate ? new Date(dueDate) : null
      
      // Simplified status logic for demo purposes
      if (milestoneDate) {
        if (milestoneDate < now) {
          // Past due date - assume completed for first two, in progress for third, at_risk for next
          if (milestone.fields.Number <= 2) {
            status = "completed"
            completedDate = new Date(milestoneDate.getTime() - Math.random() * 1000 * 60 * 60 * 24 * 3) // Random date within 3 days before due date
            score = Math.floor(Math.random() * 15) + 85 // Random score between 85-100
          } else if (milestone.fields.Number === 3) {
            status = "in_progress"
            progress = Math.floor(Math.random() * 40) + 40 // Random progress between 40-80%
          } else {
            status = "at_risk"
            progress = Math.floor(Math.random() * 30) + 10 // Random progress between 10-40%
          }
        } else if (milestone.fields.Number <= 3) {
          // Future due date but early milestone - assume in progress
          status = milestone.fields.Number <= 2 ? "completed" : "in_progress"
          if (status === "completed") {
            completedDate = new Date(milestoneDate.getTime() - Math.random() * 1000 * 60 * 60 * 24 * 3)
            score = Math.floor(Math.random() * 15) + 85
          } else {
            progress = Math.floor(Math.random() * 40) + 40
          }
        }
      }
      
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