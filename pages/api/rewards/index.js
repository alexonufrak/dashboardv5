import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0"
import { base } from "@/lib/airtable"

/**
 * API endpoint to get available rewards data from Airtable
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
    
    // Get the Rewards table ID from environment variables
    const rewardsTableId = process.env.AIRTABLE_REWARDS_TABLE_ID
    if (!rewardsTableId) {
      return res.status(500).json({ 
        error: "Rewards table not configured",
        rewards: []
      })
    }
    
    // Initialize the rewards table
    const rewardsTable = base(rewardsTableId)
    
    console.log("Fetching available rewards data")
    
    // Query the rewards table and get only available rewards
    const records = await rewardsTable
      .select({
        // Filter to only include rewards that are available (either no cap or still have remaining)
        filterByFormula: "OR({No Cap} = 1, {RewardsRemaining} > 0)",
        sort: [{ field: "Cost", direction: "asc" }]
      })
      .firstPage()
    
    console.log(`Found ${records.length} available rewards`)
    
    // Process the rewards
    const rewards = records.map(record => ({
      id: record.id,
      name: record.fields.Name || `Reward ${record.id}`,
      cost: record.fields.Cost ? Number(record.fields.Cost) : 0,
      numberAvailable: record.fields["Number Available"] 
        ? Number(record.fields["Number Available"]) 
        : null,
      noCap: record.fields["No Cap"] || false,
      remaining: record.fields["RewardsRemaining"] 
        ? Number(record.fields["RewardsRemaining"]) 
        : (record.fields["No Cap"] ? null : 0)
    }))
    
    // Return the formatted rewards
    return res.status(200).json({
      rewards,
      meta: {
        count: rewards.length
      }
    })
  } catch (error) {
    console.error("Error fetching rewards:", error)
    return res.status(500).json({ 
      error: "Failed to fetch rewards", 
      details: error.message,
      rewards: []
    })
  }
})