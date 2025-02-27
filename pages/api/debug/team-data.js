// pages/api/debug/team-data.js
import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0"
import { getUserProfile } from "../../../lib/airtable"
import Airtable from "airtable"

async function handler(req, res) {
  const session = await getSession(req, res)
  if (!session || !session.user) {
    return res.status(401).json({ error: "Not authenticated" })
  }

  try {
    // Get the user's contact ID
    const email = session.user.email;
    const userProfile = await getUserProfile(null, email);
    const contactId = userProfile?.contactId;

    if (!contactId) {
      return res.status(404).json({
        error: "User contact not found",
        userProfile
      });
    }

    // Initialize Airtable
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    
    // Get tables
    const membersTableId = process.env.AIRTABLE_MEMBERS_TABLE_ID;
    const teamsTableId = process.env.AIRTABLE_TEAMS_TABLE_ID;
    
    // Check if table IDs are configured
    const tableConfig = {
      membersTableId: Boolean(membersTableId),
      teamsTableId: Boolean(teamsTableId)
    };
    
    // Debug info to return
    const debugInfo = {
      contactId,
      tableConfig,
      memberRecords: [],
      teamRecords: []
    };
    
    // Try to get membership records directly
    if (membersTableId) {
      try {
        const membersTable = base(membersTableId);
        const memberRecords = await membersTable.select({
          filterByFormula: `{Contact}="${contactId}"`
        }).firstPage();
        
        debugInfo.memberRecords = memberRecords.map(record => ({
          id: record.id,
          fields: record.fields
        }));
      } catch (error) {
        debugInfo.memberError = error.message;
      }
    }

    // Try to get teams directly if there are member records with team references
    if (teamsTableId && debugInfo.memberRecords.length > 0) {
      try {
        const teamsTable = base(teamsTableId);
        
        // Extract team IDs from member records
        const teamIds = [];
        debugInfo.memberRecords.forEach(record => {
          if (record.fields.Team && record.fields.Team.length > 0) {
            teamIds.push(record.fields.Team[0]);
          }
        });
        
        if (teamIds.length > 0) {
          // Get the first team
          const teamRecord = await teamsTable.find(teamIds[0]);
          debugInfo.teamRecords.push({
            id: teamRecord.id,
            fields: teamRecord.fields
          });
        }
      } catch (error) {
        debugInfo.teamError = error.message;
      }
    }

    return res.status(200).json(debugInfo);
  } catch (error) {
    console.error("Debug error:", error);
    return res.status(500).json({ error: "Debug error", message: error.message });
  }
}

export default withApiAuthRequired(handler);