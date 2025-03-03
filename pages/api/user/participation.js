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
    const participationRecords = await participationTable
      .select({
        filterByFormula: `FIND("${profile.contactId}", {Contacts})`,
        // Only get active participation with appropriate capacity
        // filterByFormula: `AND(FIND("${profile.contactId}", {Contacts}), {Capacity}="Participant")`,
        sort: [{ field: "Last Modified", direction: "desc" }]
      })
      .firstPage()
    
    // Check if we found any participation records
    if (!participationRecords || participationRecords.length === 0) {
      console.log(`No participation records found for contact ${profile.contactId}`)
      return res.status(200).json({ participation: [] })
    }
    
    console.log(`Found ${participationRecords.length} participation records for contact ${profile.contactId}`)
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
        
        // Add to processed participation
        processedParticipation.push({
          id: participationRecord.id,
          capacity: participationRecord.fields.Capacity || "Participant",
          cohort: {
            id: cohort.id,
            Short_Name: cohort.fields["Short Name"] || "",
            Status: cohort.fields.Status || "Unknown",
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