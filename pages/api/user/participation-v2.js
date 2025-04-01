import { participation, programs, cohorts, teams } from '@/lib/airtable/entities';
import { auth0 } from '@/lib/auth0';

/**
 * API endpoint to fetch user's program participation details
 * Uses the new domain-driven Airtable architecture
 * 
 * @param {object} req - Next.js request object
 * @param {object} res - Next.js response object
 */
export default async function handler(req, res) {
  try {
    // Get Auth0 session and validate user is authenticated
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({
        error: 'Not authenticated'
      });
    }
    const { user } = session;

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get participation records for the user
    const participationRecords = await participation.getParticipationRecords(user.sub);

    // Process the participation records
    const detailedParticipation = await Promise.all(
      participationRecords.map(async (record) => {
        // Initialize the detailed record with participation data
        const detailedRecord = {
          id: record.id,
          status: record.status || 'Unknown',
          createdTime: record.createdTime,
          program: null,
          cohort: null, 
          team: null
        };

        // Fetch program details if available
        if (record.programId) {
          try {
            const programDetails = await programs.getProgramById(record.programId);
            if (programDetails) {
              detailedRecord.program = {
                id: programDetails.id,
                name: programDetails.name,
                description: programDetails.description,
                status: programDetails.status,
                institution: programDetails.institution 
                  ? {
                      id: programDetails.institution.id,
                      name: programDetails.institution.name
                    } 
                  : null
              };
            }
          } catch (error) {
            console.error(`Error fetching program details for ID ${record.programId}:`, error);
            // Continue with other fetches even if this one fails
          }
        }

        // Fetch cohort details if available
        if (record.cohortId) {
          try {
            const cohortDetails = await cohorts.getCohortById(record.cohortId);
            if (cohortDetails) {
              detailedRecord.cohort = {
                id: cohortDetails.id,
                name: cohortDetails.name,
                startDate: cohortDetails.startDate,
                endDate: cohortDetails.endDate,
                status: cohortDetails.status
              };
            }
          } catch (error) {
            console.error(`Error fetching cohort details for ID ${record.cohortId}:`, error);
          }
        }

        // Fetch team details if available
        if (record.teamId) {
          try {
            const teamDetails = await teams.getTeamById(record.teamId);
            if (teamDetails) {
              detailedRecord.team = {
                id: teamDetails.id,
                name: teamDetails.name,
                description: teamDetails.description,
                memberCount: teamDetails.memberCount
              };
            }
          } catch (error) {
            console.error(`Error fetching team details for ID ${record.teamId}:`, error);
          }
        }

        return detailedRecord;
      })
    );

    // Group participation by program
    const participationByProgram = {};
    
    detailedParticipation.forEach(record => {
      if (record.program) {
        const programId = record.program.id;
        
        if (!participationByProgram[programId]) {
          participationByProgram[programId] = {
            program: record.program,
            participations: []
          };
        }
        
        participationByProgram[programId].participations.push(record);
      }
    });

    // Return the participation data
    return res.status(200).json({
      success: true,
      participation: detailedParticipation,
      participationByProgram: Object.values(participationByProgram),
      count: detailedParticipation.length
    });
  } catch (error) {
    console.error('Error fetching user participation:', error);
    return res.status(500).json({
      error: 'An error occurred while fetching user participation',
      message: error.message,
      details: error.details || {}
    });
  }
}