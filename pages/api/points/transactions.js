import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0"
import { base } from "@/lib/airtable"

/**
 * API endpoint to get point transactions data from Airtable
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
    
    // Get query parameters for filtering
    const { contactId, teamId } = req.query
    
    // Get the Point Transactions table ID from environment variables
    const pointTransactionsTableId = process.env.AIRTABLE_POINT_TRANSACTIONS_TABLE_ID
    if (!pointTransactionsTableId) {
      return res.status(500).json({ 
        error: "Point Transactions table not configured",
        transactions: []
      })
    }
    
    // Initialize the point transactions table
    const pointTransactionsTable = base(pointTransactionsTableId)
    
    // Build filter formula based on provided parameters
    let filterFormula = ""
    
    if (contactId && teamId) {
      // Filter by both contact and team
      filterFormula = `OR(
        AND({Contacts} = "${contactId}"),
        AND({Teams} = "${teamId}")
      )`
    } else if (contactId) {
      // Filter by contact only
      filterFormula = `{Contacts} = "${contactId}"`
    } else if (teamId) {
      // Filter by team only
      filterFormula = `{Teams} = "${teamId}"`
    } else {
      // If no filters provided, just return a limited number of recent transactions
      filterFormula = "TRUE()"
    }
    
    console.log(`Fetching point transactions with filter: ${filterFormula}`)
    
    // Query the point transactions table
    const records = await pointTransactionsTable
      .select({
        filterByFormula: filterFormula,
        sort: [{ field: "Date", direction: "desc" }],
        maxRecords: contactId || teamId ? 100 : 20 // Limit to 20 if no filters for performance
      })
      .firstPage()
    
    console.log(`Found ${records.length} point transactions`)
    
    // Process the transactions
    const transactions = records.map(record => ({
      id: record.id,
      date: record.fields.Date || null,
      description: record.fields.Description || "",
      achievementId: record.fields.Achievements && record.fields.Achievements.length > 0 
        ? record.fields.Achievements[0] 
        : null,
      achievementName: record.fields["Name (from Achievements)"] 
        ? record.fields["Name (from Achievements)"][0] 
        : null,
      pointsValue: record.fields["Points Value (from Achievements)"] 
        ? Number(record.fields["Points Value (from Achievements)"][0]) 
        : 0,
      contactId: record.fields.Contacts && record.fields.Contacts.length > 0
        ? record.fields.Contacts[0]
        : null,
      teamId: record.fields.Teams && record.fields.Teams.length > 0
        ? record.fields.Teams[0]
        : null,
      assigned: record.fields.Assigned || false
    }))
    
    // Return the formatted transactions
    return res.status(200).json({
      transactions,
      meta: {
        count: transactions.length,
        filters: {
          contactId: contactId || null,
          teamId: teamId || null
        }
      }
    })
  } catch (error) {
    console.error("Error fetching point transactions:", error)
    return res.status(500).json({ 
      error: "Failed to fetch point transactions", 
      details: error.message,
      transactions: []
    })
  }
})