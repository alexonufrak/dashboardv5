import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0'
import { getUserProfile, base } from '@/lib/airtable'

/**
 * API handler to get joinable teams for a cohort
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
export default withApiAuthRequired(async function joinableTeamsHandler(req, res) {
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
    
    // We need to get all teams for this cohort, regardless of joinable flag
    // The Airtable SEARCH formula is more reliable than FIND for array matching
    // Format: AND(condition1, OR(cohort matches))
    let formula;
    
    // If we're searching for a specific cohort ID
    if (cohortId) {
      // Use this approach to find teams that have the cohort ID in their Cohorts field
      formula = `OR(
        SEARCH('${cohortId}', ARRAYJOIN({Cohorts}, ',')), 
        SEARCH('${cohortId}', ARRAYJOIN(Cohorts, ',')),
        SEARCH('${cohortId}', Cohorts)
      )`;
    } else {
      // If no cohort specified, default to showing all teams
      formula = "TRUE()";
    }
    
    // Add institution filter
    formula = `AND(${formula}, {Institution} = '${instId}')`
    
    console.log(`Fetching joinable teams with formula: ${formula}`)
    
    // Get all teams that match the criteria
    const teams = await teamsTable.select({
      filterByFormula: formula
    }).all()
    
    // Process teams
    const formattedTeams = teams.map(team => {
      // Format member data for display
      const memberCount = team.fields['Count (Members)'] || 0;
      const memberNames = team.fields['Name (from Contact) (from Members)'] || [];
      const displayMembers = memberNames.slice(0, 3); // Take up to 3 members to display
      
      return {
        id: team.id,
        name: team.fields.Name || "Unnamed Team",
        description: team.fields.Description || "No description available",
        institution: team.fields.Institution?.[0] ? {
          id: team.fields.Institution[0],
          name: team.fields['Name (from Institution)']?.[0] || 'Unknown Institution'
        } : null,
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
    })
    
    console.log(`Found ${formattedTeams.length} joinable teams for cohort ${cohortId} and institution ${instId}`)
    
    return res.status(200).json({ teams: formattedTeams })
  } catch (error) {
    console.error('Error fetching joinable teams:', error)
    return res.status(500).json({ error: 'Failed to fetch joinable teams' })
  }
})