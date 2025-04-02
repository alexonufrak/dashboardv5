import { auth0 } from '@/lib/auth0';

/**
 * API endpoint for testing the domain-driven design architecture
 * Returns all available hooks and endpoints that can be tested
 * 
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 */
export default async function handler(req, res) {
  try {
    // Get the current session and user using Auth0
    const session = await auth0.getSession(req, res);
    if (!session?.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Only GET method is supported
    if (req.method !== 'GET') {
      return res.status(405).json({ error: "Method not allowed" });
    }
    
    // Gather all the testable modules organized by domain
    const testableModules = {
      core: [
        { name: 'Client', endpoint: '/api/debug/test/core/client', description: 'Test Airtable client functionality' },
        { name: 'Cache', endpoint: '/api/debug/test/core/cache', description: 'Test caching mechanism' },
        { name: 'Throttle', endpoint: '/api/debug/test/core/throttle', description: 'Test rate limiting functionality' },
        { name: 'Error Handling', endpoint: '/api/debug/test/core/errors', description: 'Test error handling utilities' }
      ],
      
      entities: [
        { name: 'Users', endpoint: '/api/user/profile-v2', method: 'GET', description: 'Test user entity operations' },
        { name: 'Education', endpoint: '/api/education/mine', method: 'GET', description: 'Test education entity operations' },
        { name: 'Institutions', endpoint: '/api/institutions', method: 'GET', params: { q: 'university' }, description: 'Test institutions entity operations' },
        { name: 'Participation', endpoint: '/api/participation/mine', method: 'GET', description: 'Test participation entity operations' },
        { name: 'Teams', endpoint: '/api/teams', method: 'GET', description: 'Test teams entity operations' },
        { name: 'Cohorts', endpoint: '/api/cohorts/public', method: 'GET', description: 'Test cohorts entity operations' },
        { name: 'Programs', endpoint: '/api/programs/details-v2', method: 'GET', description: 'Test programs entity operations' },
        { name: 'Submissions', endpoint: '/api/submissions/team-v2', method: 'GET', description: 'Test submissions entity operations' },
        { name: 'Points', endpoint: '/api/points/user-summary-v2', method: 'GET', description: 'Test points entity operations' },
        { name: 'Resources', endpoint: '/api/resources/available-v2', method: 'GET', description: 'Test resources entity operations' },
        { name: 'Events', endpoint: '/api/events/upcoming-v2', method: 'GET', description: 'Test events entity operations' },
        { name: 'Partnerships', endpoint: '/api/partnerships', method: 'GET', description: 'Test partnerships entity operations' },
        { name: 'Applications', endpoint: '/api/applications/mine', method: 'GET', description: 'Test applications entity operations' }
      ],
      
      hooks: [
        { name: 'useProfile', hook: 'useProfile', description: 'Test profile hooks functionality' },
        { name: 'useParticipation', hook: 'useParticipation', description: 'Test participation hooks functionality' },
        { name: 'useTeams', hook: 'useTeams', description: 'Test teams hooks functionality' },
        { name: 'useCohorts', hook: 'useCohorts', description: 'Test cohorts hooks functionality' },
        { name: 'usePrograms', hook: 'usePrograms', description: 'Test programs hooks functionality' },
        { name: 'useSubmissions', hook: 'useSubmissions', description: 'Test submissions hooks functionality' },
        { name: 'usePoints', hook: 'usePoints', description: 'Test points hooks functionality' },
        { name: 'useResources', hook: 'useResources', description: 'Test resources hooks functionality' },
        { name: 'useEvents', hook: 'useEvents', description: 'Test events hooks functionality' },
        { name: 'usePartnerships', hook: 'usePartnerships', description: 'Test partnerships hooks functionality' },
        { name: 'useOnboarding', hook: 'useOnboarding', description: 'Test onboarding hooks functionality' },
        { name: 'useApplications', hook: 'useApplications', description: 'Test applications hooks functionality' },
        { name: 'useMilestones', hook: 'useMilestones', description: 'Test milestones hooks functionality' },
        { name: 'useEducationRecords', hook: 'useEducationRecords', description: 'Test education hooks functionality' },
        { name: 'useInstitutions', hook: 'useInstitutions', description: 'Test institutions hooks functionality' }
      ]
    };
    
    // Return the testable modules with metadata
    return res.status(200).json({
      testableModules,
      user: {
        sub: session.user.sub,
        email: session.user.email
      },
      _meta: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(error.status || 500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}