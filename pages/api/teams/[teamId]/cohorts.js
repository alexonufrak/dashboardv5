import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { base } from '../../../../lib/airtable';

/**
 * API endpoint to get a team's cohorts
 * This helps check for initiative conflicts in the application process
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
    
    // Look up the team's applications
    const applications = await applicationsTable.select({
      filterByFormula: `{Team} = "${teamId}"`,
    }).firstPage();
    
    if (!applications || applications.length === 0) {
      // Team has no applications
      return res.status(200).json({ cohorts: [] });
    }
    
    // Extract cohort IDs from applications
    const cohortIds = applications
      .map(app => app.fields.Cohort && Array.isArray(app.fields.Cohort) ? app.fields.Cohort[0] : null)
      .filter(Boolean);
    
    if (cohortIds.length === 0) {
      // No valid cohort IDs found
      return res.status(200).json({ cohorts: [] });
    }
    
    // Get cohort details
    const cohortDetails = [];
    
    for (const cohortId of cohortIds) {
      try {
        const cohortRecord = await cohortsTable.find(cohortId);
        
        if (cohortRecord) {
          // Extract initiative details
          let initiativeDetails = null;
          if (cohortRecord.fields.Initiative && Array.isArray(cohortRecord.fields.Initiative) && cohortRecord.fields.Initiative.length > 0) {
            const initiativesTable = process.env.AIRTABLE_INITIATIVES_TABLE_ID
              ? base(process.env.AIRTABLE_INITIATIVES_TABLE_ID)
              : null;
              
            if (initiativesTable) {
              const initiativeRecord = await initiativesTable.find(cohortRecord.fields.Initiative[0]).catch(() => null);
              if (initiativeRecord) {
                initiativeDetails = {
                  id: initiativeRecord.id,
                  name: initiativeRecord.fields.Name || "Unknown Initiative",
                  description: initiativeRecord.fields.Description || ""
                };
              }
            }
          }
          
          // Extract topic details
          let topicNames = [];
          if (cohortRecord.fields.Topics && Array.isArray(cohortRecord.fields.Topics) && cohortRecord.fields.Topics.length > 0) {
            const topicsTable = process.env.AIRTABLE_TOPICS_TABLE_ID
              ? base(process.env.AIRTABLE_TOPICS_TABLE_ID)
              : null;
              
            if (topicsTable) {
              for (const topicId of cohortRecord.fields.Topics) {
                const topicRecord = await topicsTable.find(topicId).catch(() => null);
                if (topicRecord && topicRecord.fields.Name) {
                  topicNames.push(topicRecord.fields.Name);
                }
              }
            }
          }
          
          cohortDetails.push({
            id: cohortRecord.id,
            name: cohortRecord.fields['Short Name'] || "Unknown Cohort",
            status: cohortRecord.fields.Status || "Unknown",
            initiativeDetails,
            topicNames
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