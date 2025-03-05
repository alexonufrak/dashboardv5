import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { base } from '../../../../lib/airtable';

/**
 * API endpoint to get a team's cohorts
 * Used for displaying team programs and checking for initiative conflicts
 */
export default withApiAuthRequired(async function getTeamCohorts(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the user session
    const session = await getSession(req, res);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get the team ID from the URL
    const { teamId } = req.query;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    // Initialize Airtable tables
    const teamsTable = process.env.AIRTABLE_TEAMS_TABLE_ID 
      ? base(process.env.AIRTABLE_TEAMS_TABLE_ID) 
      : null;
      
    const applicationsTable = process.env.AIRTABLE_APPLICATIONS_TABLE_ID
      ? base(process.env.AIRTABLE_APPLICATIONS_TABLE_ID)
      : null;
      
    const cohortsTable = process.env.AIRTABLE_COHORTS_TABLE_ID
      ? base(process.env.AIRTABLE_COHORTS_TABLE_ID)
      : null;

    if (!teamsTable || !applicationsTable || !cohortsTable) {
      return res.status(500).json({
        error: 'Airtable tables not configured',
        cohorts: []
      });
    }
    
    // Verify the team exists
    const teamRecord = await teamsTable.find(teamId).catch(() => null);
    if (!teamRecord) {
      return res.status(404).json({ error: 'Team not found', cohorts: [] });
    }

    // Two methods to find cohorts:
    // 1. Direct team-cohort links (from team.fields.Cohorts)
    // 2. Through applications (team.applications -> cohorts)
    
    let cohortIds = new Set();
    
    // Method 1: Direct links from Team.Cohorts field
    if (teamRecord.fields.Cohorts && Array.isArray(teamRecord.fields.Cohorts) && teamRecord.fields.Cohorts.length > 0) {
      teamRecord.fields.Cohorts.forEach(id => cohortIds.add(id));
    }
    
    // Method 2: Through applications
    try {
      const applications = await applicationsTable.select({
        filterByFormula: `{Team} = "${teamId}"`,
      }).firstPage();
      
      if (applications && applications.length > 0) {
        applications.forEach(app => {
          if (app.fields.Cohort && Array.isArray(app.fields.Cohort) && app.fields.Cohort.length > 0) {
            cohortIds.add(app.fields.Cohort[0]);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      // Continue even if applications fail - we might still have direct cohort links
    }
    
    if (cohortIds.size === 0) {
      return res.status(200).json({ cohorts: [] });
    }
    
    // Convert Set to Array
    const uniqueCohortIds = Array.from(cohortIds);
    
    // Add debug logging for cohort IDs
    console.log(`Found ${uniqueCohortIds.length} unique cohort IDs for team: ${teamId}`);
    console.log(`Cohort IDs: ${JSON.stringify(uniqueCohortIds)}`);
    
    // Get cohort details
    const cohortDetails = [];
    
    for (const cohortId of uniqueCohortIds) {
      try {
        console.log(`Fetching details for cohort: ${cohortId}`);
        const cohortRecord = await cohortsTable.find(cohortId);
        
        if (cohortRecord) {
          console.log(`Found cohort record: ${cohortRecord.id}, Name: ${cohortRecord.fields['Short Name'] || cohortRecord.fields.Name || "Unknown"}`);
          
          // Extract initiative details
          let initiativeDetails = null;
          if (cohortRecord.fields.Initiative && Array.isArray(cohortRecord.fields.Initiative) && cohortRecord.fields.Initiative.length > 0) {
            const initiativesTable = process.env.AIRTABLE_INITIATIVES_TABLE_ID
              ? base(process.env.AIRTABLE_INITIATIVES_TABLE_ID)
              : null;
              
            if (initiativesTable) {
              const initiativeId = cohortRecord.fields.Initiative[0];
              console.log(`Fetching initiative: ${initiativeId} for cohort: ${cohortId}`);
              const initiativeRecord = await initiativesTable.find(initiativeId).catch(err => {
                console.error(`Error fetching initiative ${initiativeId}: ${err.message}`);
                return null;
              });
              
              if (initiativeRecord) {
                initiativeDetails = {
                  id: initiativeRecord.id,
                  name: initiativeRecord.fields.Name || "Unknown Initiative",
                  description: initiativeRecord.fields.Description || ""
                };
                console.log(`Found initiative: ${initiativeDetails.name}`);
              }
            }
          }
          
          // Extract topic details
          let topicNames = [];
          let topicIds = [];
          if (cohortRecord.fields.Topics && Array.isArray(cohortRecord.fields.Topics) && cohortRecord.fields.Topics.length > 0) {
            topicIds = cohortRecord.fields.Topics;
            
            const topicsTable = process.env.AIRTABLE_TOPICS_TABLE_ID
              ? base(process.env.AIRTABLE_TOPICS_TABLE_ID)
              : null;
              
            if (topicsTable) {
              for (const topicId of topicIds) {
                try {
                  const topicRecord = await topicsTable.find(topicId);
                  if (topicRecord && topicRecord.fields.Name) {
                    topicNames.push(topicRecord.fields.Name);
                  }
                } catch (topicError) {
                  console.error(`Error fetching topic ${topicId}:`, topicError);
                }
              }
            }
          }
          
          // Extract class details 
          let className = null;
          if (cohortRecord.fields.Classes && Array.isArray(cohortRecord.fields.Classes) && cohortRecord.fields.Classes.length > 0) {
            try {
              const classesTable = process.env.AIRTABLE_CLASSES_TABLE_ID
                ? base(process.env.AIRTABLE_CLASSES_TABLE_ID)
                : null;
                
              if (classesTable) {
                const classRecord = await classesTable.find(cohortRecord.fields.Classes[0]).catch(() => null);
                if (classRecord && classRecord.fields.Name) {
                  className = classRecord.fields.Name;
                }
              }
            } catch (classError) {
              console.error(`Error fetching class for cohort ${cohortId}:`, classError);
            }
          }
          
          cohortDetails.push({
            id: cohortRecord.id,
            name: cohortRecord.fields['Short Name'] || "Unknown Cohort",
            status: cohortRecord.fields.Status || "Unknown",
            initiativeDetails,
            topicNames,
            className,
            description: cohortRecord.fields.description || null
          });
        }
      } catch (error) {
        console.error(`Error fetching cohort ${cohortId}:`, error);
      }
    }
    
    return res.status(200).json({ cohorts: cohortDetails });
  } catch (error) {
    console.error('Error fetching team cohorts:', error);
    return res.status(500).json({
      error: 'Failed to fetch team cohorts',
      cohorts: []
    });
  }
});