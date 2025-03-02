// pages/api/teams/[teamId]/cohorts.js
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0'
import { base } from '@/lib/airtable'

/**
 * API handler to get cohorts for a specific team
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
export default withApiAuthRequired(async function teamCohortsHandler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the user session
    const session = await getSession(req, res)
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    
    // Get the team ID from the URL
    const { teamId } = req.query
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' })
    }
    
    console.log(`Getting cohorts for team ${teamId}`)
    
    // Get the Teams table ID from environment variables
    const teamsTableId = process.env.AIRTABLE_TEAMS_TABLE_ID
    if (!teamsTableId) {
      return res.status(500).json({ error: 'Teams table ID not configured' })
    }
    
    // Initialize the teams table
    const teamsTable = base(teamsTableId)
    
    // Get the team details to find associated cohorts
    const team = await teamsTable.find(teamId)
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' })
    }
    
    // Get the associated cohort IDs from the team record
    const cohortIds = team.fields.Cohorts || []
    
    // Log the entire team fields for debugging
    console.log(`Team ${teamId} fields:`, team.fields);
    console.log(`Looking for Cohorts field in team ${teamId}`);
    
    // Check alternative field names if needed
    let finalCohortIds = cohortIds;
    if (cohortIds.length === 0) {
      // Try alternative field names
      const possibleFieldNames = ['Cohort', 'Active Cohorts', 'Team Cohorts'];
      for (const fieldName of possibleFieldNames) {
        if (team.fields[fieldName] && Array.isArray(team.fields[fieldName]) && team.fields[fieldName].length > 0) {
          finalCohortIds = team.fields[fieldName];
          console.log(`Found cohorts in alternative field "${fieldName}": ${finalCohortIds}`);
          break;
        }
      }
    }
    
    if (finalCohortIds.length === 0) {
      console.log(`No cohort IDs found for team ${teamId} in any field`);
      return res.status(200).json({ cohorts: [] })
    }
    
    console.log(`Found ${finalCohortIds.length} cohort IDs for team ${teamId}:`, finalCohortIds)
    
    // Get the Cohorts table ID from environment variables
    const cohortsTableId = process.env.AIRTABLE_COHORTS_TABLE_ID
    if (!cohortsTableId) {
      return res.status(500).json({ error: 'Cohorts table ID not configured' })
    }
    
    // Initialize the cohorts table
    const cohortsTable = base(cohortsTableId)
    
    // Get the Initiatives table ID from environment variables
    const initiativesTableId = process.env.AIRTABLE_INITIATIVES_TABLE_ID
    if (!initiativesTableId) {
      return res.status(500).json({ error: 'Initiatives table ID not configured' })
    }
    
    // Initialize the initiatives table
    const initiativesTable = base(initiativesTableId)
    
    // Get the Topics table ID from environment variables
    const topicsTableId = process.env.AIRTABLE_TOPICS_TABLE_ID
    if (!topicsTableId) {
      return res.status(500).json({ error: 'Topics table ID not configured' })
    }
    
    // Initialize the topics table
    const topicsTable = base(topicsTableId)
    
    // Get the Classes table ID from environment variables
    const classesTableId = process.env.AIRTABLE_CLASSES_TABLE_ID
    if (!classesTableId) {
      return res.status(500).json({ error: 'Classes table ID not configured' })
    }
    
    // Initialize the classes table
    const classesTable = base(classesTableId)
    
    // Fetch all cohorts associated with this team
    const cohorts = []
    
    for (const cohortId of finalCohortIds) {
      try {
        // Fetch the cohort record
        const cohort = await cohortsTable.find(cohortId)
        
        if (!cohort) {
          console.warn(`Cohort ${cohortId} not found`)
          continue
        }
        
        // Create a basic cohort object
        const cohortData = {
          id: cohort.id,
          ...cohort.fields
        }
        
        // Add initiative details if available
        if (cohort.fields.Initiative && cohort.fields.Initiative.length > 0) {
          const initiativeId = cohort.fields.Initiative[0]
          try {
            const initiative = await initiativesTable.find(initiativeId)
            
            if (initiative) {
              // Process participation type
              let participationType = "Individual"
              if (initiative.fields["Participation Type"]) {
                const rawType = String(initiative.fields["Participation Type"])
                participationType = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase()
              }
              
              cohortData.initiativeDetails = {
                id: initiative.id,
                name: initiative.fields.Name,
                description: initiative.fields.Description,
                "Participation Type": participationType
              }
              
              cohortData.participationType = participationType
            }
          } catch (error) {
            console.error(`Error fetching initiative ${initiativeId}:`, error)
          }
        }
        
        // Add topic details if available
        if (cohort.fields.Topics && cohort.fields.Topics.length > 0) {
          const topicNames = []
          
          for (const topicId of cohort.fields.Topics) {
            try {
              const topic = await topicsTable.find(topicId)
              
              if (topic && topic.fields.Name) {
                topicNames.push(topic.fields.Name)
              }
            } catch (error) {
              console.error(`Error fetching topic ${topicId}:`, error)
            }
          }
          
          if (topicNames.length > 0) {
            cohortData.topicNames = topicNames
          }
        }
        
        // Add class details if available
        if (cohort.fields.Classes && cohort.fields.Classes.length > 0) {
          const classId = cohort.fields.Classes[0]
          
          try {
            const classRecord = await classesTable.find(classId)
            
            if (classRecord && classRecord.fields.Name) {
              cohortData.className = classRecord.fields.Name
            }
          } catch (error) {
            console.error(`Error fetching class ${classId}:`, error)
          }
        }
        
        cohorts.push(cohortData)
      } catch (error) {
        console.error(`Error processing cohort ${cohortId}:`, error)
      }
    }
    
    console.log(`Returning ${cohorts.length} cohorts for team ${teamId}`)
    
    return res.status(200).json({ cohorts })
  } catch (error) {
    console.error("Error in team cohorts API:", error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})