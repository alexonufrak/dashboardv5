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
    
    // Add this right after getting the profile
    console.log(`Looking up participation for contact ID: "${profile.contactId}"`)
    console.log(`Contact profile details:`, {
      email: session.user.email,
      contactId: profile.contactId,
      name: profile.name || 'Not available'
    })
    
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

    // Try multiple approaches for finding the participation records

    // First, dump all participation records to inspect the structure
    console.log("Retrieving participation records to inspect structure...")
    const allRecords = await participationTable.select({
      maxRecords: 5, // Just get a few to inspect
    }).firstPage()

    // Check how contacts are stored in the records
    if (allRecords.length > 0) {
      const firstRecord = allRecords[0]
      console.log("Sample participation record fields:", firstRecord.fields)
      console.log("Contacts field type:", typeof firstRecord.fields.Contacts)
      
      if (firstRecord.fields.Contacts) {
        if (Array.isArray(firstRecord.fields.Contacts)) {
          console.log("Contacts stored as array:", firstRecord.fields.Contacts)
        } else {
          console.log("Contacts stored as string:", firstRecord.fields.Contacts)
        }
      } else {
        console.log("No Contacts field found in record")
        // Check for other possible field names
        console.log("Available fields:", Object.keys(firstRecord.fields))
      }
    }

    // Based on the Airtable schema, the field is called "Contacts" (plural)
    // and it's a multipleRecordLinks field, so we need to check if it contains
    // the contact ID as a record reference
    
    // Enhanced debugging for participation lookup
    console.log(`Looking for participation records with contactId="${profile.contactId}"`)
    
    // Use FIND for exact matching with record IDs
    // This works reliably for finding record IDs in linked record fields
    const formula = `OR(
      FIND("${profile.contactId}", {contactId}),
      FIND("${profile.contactId}", {Contacts})
    )`
    
    console.log(`Using formula: ${formula}`)

    // Try using our primary formula that should work with multipleRecordLinks fields
    console.log("Querying participation records with Contacts linking to contact ID...")
    
    try {
      let records = await participationTable.select({
        filterByFormula: formula,
        sort: [{ field: "Last Modified", direction: "desc" }]
      }).firstPage()
      
      console.log(`Formula found ${records.length} records`)
      participationRecords = [...records]
    } catch (err) {
      console.error("Error using primary formula:", err)
    }
    
    // If no records found, try an alternative approach with FIND
    if (participationRecords.length === 0) {
      try {
        console.log("Trying alternative FIND approach...")
        // Try even simpler formula as a fallback
        // Use FIND for reliable record ID matching
        const directFormula = `FIND("${profile.contactId}", {Contacts})`
        
        let records = await participationTable.select({
          filterByFormula: directFormula,
          sort: [{ field: "Last Modified", direction: "desc" }]
        }).firstPage()
        
        console.log(`Alternative formula found ${records.length} records`)
        participationRecords = [...records]
      } catch (err) {
        console.error("Error using alternative formula:", err)
      }
    }
    
    // Fall back to getting all records and filtering on the client side
    if (participationRecords.length === 0) {
      console.log("No records found with formulas. Fetching and filtering records manually...")
    }
    
    // Try one more approach - direct API call to get all records and filter client-side
    if (participationRecords.length === 0) {
      console.log("Trying client-side filtering approach...")
      
      // Get all records (limited to 100 for performance)
      const allParticipationRecords = await participationTable.select({
        maxRecords: 100,
        sort: [{ field: "Last Modified", direction: "desc" }]
      }).firstPage()
      
      console.log(`Retrieved ${allParticipationRecords.length} total participation records`)
      
      // Client-side filtering logic - focusing on the "Contacts" field that we know exists
      participationRecords = allParticipationRecords.filter(record => {
        // Log the fields for debugging
        console.log(`Checking record ${record.id}, fields:`, Object.keys(record.fields));
        
        // Check if the record has Contacts field
        if (!record.fields.Contacts) {
          console.log(`Record ${record.id} has no Contacts field`);
          return false;
        }
        
        // Log the Contacts field value and type
        console.log(`Record ${record.id} Contacts:`, record.fields.Contacts, 
                    `(type: ${typeof record.fields.Contacts}, isArray: ${Array.isArray(record.fields.Contacts)})`);
        
        // If Contacts is an array (which it should be for a multipleRecordLinks field)
        if (Array.isArray(record.fields.Contacts)) {
          const isMatch = record.fields.Contacts.includes(profile.contactId);
          if (isMatch) {
            console.log(`✅ Found match in record ${record.id} - contactId ${profile.contactId} is in Contacts array`);
            return true;
          }
        }
        
        return false;
      })
      
      console.log(`Client-side filtering found ${participationRecords.length} matching records`)
    }

    // Log the results
    console.log(`Found ${participationRecords.length} participation records for contact ${profile.contactId}`)

    // Check if we found any participation records
    if (!participationRecords || participationRecords.length === 0) {
      console.log(`No participation records found for contact ${profile.contactId}`)
      return res.status(200).json({ participation: [] })
    }
    
    // Log details of the first record for debugging
    if (participationRecords.length > 0) {
      const firstRecord = participationRecords[0]
      console.log(`First participation record: ID=${firstRecord.id}, Cohorts=${JSON.stringify(firstRecord.fields.Cohorts)}`)
    }
    
    // Process each participation record to get associated cohort and team info
    const processedParticipation = []
    
    for (const participationRecord of participationRecords) {
      // Extract cohort IDs from the participation record
      const cohortIds = participationRecord.fields.Cohorts || []
      
      if (cohortIds.length === 0) {
        continue // Skip participation records with no cohorts
      }
      
      // For simplicity, focus on the first cohort for now
      const cohortId = cohortIds[0]
      
      try {
        // Get cohort details
        const cohort = await cohortsTable.find(cohortId)
        
        // Extract initiative IDs from the cohort
        const initiativeIds = cohort.fields.Initiative || []
        
        // Get initiative details if available
        let initiativeDetails = null
        if (initiativeIds.length > 0) {
          const initiative = await initiativesTable.find(initiativeIds[0])
          
          // Extract participation type with fallback
          let participationType = "Individual"
          if (initiative.fields["Participation Type"]) {
            const rawType = String(initiative.fields["Participation Type"])
            participationType = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase()
          }
          
          initiativeDetails = {
            id: initiative.id,
            name: initiative.fields.Name || "Untitled Initiative",
            description: initiative.fields.Description || "",
            "Participation Type": participationType
          }
        }
        
        // Get topic information if available
        const topicIds = cohort.fields.Topics || []
        const topicNames = []
        
        for (const topicId of topicIds) {
          try {
            const topic = await topicsTable.find(topicId)
            topicNames.push(topic.fields.Name || "Unknown Topic")
          } catch (err) {
            console.error(`Error fetching topic ${topicId}:`, err)
          }
        }
        
        // Get team information if applicable
        let teamId = null
        
        // If this is a team-based program, we need to find the user's team
        if (initiativeDetails && (initiativeDetails["Participation Type"] === "Team" || 
            initiativeDetails["Participation Type"].toLowerCase().includes("team"))) {
          // Get the teams table ID
          const teamsTableId = process.env.AIRTABLE_TEAMS_TABLE_ID
          if (teamsTableId) {
            // Initialize the teams table
            const teamsTable = base(teamsTableId)
            
            // Get the members table ID
            const membersTableId = process.env.AIRTABLE_MEMBERS_TABLE_ID
            if (membersTableId) {
              // Initialize the members table
              const membersTable = base(membersTableId)
              
              // First find the member records for this user using the dedicated contactId field with FIND
              const memberRecords = await membersTable
                .select({
                  filterByFormula: `FIND("${profile.contactId}", {contactId})`,
                  fields: ["Team", "Status"]
                })
                .firstPage()
              
              // Find an active member record associated with teams in this cohort
              for (const memberRecord of memberRecords) {
                if (memberRecord.fields.Status === "Active" && memberRecord.fields.Team && memberRecord.fields.Team.length > 0) {
                  // For each team, check if it's associated with this cohort
                  for (const possibleTeamId of memberRecord.fields.Team) {
                    try {
                      const team = await teamsTable.find(possibleTeamId)
                      
                      // Check if this team is associated with the cohort
                      // First check the dedicated cohortId field if it exists
                      const hasCohortIdField = team.fields.cohortId !== undefined;
                      // Improved checking for record IDs in fields
                      // Using indexOf for more reliable string checking
                      const cohortIdMatch = hasCohortIdField && 
                                          team.fields.cohortId && 
                                          (typeof team.fields.cohortId === 'string' ?
                                            team.fields.cohortId.indexOf(cohortId) >= 0 :
                                            (Array.isArray(team.fields.cohortId) && 
                                             team.fields.cohortId.some(id => id === cohortId)));
                      
                      if (cohortIdMatch) {
                        teamId = team.id;
                        break;
                      }
                      // Fall back to the linked Cohorts field if needed
                      else if (team.fields.Cohorts && (
                        // Check both array-based includes and string-based FIND logic
                        (Array.isArray(team.fields.Cohorts) && team.fields.Cohorts.includes(cohortId)) ||
                        (typeof team.fields.Cohorts === 'string' && team.fields.Cohorts.indexOf(cohortId) >= 0)
                      )) {
                        teamId = team.id;
                        break;
                      }
                    } catch (err) {
                      console.error(`Error checking team ${possibleTeamId}:`, err)
                    }
                  }
                  
                  // If we found a team, no need to check other member records
                  if (teamId) break
                }
              }
            }
          }
        }
        
        // Extract start and end dates if available
        const startDate = cohort.fields["Start Date"] || null;
        const endDate = cohort.fields["End Date"] || null;
        
        // Calculate if the cohort is current based on dates
        const now = new Date();
        let isCurrentByDates = false;
        
        if (startDate && endDate) {
          const startDateObj = new Date(startDate);
          const endDateObj = new Date(endDate);
          isCurrentByDates = now >= startDateObj && now <= endDateObj;
        }
        
        // Check if the "Current Cohort" or "Is Current" field is set to true
        // Handle different possible field names and value types
        let isCurrentByField = false;
        
        // Check for "Current Cohort" field, handling different value types
        if (cohort.fields["Current Cohort"] !== undefined) {
          const fieldValue = cohort.fields["Current Cohort"];
          if (fieldValue === true || fieldValue === "true" || fieldValue === "yes" || fieldValue === 1) {
            isCurrentByField = true;
          }
          // Also handle checkbox fields which might come back as strings
          if (typeof fieldValue === "string" && fieldValue.toLowerCase() === "true") {
            isCurrentByField = true;
          }
        }
        
        // Check for "Is Current" field, handling different value types
        if (!isCurrentByField && cohort.fields["Is Current"] !== undefined) {
          const fieldValue = cohort.fields["Is Current"];
          if (fieldValue === true || fieldValue === "true" || fieldValue === "yes" || fieldValue === 1) {
            isCurrentByField = true;
          }
          // Also handle checkbox fields which might come back as strings
          if (typeof fieldValue === "string" && fieldValue.toLowerCase() === "true") {
            isCurrentByField = true;
          }
        }
        
        // Use either method to determine if cohort is current
        const isCurrent = isCurrentByField || isCurrentByDates;
        
        console.log(`Cohort ${cohort.id} current status:`, {
          name: cohort.fields.Name || "Unknown cohort",
          currentField: cohort.fields["Current Cohort"],
          startDate,
          endDate,
          isCurrentByDates,
          isCurrentByField,
          finalCurrentStatus: isCurrent
        });
        
        // Add to processed participation
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
        })
      } catch (err) {
        console.error(`Error processing participation record ${participationRecord.id}:`, err)
      }
    }
    
    // Log the processed results for debugging
    console.log(`Successfully processed ${processedParticipation.length} participation records`)
    if (processedParticipation.length === 0) {
      console.log("No processed participation records available to return")
    } else {
      // Log details of first processed record
      const firstProcessed = processedParticipation[0]
      console.log(`First processed participation: cohort=${firstProcessed.cohort?.id}, initiative=${firstProcessed.cohort?.initiativeDetails?.name}, teamId=${firstProcessed.teamId}`)
    }
    
    // Return the processed participation records
    return res.status(200).json({
      participation: processedParticipation
    })
  } catch (error) {
    console.error("Error fetching participation:", error)
    return res.status(500).json({ error: "Failed to fetch participation", details: error.message })
  }
})