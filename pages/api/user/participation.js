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
    
    // Get the user's active participation records - simplified approach with a single reliable method
    let participationRecords = []
    
    try {
      // Sanitize the contact ID to prevent formula injection
      const safeContactId = profile.contactId.replace(/['"\\]/g, '');
      
      // Debug: Log the tables and fields to better understand the data structure
      console.log("Debugging participation lookup:");
      try {
        // Get a sample record to see field names
        const sampleRecords = await participationTable.select({
          maxRecords: 1
        }).firstPage();
        
        if (sampleRecords.length > 0) {
          console.log("Sample participation record fields:", Object.keys(sampleRecords[0].fields));
        }
      } catch (err) {
        console.error("Error getting sample record:", err);
      }
      
      // Try a simpler approach first - fetch without filtering and log all records
      console.log("Fetching all records to manually check for matches:");
      const allRecords = await participationTable.select({
        sort: [{ field: "Last Modified", direction: "desc" }],
        maxRecords: 100
      }).firstPage();
      
      console.log(`Found ${allRecords.length} total participation records to examine`);
      
      // Log details about each record to find matches
      allRecords.forEach(record => {
        const hasStatus = record.fields.Status !== undefined;
        const status = record.fields.Status || "(empty)";
        const contacts = record.fields.Contacts || "(none)";
        const contactId = record.fields.contactId || "(none)";
        
        console.log(`Record ${record.id}: Status=${status}, Contacts=${JSON.stringify(contacts)}, contactId=${contactId}`);
        
        // Check if this record should match our criteria
        const shouldMatch = (
          (Array.isArray(contacts) && contacts.includes(safeContactId)) ||
          (typeof contacts === 'string' && contacts === safeContactId) ||
          (typeof contactId === 'string' && contactId.includes(safeContactId))
        ) && (
          !hasStatus || status === "Active" || status === ""
        );
        
        if (shouldMatch) {
          console.log(`Record ${record.id} SHOULD MATCH our criteria`);
        }
      });
      
      // Define a standardized formula that works reliably
      // Use OR with multiple approaches to maximize chances of finding matching records
      // Only include records with Status="Active" or empty Status (for backward compatibility)
      const formula = `AND(
        OR(
          {Contacts} = "${safeContactId}",
          SEARCH("${safeContactId}", {contactId})
        ), 
        OR({Status}="Active", {Status}="")
      )`;
      
      console.log(`Using consolidated formula for participation lookup: ${formula.replace(/\s+/g, ' ')}`);
      
      const records = await participationTable.select({
        filterByFormula: formula,
        sort: [{ field: "Last Modified", direction: "desc" }]
      }).firstPage();
      
      console.log(`Found ${records.length} active participation records for contact ${profile.contactId}`);
      participationRecords = [...records];
      
      // If no records found with the formula, implement a fallback by manually filtering
      if (participationRecords.length === 0) {
        console.log(`No active participation records found with formula - using manual filter fallback`);
        
        // Find matching records by manually examining all records we fetched above
        const matchingRecords = allRecords.filter(record => {
          const status = record.fields.Status || "";
          const contacts = record.fields.Contacts || [];
          const contactId = record.fields.contactId || "";
          
          // Check if the record is related to this user
          const isUserRecord = (
            (Array.isArray(contacts) && contacts.includes(safeContactId)) ||
            (typeof contacts === 'string' && contacts === safeContactId) ||
            (typeof contactId === 'string' && contactId.includes(safeContactId))
          );
          
          // Check if status is active or unset
          const isActive = status === "Active" || status === "";
          
          return isUserRecord && isActive;
        });
        
        if (matchingRecords.length > 0) {
          console.log(`Found ${matchingRecords.length} matching records using manual filter`);
          participationRecords = matchingRecords;
        } else {
          console.log(`No active participation records found for contact ${profile.contactId} even with manual filter`);
        }
      }
    } catch (err) {
      console.error("Error querying participation records:", err);
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
          // Extract all useful fields from the participation record
          const pStatus = participationRecord.fields.Status || 'Active';
          const pCapacity = participationRecord.fields.Capacity || "Participant";
          
          // Only include active participation records - important for filtering
          if (pStatus.toLowerCase() === 'active') {
            processedParticipation.push({
              id: participationRecord.id,
              recordId: participationRecord.id, // Duplicate for consistency
              status: pStatus,
              capacity: pCapacity,
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
              teamId,
              recordFields: {
                // Include other important participation record fields
                created: participationRecord.fields['Created'] || null,
                modified: participationRecord.fields['Modified'] || null,
                notes: participationRecord.fields['Notes'] || null,
                // Normalize important fields
                Status: pStatus,
                Capacity: pCapacity
              }
            });
          } else {
            console.log(`Skipping inactive participation record ${participationRecord.id} with Status=${pStatus}`);
          }
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