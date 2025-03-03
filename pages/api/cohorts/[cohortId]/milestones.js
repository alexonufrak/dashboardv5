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
    
    // Based on the Airtable schema, the Milestones table has a Cohort field that links to Cohorts
    // We'll use simple approaches that are compatible with all Airtable API versions
    let milestones = []
    
    // First, try a direct approach to match Cohort field records
    try {
      console.log("Trying direct approach - check if Cohort field contains cohortId...")
      // This works when Cohort is a multipleRecordLinks field (array of IDs)
      milestones = await milestonesTable
        .select({
          // We're checking if the cohortId is in the Cohort field
          // No fancy functions, just using plain vanilla Airtable formula functions
          filterByFormula: `OR(
            FIND("${cohortId}", ARRAYJOIN(Cohort, ",")),
            FIND("${cohortId}", ARRAYJOIN(Cohort))
          )`,
          sort: [{ field: 'Number', direction: 'asc' }]
        })
        .firstPage()
      
      console.log(`Direct approach found ${milestones.length} milestones`)
    } catch (error) {
      console.error("Error with direct approach:", error)
    }
    
    // If first approach failed, try another formula
    if (milestones.length === 0) {
      try {
        console.log("Trying alternative formula...")
        
        // Get all milestones for diagnostic output
        const allMilestones = await milestonesTable
          .select({
            maxRecords: 5
          })
          .firstPage()
        
        if (allMilestones.length > 0) {
          // Log sample milestone records to understand their structure
          console.log(`Sample milestone has fields:`, Object.keys(allMilestones[0].fields))
          if (allMilestones[0].fields.Cohort) {
            console.log(`Sample milestone Cohort field:`, allMilestones[0].fields.Cohort)
            console.log(`Cohort field type:`, typeof allMilestones[0].fields.Cohort)
            console.log(`Is array:`, Array.isArray(allMilestones[0].fields.Cohort))
          }
        }
        
        // Try again with a basic formula that looks for the cohortId within the Cohort field
        milestones = await milestonesTable
          .select({
            filterByFormula: `SEARCH("${cohortId}", ARRAYJOIN(Cohort))`,
            sort: [{ field: 'Number', direction: 'asc' }]
          })
          .firstPage()
        
        console.log(`Alternative approach found ${milestones.length} milestones`)
      } catch (error) {
        console.error("Error with alternative approach:", error)
      }
    }
    
    // Last resort: Get all milestones and filter manually
    if (milestones.length === 0) {
      try {
        console.log("Trying manual filtering approach - getting all milestones...")
        const allMilestones = await milestonesTable
          .select({
            sort: [{ field: 'Number', direction: 'asc' }]
          })
          .firstPage()
        
        console.log(`Retrieved ${allMilestones.length} total milestones for manual filtering`)
        
        // Filter milestones manually by checking if the Cohort field includes the cohortId
        milestones = allMilestones.filter(record => {
          if (!record.fields.Cohort) return false
          
          // If Cohort is an array (which it should be for a linked record)
          if (Array.isArray(record.fields.Cohort)) {
            return record.fields.Cohort.includes(cohortId)
          }
          
          // If Cohort is a string (unexpected but handle just in case)
          if (typeof record.fields.Cohort === 'string') {
            return record.fields.Cohort.includes(cohortId)
          }
          
          return false
        })
        
        console.log(`Manual filtering approach found ${milestones.length} milestones`)
      } catch (error) {
        console.error("Error with manual filtering approach:", error)
      }
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
      // Initial status is always "not_started" unless we have data indicating otherwise
      let status = "not_started"
      let progress = 0
      let completedDate = null
      let score = null // Initialize score variable
      
      // Get due date and calculate whether it's past due
      const dueDate = milestone.fields["Due Datetime"]
      const now = new Date()
      const milestoneDate = dueDate ? new Date(dueDate) : null
      const isPastDue = milestoneDate && milestoneDate < now
      
      // If the milestone is past due, mark it as at_risk
      // The client component will determine the actual status based on submissions
      if (isPastDue) {
        status = "at_risk"
      }
      
      // Only set status to in_progress or completed if we have actual data
      // from Airtable indicating this (which we don't in this API yet)
      // The client-side MilestoneSubmissionChecker component will handle
      // checking for actual submissions and updating status accordingly
      
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