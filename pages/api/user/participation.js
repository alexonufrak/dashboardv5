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

    // Try using different matching methods
    // Method 1: Direct match using filterByFormula with Contact field
    const formula1 = `FIND("${profile.contactId}", ARRAYJOIN({Contacts}))`
    
    // Method 2: Alternative field name approach - try 'Contact' singular
    const formula2 = `FIND("${profile.contactId}", {Contact})`
    
    // Method 3: ID equals approach (if it's stored as an ID reference)
    const formula3 = `{Contact} = "${profile.contactId}"`
    
    // Method 4: Record ID equals approach (if it's stored as a record ID)
    const formula4 = `RECORD_ID() = "${profile.contactId}"`
    
    // Method 5: Contains approach
    const formula5 = `OR(
      FIND("${profile.contactId}", ARRAYJOIN({Contacts})) > 0,
      FIND("${profile.contactId}", {Contact}) > 0,
      FIND("${profile.contactId}", {ContactID}) > 0
    )`

    // Try each formula in sequence
    console.log("Trying multiple search formulas to find participation records...")
    
    // Try method 1
    console.log(`Trying formula 1: ${formula1}`)
    let recordsMethod1 = await participationTable.select({
      filterByFormula: formula1,
      sort: [{ field: "Last Modified", direction: "desc" }]
    }).firstPage()
    
    console.log(`Formula 1 found ${recordsMethod1.length} records`)
    participationRecords = [...recordsMethod1]
    
    // If no records found, try method 2
    if (participationRecords.length === 0) {
      console.log(`Trying formula 2: ${formula2}`)
      let recordsMethod2 = await participationTable.select({
        filterByFormula: formula2,
        sort: [{ field: "Last Modified", direction: "desc" }]
      }).firstPage()
      
      console.log(`Formula 2 found ${recordsMethod2.length} records`)
      participationRecords = [...recordsMethod2]
    }
    
    // If still no records, try method 3
    if (participationRecords.length === 0) {
      console.log(`Trying formula 3: ${formula3}`)
      let recordsMethod3 = await participationTable.select({
        filterByFormula: formula3,
        sort: [{ field: "Last Modified", direction: "desc" }]
      }).firstPage()
      
      console.log(`Formula 3 found ${recordsMethod3.length} records`)
      participationRecords = [...recordsMethod3]
    }
    
    // If still no records, try method 5 (complex OR)
    if (participationRecords.length === 0) {
      console.log(`Trying complex formula: ${formula5}`)
      let recordsMethod5 = await participationTable.select({
        filterByFormula: formula5,
        sort: [{ field: "Last Modified", direction: "desc" }]
      }).firstPage()
      
      console.log(`Complex formula found ${recordsMethod5.length} records`)
      participationRecords = [...recordsMethod5]
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
      
      // Client-side filtering logic
      participationRecords = allParticipationRecords.filter(record => {
        // Try with Contacts as array
        if (Array.isArray(record.fields.Contacts) && record.fields.Contacts.includes(profile.contactId)) {
          return true
        }
        
        // Try with Contact as string
        if (record.fields.Contact === profile.contactId) {
          return true
        }
        
        // Try with Contact as array
        if (Array.isArray(record.fields.Contact) && record.fields.Contact.includes(profile.contactId)) {
          return true
        }
        
        // Try string contains approach
        if (record.fields.Contacts && typeof record.fields.Contacts === 'string' && 
            record.fields.Contacts.includes(profile.contactId)) {
          return true
        }
        
        return false
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
              
              // First find the member records for this user
              const memberRecords = await membersTable
                .select({
                  filterByFormula: `FIND("${profile.contactId}", {Contact})`,
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
                      if (team.fields.Cohorts && team.fields.Cohorts.includes(cohortId)) {
                        teamId = team.id
                        break
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
        
        // Check if the "Current Cohort" field is set to true
        const isCurrentByField = cohort.fields["Current Cohort"] === true || 
                               cohort.fields["Current Cohort"] === "true" ||
                               cohort.fields["Is Current"] === true ||
                               cohort.fields["Is Current"] === "true";
                               
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