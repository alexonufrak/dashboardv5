import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0"
import { base } from "@/lib/airtable"
import { getUserProfile } from "@/lib/airtable"

/**
 * API endpoint to get a user's active program participation
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
    
    // Get the user profile using the email
    const profile = await getUserProfile(null, session.user.email)
    if (!profile || !profile.contactId) {
      return res.status(404).json({ error: "User profile not found" })
    }
    
    console.log(`Looking up participation for contact ID: "${profile.contactId}"`)
    
    // Get the Participation table ID from environment variables
    const participationTableId = process.env.AIRTABLE_PARTICIPATION_TABLE_ID
    if (!participationTableId) {
      return res.status(500).json({ error: "Participation table not configured" })
    }
    
    // Initialize the participation table
    const participationTable = base(participationTableId)
    
    // Get the cohorts table for looking up cohort information
    const cohortsTableId = process.env.AIRTABLE_COHORTS_TABLE_ID
    if (!cohortsTableId) {
      return res.status(500).json({ error: "Cohorts table not configured" })
    }
    
    // Initialize the cohorts table
    const cohortsTable = base(cohortsTableId)
    
    // Get the initiatives table for looking up initiative information
    const initiativesTableId = process.env.AIRTABLE_INITIATIVES_TABLE_ID
    if (!initiativesTableId) {
      return res.status(500).json({ error: "Initiatives table not configured" })
    }
    
    // Initialize the initiatives table
    const initiativesTable = base(initiativesTableId)
    
    // Get the topics table for looking up topic information
    const topicsTableId = process.env.AIRTABLE_TOPICS_TABLE_ID
    if (!topicsTableId) {
      return res.status(500).json({ error: "Topics table not configured" })
    }
    
    // Initialize the topics table
    const topicsTable = base(topicsTableId)
    
    // Get the user's active participation records
    let participationRecords = []
    
    try {
      // Sanitize the contact ID to prevent formula injection
      const safeContactId = profile.contactId.replace(/['"\\]/g, '');
      
      // Use SEARCH instead of FIND for more reliable record matching
      // Focus on the 'Contacts' field which is confirmed to exist in Airtable
      const formula = `SEARCH("${safeContactId}", {contactId})`;
      
      console.log(`Using formula: ${formula}`);
      
      const records = await participationTable.select({
        filterByFormula: formula,
        sort: [{ field: "Last Modified", direction: "desc" }]
      }).firstPage();
      
      console.log(`Formula found ${records.length} records`);
      participationRecords = [...records];
    } catch (err) {
      console.error("Error querying participation records:", err);
    }
    
    // If no records found with SEARCH formula, try direct equality matching
    if (participationRecords.length === 0) {
      try {
        console.log("Trying direct equality matching...");
        const safeContactId = profile.contactId.replace(/['"\\]/g, '');
        
        // Try direct equality with Contacts field (most reliable for record IDs)
        const directFormula = `{Contacts} = "${safeContactId}"`;
        
        const records = await participationTable.select({
          filterByFormula: directFormula,
          sort: [{ field: "Last Modified", direction: "desc" }]
        }).firstPage();
        
        console.log(`Direct equality formula found ${records.length} records`);
        participationRecords = [...records];
      } catch (err) {
        console.error("Error using direct equality formula:", err);
      }
    }
    
    // If still no records, use client-side filtering as fallback
    if (participationRecords.length === 0) {
      console.log("No records found with formulas. Using client-side filtering as fallback...");
      
      // Get a limited set of records (for performance)
      const allParticipationRecords = await participationTable.select({
        maxRecords: 100,
        sort: [{ field: "Last Modified", direction: "desc" }]
      }).firstPage();
      
      // Client-side filtering focusing on the Contacts field (array of record IDs)
      participationRecords = allParticipationRecords.filter(record => {
        // If Contacts is an array and it includes the contact ID
        if (record.fields.Contacts && Array.isArray(record.fields.Contacts)) {
          return record.fields.Contacts.includes(profile.contactId);
        }
        return false;
      });
      
      console.log(`Client-side filtering found ${participationRecords.length} matching records`);
    }
    
    // Check if we found any participation records
    if (!participationRecords || participationRecords.length === 0) {
      console.log(`No participation records found for contact ${profile.contactId}`);
      return res.status(200).json({ participation: [] });
    }
    
    // Process each participation record to get associated cohort and team info
    const processedParticipation = [];
    
    for (const participationRecord of participationRecords) {
      // Extract cohort IDs from the participation record
      // Handle both singular "Cohort" and plural "Cohorts" field names
      const cohortIds = participationRecord.fields.Cohorts || 
                       (participationRecord.fields.Cohort ? [participationRecord.fields.Cohort] : []);
      
      if (cohortIds.length === 0) {
        console.log(`Skipping participation record ${participationRecord.id} - no cohorts found`);
        continue; // Skip participation records with no cohorts
      }
      
      // Process each cohort for this participation record
      for (const cohortId of cohortIds) {
        try {
          // Get cohort details
          const cohort = await cohortsTable.find(cohortId);
          
          // Extract initiative IDs from the cohort
          const initiativeIds = cohort.fields.Initiative || [];
          
          // Get initiative details if available
          let initiativeDetails = null;
          if (initiativeIds.length > 0) {
            try {
              const initiative = await initiativesTable.find(initiativeIds[0]);
              
              // Extract participation type with fallback
              let participationType = "Individual";
              if (initiative.fields["Participation Type"]) {
                const rawType = String(initiative.fields["Participation Type"]);
                participationType = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
              }
              
              initiativeDetails = {
                id: initiative.id,
                name: initiative.fields.Name || "Untitled Initiative",
                description: initiative.fields.Description || "",
                "Participation Type": participationType
              };
            } catch (err) {
              console.error(`Error fetching initiative ${initiativeIds[0]}:`, err);
              // Continue with null initiative details rather than failing
            }
          }
          
          // Get topic information if available
          const topicIds = cohort.fields.Topics || [];
          const topicNames = [];
          
          // Limit topic lookups to reduce API calls if there are many
          const topicsToLookup = topicIds.slice(0, 5); // Limit to first 5 topics
          
          for (const topicId of topicsToLookup) {
            try {
              const topic = await topicsTable.find(topicId);
              topicNames.push(topic.fields.Name || "Unknown Topic");
            } catch (err) {
              console.error(`Error fetching topic ${topicId}:`, err);
            }
          }
          
          // Get team information if applicable
          let teamId = null;
          
          // If this is a team-based program, find the user's team
          const isTeamBased = initiativeDetails && 
                             (initiativeDetails["Participation Type"] === "Team" || 
                              initiativeDetails["Participation Type"].toLowerCase().includes("team"));
          
          if (isTeamBased) {
            const teamsTableId = process.env.AIRTABLE_TEAMS_TABLE_ID;
            const membersTableId = process.env.AIRTABLE_MEMBERS_TABLE_ID;
            
            if (teamsTableId && membersTableId) {
              // Initialize required tables
              const teamsTable = base(teamsTableId);
              const membersTable = base(membersTableId);
              
              // Find the member records for this user
              const safeContactId = profile.contactId.replace(/['"\\]/g, '');
              try {
                const memberRecords = await membersTable
                  .select({
                    filterByFormula: `{contactId} = "${safeContactId}"`,
                    fields: ["Team", "Status"]
                  })
                  .firstPage();
                
                // Process active member records to find teams in this cohort
                for (const memberRecord of memberRecords) {
                  if (memberRecord.fields.Status === "Active" && 
                      memberRecord.fields.Team && 
                      memberRecord.fields.Team.length > 0) {
                    
                    // For each team, check if it's associated with this cohort
                    for (const possibleTeamId of memberRecord.fields.Team) {
                      try {
                        const team = await teamsTable.find(possibleTeamId);
                        
                        // Check if this team is associated with the cohort using various field patterns
                        const teamCohortIds = team.fields.Cohorts || team.fields.Cohort || team.fields.cohortId || [];
                        const teamCohortIdsArray = Array.isArray(teamCohortIds) ? teamCohortIds : [teamCohortIds];
                        
                        // If this team is associated with the current cohort, use it
                        if (teamCohortIdsArray.includes(cohortId)) {
                          teamId = team.id;
                          break;
                        }
                      } catch (err) {
                        console.error(`Error checking team ${possibleTeamId}:`, err);
                      }
                    }
                    
                    // If we found a team, no need to check other member records
                    if (teamId) break;
                  }
                }
              } catch (err) {
                console.error("Error fetching member records:", err);
              }
            }
          }
          
          // Extract and normalize cohort dates and status
          const startDate = cohort.fields["Start Date"] || null;
          const endDate = cohort.fields["End Date"] || null;
          
          // Determine if cohort is current based on dates and status fields
          let isCurrent = false;
          
          // Check date-based currency
          if (startDate && endDate) {
            const now = new Date();
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);
            if (now >= startDateObj && now <= endDateObj) {
              isCurrent = true;
            }
          }
          
          // Check field-based currency (override if explicitly marked as current)
          // Handle both common field names for current status
          const currentCohortField = cohort.fields["Current Cohort"];
          const isCurrentField = cohort.fields["Is Current"];
          
          // Process various formats for "true" values
          const isTrueValue = (value) => {
            if (value === true || value === 1) return true;
            if (typeof value === "string" && ["true", "yes"].includes(value.toLowerCase())) return true;
            return false;
          };
          
          if (isTrueValue(currentCohortField) || isTrueValue(isCurrentField)) {
            isCurrent = true;
          }
          
          // Add to processed participation with all required fields
          processedParticipation.push({
            id: participationRecord.id,
            capacity: participationRecord.fields.Capacity || "Participant",
            cohort: {
              id: cohort.id,
              name: cohort.fields.Name || "Unnamed Cohort",
              Short_Name: cohort.fields["Short Name"] || "",
              Status: cohort.fields.Status || "Unknown",
              "Start Date": startDate,
              "End Date": endDate,
              "Current Cohort": isCurrent,
              initiativeDetails,
              topicNames,
              participationType: initiativeDetails ? initiativeDetails["Participation Type"] : "Individual"
            },
            teamId
          });
        } catch (err) {
          console.error(`Error processing cohort ${cohortId}:`, err);
          // Continue with other cohorts rather than failing the entire request
        }
      }
    }
    
    // Log the processed results
    console.log(`Successfully processed ${processedParticipation.length} participation records`);
    if (processedParticipation.length === 0) {
      console.log("No processed participation records available to return");
    }
    
    // Return the processed participation records
    return res.status(200).json({
      participation: processedParticipation
    });
  } catch (error) {
    console.error("Error fetching participation:", error);
    return res.status(500).json({ error: "Failed to fetch participation", details: error.message });
  }
})