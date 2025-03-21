import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0"
import { base } from "@/lib/airtable"

/**
 * API endpoint to get achievements data from Airtable
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 */
export default async function handler(req, res) {
  try {
    // Get the current session and user
    const session = await auth0.getSession(req)
    if (!session?.user) {
      return res.status(401).json({ error: "Not authenticated" })
    }
    
    // Get the Achievements table ID from environment variables
    const achievementsTableId = process.env.AIRTABLE_ACHIEVEMENTS_TABLE_ID
    if (!achievementsTableId) {
      return res.status(500).json({ 
        error: "Achievements table not configured",
        achievements: []
      })
    }
    
    // Initialize the achievements table
    const achievementsTable = base(achievementsTableId)
    
    console.log("Fetching achievements data")
    
    // Query the achievements table
    const records = await achievementsTable
      .select({
        sort: [{ field: "Points Value", direction: "desc" }]
      })
      .firstPage()
    
    console.log(`Found ${records.length} achievements`)
    
    // Process the achievements
    const achievements = records.map(record => ({
      id: record.id,
      name: record.fields.Name || `Achievement ${record.id}`,
      description: record.fields.Description || "",
      pointsValue: record.fields["Points Value"] ? Number(record.fields["Points Value"]) : 0,
      type: record.fields.Type || null,
      airtableId: record.fields["Airtable ID"] || record.id,
      eventId: record.fields.Events && record.fields.Events.length > 0 
        ? record.fields.Events[0] 
        : null
    }))
    
    // Return the formatted achievements
    return res.status(200).json({
      achievements,
      meta: {
        count: achievements.length
      }
    })
  } catch (error) {
    console.error("Error fetching achievements:", error)
    return res.status(500).json({ 
      error: "Failed to fetch achievements", 
      details: error.message,
      achievements: []
    })
  }
}