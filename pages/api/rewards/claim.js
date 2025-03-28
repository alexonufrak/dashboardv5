import { auth0 } from "@/lib/auth0"
import { base } from "@/lib/airtable"

/**
 * API endpoint to claim a reward
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 */
async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" })
  }
  
  try {
    // Get the current session and user
    const session = await getSession(req, res)
    if (!session?.user) {
      return res.status(401).json({ error: "Not authenticated" })
    }
    
    // Get the Rewards and Rewards Claimed table IDs from environment variables
    const rewardsTableId = process.env.AIRTABLE_REWARDS_TABLE_ID
    const rewardsClaimedTableId = process.env.AIRTABLE_REWARDS_CLAIMED_TABLE_ID
    
    if (!rewardsTableId || !rewardsClaimedTableId) {
      return res.status(500).json({ error: "Rewards tables not configured" })
    }
    
    // Initialize the tables
    const rewardsTable = base(rewardsTableId)
    const rewardsClaimedTable = base(rewardsClaimedTableId)
    
    // Extract required data from request body
    const { rewardId, teamId, contactId, notes } = req.body
    
    if (!rewardId) {
      return res.status(400).json({ error: "Reward ID is required" })
    }
    
    if (!teamId && !contactId) {
      return res.status(400).json({ error: "Either Team ID or Contact ID is required" })
    }
    
    // Check if the reward exists and is available
    const reward = await rewardsTable.find(rewardId).catch(() => null)
    if (!reward) {
      return res.status(404).json({ error: "Reward not found" })
    }
    
    // Check availability
    const noCap = reward.fields["No Cap"] || false
    let remaining = 0
    
    if (!noCap) {
      remaining = reward.fields["RewardsRemaining"] 
        ? Number(reward.fields["RewardsRemaining"]) 
        : 0
        
      if (remaining <= 0) {
        return res.status(400).json({ error: "This reward is no longer available" })
      }
    }
    
    // Create the claim record
    const newClaim = {
      "Rewards": [rewardId],
      "Date Claimed": new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      "Notes": notes || ""
    }
    
    // Add either teamId or contactId (or both if provided)
    if (teamId) {
      newClaim["Teams"] = [teamId]
    }
    
    if (contactId) {
      newClaim["Contacts"] = [contactId]
    }
    
    console.log(`Creating reward claim for reward ${rewardId}`)
    
    // Create the claim in Airtable
    const createdClaim = await rewardsClaimedTable.create(newClaim)
    
    console.log(`Successfully created claim with ID: ${createdClaim.id}`)
    
    // Return success response
    return res.status(201).json({
      success: true,
      claim: {
        id: createdClaim.id,
        rewardId,
        teamId: teamId || null,
        contactId: contactId || null,
        dateClaimed: createdClaim.fields["Date Claimed"] || new Date().toISOString().split('T')[0],
        notes: createdClaim.fields.Notes || ""
      }
    })
  } catch (error) {
    console.error("Error claiming reward:", error)
    return res.status(500).json({ 
      error: "Failed to claim reward", 
      details: error.message
    })
  }
}

export default withApiAuthRequired(handler)