// pages/api/debug/team-data.js
import { auth0 } from "@/lib/auth0"
import { getUserProfile } from "../../../lib/airtable"
import Airtable from "airtable"

async function handler(req, res) {
  const session = await auth0.getSession(req)
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
    
    // Get tables and their IDs
    const membersTableId = process.env.AIRTABLE_MEMBERS_TABLE_ID;
    const teamsTableId = process.env.AIRTABLE_TEAMS_TABLE_ID;
    
    // Check if table IDs are configured
    const tableConfig = {
      membersTableId: Boolean(membersTableId),
      teamsTableId: Boolean(teamsTableId),
      actualMembersTableId: membersTableId,
      actualTeamsTableId: teamsTableId
    };
    
    // Debug info to return
    const debugInfo = {
      contactId,
      email,
      tableConfig,
      memberRecords: [],
      teamRecords: [],
      allTeamFields: [],
      envVariables: {
        AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY ? "Set (hidden)" : "Not set",
        AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID ? "Set" : "Not set",
        AIRTABLE_MEMBERS_TABLE_ID: process.env.AIRTABLE_MEMBERS_TABLE_ID ? "Set" : "Not set",
        AIRTABLE_TEAMS_TABLE_ID: process.env.AIRTABLE_TEAMS_TABLE_ID ? "Set" : "Not set",
      },
      membershipTestResults: {}
    };
    
    // Try to get membership records directly
    if (membersTableId) {
      try {
        const membersTable = base(membersTableId);
        
        // First, check if we can access the Members table at all
        try {
          // Get the first record just to test access
          const testRecord = await membersTable.select({
            maxRecords: 1
          }).firstPage();
          debugInfo.membershipTestResults.canAccessMembersTable = testRecord.length > 0;
          
          // If we can access the table, save the field names of the first record
          if (testRecord.length > 0) {
            debugInfo.membershipTestResults.memberTableFields = Object.keys(testRecord[0].fields);
          }
        } catch (error) {
          debugInfo.membershipTestResults.canAccessMembersTable = false;
          debugInfo.membershipTestResults.membersTableAccessError = error.message;
        }
        
        // Now try to get the actual member records for this user
        try {
          // Try with Contact field
          const memberRecordsWithContact = await membersTable.select({
            filterByFormula: `{Contact}="${contactId}"`
          }).firstPage();
          
          debugInfo.membershipTestResults.contactFieldLookupResult = 
            memberRecordsWithContact.length > 0 ? "Records found" : "No records found";
          debugInfo.membershipTestResults.contactFieldLookupCount = memberRecordsWithContact.length;
          
          if (memberRecordsWithContact.length > 0) {
            // Save these as the member records
            debugInfo.memberRecords = memberRecordsWithContact.map(record => ({
              id: record.id,
              fields: record.fields
            }));
          }
        } catch (error) {
          debugInfo.membershipTestResults.contactFieldLookupError = error.message;
        }
        
        // If no member records found with Contact field, try with "Contact" field name variations
        if (debugInfo.memberRecords.length === 0) {
          try {
            const memberRecordsWithContactAlt = await membersTable.select({
              filterByFormula: `{Contacts}="${contactId}"`
            }).firstPage();
            
            debugInfo.membershipTestResults.contactsFieldLookupResult = 
              memberRecordsWithContactAlt.length > 0 ? "Records found" : "No records found";
            debugInfo.membershipTestResults.contactsFieldLookupCount = memberRecordsWithContactAlt.length;
            
            if (memberRecordsWithContactAlt.length > 0) {
              // Save these as the member records
              debugInfo.memberRecords = memberRecordsWithContactAlt.map(record => ({
                id: record.id,
                fields: record.fields
              }));
            }
          } catch (error) {
            debugInfo.membershipTestResults.contactsFieldLookupError = error.message;
          }
        }
      } catch (error) {
        debugInfo.memberError = error.message;
      }
    }

    // Try to get teams directly if there are member records with team references
    if (teamsTableId && debugInfo.memberRecords.length > 0) {
      try {
        const teamsTable = base(teamsTableId);
        
        // First, check if we can access the Teams table
        try {
          const testTeamRecord = await teamsTable.select({
            maxRecords: 1
          }).firstPage();
          
          debugInfo.teamTableAccessible = testTeamRecord.length > 0;
          
          // If we can access the table, save the field names of the first record
          if (testTeamRecord.length > 0) {
            debugInfo.allTeamFields = Object.keys(testTeamRecord[0].fields);
          }
        } catch (error) {
          debugInfo.teamTableAccessible = false;
          debugInfo.teamTableAccessError = error.message;
        }
        
        // Now extract team IDs from member records using various possible field names
        const teamIds = [];
        
        // Function to safely extract team IDs with different possible field names
        const extractTeamIds = (record, fieldNames) => {
          for (const fieldName of fieldNames) {
            if (record.fields[fieldName] && Array.isArray(record.fields[fieldName]) && record.fields[fieldName].length > 0) {
              return record.fields[fieldName];
            }
          }
          return [];
        };
        
        debugInfo.memberRecords.forEach(record => {
          // Try different possible field names for teams
          const possibleTeamIds = extractTeamIds(record, ['Team', 'Teams', 'team', 'teams']);
          possibleTeamIds.forEach(id => {
            if (!teamIds.includes(id)) {
              teamIds.push(id);
            }
          });
        });
        
        debugInfo.extractedTeamIds = teamIds;
        
        // Try to get each team
        for (const teamId of teamIds) {
          try {
            const teamRecord = await teamsTable.find(teamId);
            debugInfo.teamRecords.push({
              id: teamRecord.id,
              fields: teamRecord.fields
            });
          } catch (error) {
            debugInfo.teamLookupErrors = debugInfo.teamLookupErrors || {};
            debugInfo.teamLookupErrors[teamId] = error.message;
          }
        }
      } catch (error) {
        debugInfo.teamError = error.message;
      }
    }
    
    // Analyze member records to see if they have active status
    // if (debugInfo.memberRecords.length > 0) {
    //   const activeMembers = debugInfo.memberRecords.filter(
    //     record => record.fields.Status === "Active"
    //   );
    //   
    //   debugInfo.memberAnalysis = {
    //     totalMembers: debugInfo.memberRecords.length,
    //     activeMembers: activeMembers.length,
    //     inactiveMembers: debugInfo.memberRecords.length - activeMembers.length,
    //     statuses: debugInfo.memberRecords.map(record => record.fields.Status)
    //   };
    // }

    return res.status(200).json(debugInfo);
  } catch (error) {
    console.error("Debug error:", error);
    return res.status(500).json({ error: "Debug error", message: error.message });
  }
}

export default withApiAuthRequired(handler);