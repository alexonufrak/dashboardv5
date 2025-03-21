import { auth0 } from '@/lib/auth0'
import { getUserProfile, base } from '@/lib/airtable'

/**
 * API handler to get joinable teams for a cohort
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
export default async function joinableTeamsHandler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the user session
    const session = await auth0.getSession(req)
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    
    // Get query parameters
    const { cohortId, institutionId } = req.query
    
    if (!cohortId) {
      return res.status(400).json({ error: 'Cohort ID is required' })
    }
    
    // Get user profile from Airtable
    const userProfile = await getUserProfile(session.user.sub, session.user.email)
    
    if (!userProfile || !userProfile.contactId) {
      return res.status(404).json({ error: 'User profile not found' })
    }
    
    // Use institutionId from query if provided, otherwise use from profile
    const instId = institutionId || userProfile.institution?.id
    
    if (!instId) {
      return res.status(400).json({ error: 'Institution ID is required' })
    }
    
    // Get the Teams table
    const teamsTable = base(process.env.AIRTABLE_TEAMS_TABLE_ID)
    
    // Get all teams for the institution first, then we'll check which ones are in the cohort
    // This approach is more reliable than trying to search for cohortId directly 
    // since we're not sure how teams are linked to cohorts
    console.log(`Fetching all teams for institution: ${instId}`)
    
    // First get the institution's teams
    const teams = await teamsTable.select({
      filterByFormula: `{Institution} = '${instId}'`
    }).all()
    
    console.log(`Found ${teams.length} teams for institution ${instId}`)
    
    // Now get the cohort to see which teams are linked to it
    const cohortsTable = base(process.env.AIRTABLE_COHORTS_TABLE_ID)
    const cohort = await cohortsTable.find(cohortId)
    
    console.log(`Cohort data:`, cohort ? {
      id: cohort.id,
      name: cohort.fields.Name,
      hasTeams: Boolean(cohort.fields.Teams),
      teamCount: cohort.fields.Teams ? cohort.fields.Teams.length : 0
    } : 'Not found')
    
    // Get the teams linked directly to this cohort
    const cohortTeamIds = cohort?.fields?.Teams || []
    
    // Filter teams to those linked to the cohort or that have the cohort ID in their Cohorts field
    const filteredTeams = teams.filter(team => {
      // Check if team is directly linked to cohort
      if (cohortTeamIds.includes(team.id)) {
        return true
      }
      
      // Check if cohort ID is in team's Cohorts field
      const teamCohorts = team.fields.Cohorts || []
      return teamCohorts.includes(cohortId)
    })
    
    console.log(`Found ${filteredTeams.length} teams directly linked to cohort ${cohortId}`)
    
    // If no teams are found, return all teams for the institution as a fallback
    const finalTeams = filteredTeams.length > 0 ? filteredTeams : teams
    
    // Process teams
    const formattedTeams = await Promise.all(finalTeams.map(async team => {
      // Format member data for display
      const memberCount = team.fields['Count (Members)'] || 0;
      const memberNames = team.fields['Name (from Contact) (from Members)'] || [];
      const displayMembers = memberNames.slice(0, 3); // Take up to 3 members to display
      
      // Make sure to get the team name, with fallbacks to "Team Name" field and ID
      const teamName = team.fields.Name || team.fields['Team Name'] || `Team ${team.id.slice(-5)}`;
      
      console.log(`Processing team: ${team.id}`, {
        nameField: team.fields.Name,
        teamNameField: team.fields['Team Name'],
        finalName: teamName,
        hasMembers: Boolean(memberNames.length),
        institutionId: team.fields.Institution?.[0] || null,
        institutionName: team.fields['Institution Name'],
        nameFromInstitution: team.fields['Name (from Institution)']
      });
      
      // Handle institution data with direct lookup if needed
      let institutionData = null;
      if (team.fields.Institution?.[0]) {
        const instId = team.fields.Institution[0];
        
        // First try to get from team record
        const nameFromTeamRecord = team.fields['Institution Name'] || 
                                  (Array.isArray(team.fields['Name (from Institution)']) ? 
                                  team.fields['Name (from Institution)'][0] : 
                                  team.fields['Name (from Institution)']);
        
        if (nameFromTeamRecord) {
          institutionData = {
            id: instId,
            name: nameFromTeamRecord
          };
        }
        // If no name in team record, lookup directly in institutions table
        else if (process.env.AIRTABLE_INSTITUTIONS_TABLE_ID) {
          try {
            const institutionsTable = base(process.env.AIRTABLE_INSTITUTIONS_TABLE_ID);
            const institution = await institutionsTable.find(instId);
            
            if (institution && institution.fields.Name) {
              institutionData = {
                id: instId,
                name: institution.fields.Name
              };
              console.log(`Found institution name via direct lookup: ${institution.fields.Name}`);
            }
          } catch (err) {
            console.error(`Error fetching institution ${instId}:`, err.message);
          }
        }
        
        // If we still don't have institution data, set the default
        if (!institutionData) {
          institutionData = {
            id: instId,
            name: 'Unknown Institution'
          };
        }
      }
      
      return {
        id: team.id,
        name: teamName,
        description: team.fields.Description || "No description available",
        institution: institutionData,
        members: team.fields['Contact (from Members)'] || [],
        memberNames: memberNames,
        displayMembers: displayMembers,
        cohortIds: team.fields.Cohorts || [],
        memberCount: memberCount,
        joinable: !!team.fields.Joinable, // Keep the real joinable status for reference
        // Include the real joinable status and any additional useful info
        hasMoreMembers: memberNames.length > 3,
        additionalMembersCount: Math.max(0, memberNames.length - 3)
      }
    }))
    
    console.log(`Found ${formattedTeams.length} joinable teams for cohort ${cohortId} and institution ${instId}`)
    
    // Add cache headers to improve performance
    // Cache for 5 minutes on server, 2 minutes on client, allow stale-while-revalidate for 10 minutes
    res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=300, stale-while-revalidate=600');
    
    return res.status(200).json({ 
      teams: formattedTeams,
      _meta: {
        timestamp: new Date().toISOString(),
        count: formattedTeams.length,
        cohortId,
        institutionId: instId
      }
    })
  } catch (error) {
    console.error('Error fetching joinable teams:', error)
    return res.status(500).json({ error: 'Failed to fetch joinable teams' })
  }
}