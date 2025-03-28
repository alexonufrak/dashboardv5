import { auth0 } from "@/lib/auth0"
import { base } from "@/lib/airtable"

/**
 * API endpoint to get claimed rewards data from Airtable
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 */
async function handler(req, res) {
  try {
    // Get the current session and user
    const session = await getSession(req, res)
    if (!session?.user) {
      return res.status(401).json({ error: "Not authenticated" })
    }
    
    // Get query parameters for filtering
    const { contactId, teamId } = req.query
    
    // Get the Rewards Claimed table ID from environment variables
    const rewardsClaimedTableId = process.env.AIRTABLE_REWARDS_CLAIMED_TABLE_ID
    if (!rewardsClaimedTableId) {
      return res.status(500).json({ 
        error: "Rewards Claimed table not configured",
        claimedRewards: []
      })
    }
    
    // Initialize the rewards claimed table
    const rewardsClaimedTable = base(rewardsClaimedTableId)
    
    // Build filter formula based on provided parameters
    let filterFormula = ""
    
    if (contactId && teamId) {
      // Filter by both contact and team using dedicated ID fields with FIND
      filterFormula = `OR(
        FIND("${contactId}", {contactId}),
        FIND("${teamId}", {teamId})
      )`
    } else if (contactId) {
      // Filter by contact only using dedicated ID field with FIND
      filterFormula = `FIND("${contactId}", {contactId})`
    } else if (teamId) {
      // Filter by team only using dedicated ID field with FIND
      filterFormula = `FIND("${teamId}", {teamId})`
    } else {
      // If no filters provided, just return a limited number of recent claims
      filterFormula = "TRUE()"
    }
    
    console.log(`Fetching claimed rewards with filter: ${filterFormula}`)
    
    // Query the rewards claimed table
    const records = await rewardsClaimedTable
      .select({
        filterByFormula: filterFormula,
        sort: [{ field: "Date Claimed", direction: "desc" }],
        maxRecords: contactId || teamId ? 100 : 20 // Limit to 20 if no filters for performance
      })
      .firstPage()
    
    console.log(`Found ${records.length} claimed rewards`)
    
    // Process the claimed rewards
    const claimedRewards = records.map(record => ({
      id: record.id,
      dateClaimed: record.fields["Date Claimed"] || null,
      notes: record.fields.Notes || "",
      rewardId: record.fields.Rewards && record.fields.Rewards.length > 0 
        ? record.fields.Rewards[0] 
        : null,
      contactId: record.fields.Contacts && record.fields.Contacts.length > 0
        ? record.fields.Contacts[0]
        : null,
      teamId: record.fields.Teams && record.fields.Teams.length > 0
        ? record.fields.Teams[0]
        : null
    }))
    
    // Return the formatted claimed rewards
    return res.status(200).json({
      claimedRewards,
      meta: {
        count: claimedRewards.length,
        filters: {
          contactId: contactId || null,
          teamId: teamId || null
        }
      }
    })
  } catch (error) {
    console.error("Error fetching claimed rewards:", error)
    return res.status(500).json({ 
      error: "Failed to fetch claimed rewards", 
      details: error.message,
      claimedRewards: []
    })
  }
}

export default withApiAuthRequired(handler)