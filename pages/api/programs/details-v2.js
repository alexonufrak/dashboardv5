import { programs, cohorts } from '@/lib/airtable/entities';
import { auth0 } from '@/lib/auth0';

/**
 * API endpoint to fetch program details along with its active cohorts
 * Demonstrates the use of the new Airtable architecture
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

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { programId } = req.query;

    if (!programId) {
      return res.status(400).json({ error: 'Program ID is required' });
    }

    // Use the new programs entity to fetch program details
    const program = await programs.getProgramById(programId);

    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    // Use the cohorts entity to fetch all cohorts and filter for this program
    const allCohorts = await cohorts.getCurrentCohorts();
    const programCohorts = allCohorts.filter(cohort => 
      cohort.programId === programId || 
      (cohort.initiativeIds && cohort.initiativeIds.includes(programId))
    );

    // Return combined data
    return res.status(200).json({
      success: true,
      program,
      cohorts: programCohorts || [],
    });
  } catch (error) {
    console.error('Error fetching program details:', error);
    return res.status(500).json({
      error: 'An error occurred while fetching program details',
      message: error.message,
      details: error.details || {}
    });
  }
}