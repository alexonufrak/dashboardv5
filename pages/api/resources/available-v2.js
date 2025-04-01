import { resources, participation } from '@/lib/airtable/entities';
import { auth0 } from '@/lib/auth0';

/**
 * API endpoint to fetch all resources available to a user
 * Combines global resources with program and cohort-specific resources
 * Demonstrates using the new modular Airtable architecture
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

    // Get global resources (available to all users)
    const globalResources = await resources.getGlobalResources();
    
    // Get user's participation records to identify their programs and cohorts
    const participationRecords = await participation.getParticipationRecords(user.sub);
    
    // Extract unique program and cohort IDs from participation
    const programIds = [...new Set(
      participationRecords
        .filter(record => record.programId)
        .map(record => record.programId)
    )];
    
    const cohortIds = [...new Set(
      participationRecords
        .filter(record => record.cohortId)
        .map(record => record.cohortId)
    )];
    
    // Fetch resources for each program and cohort
    const programResourcesPromises = programIds.map(programId => 
      resources.getResourcesByProgram(programId)
    );
    
    const cohortResourcesPromises = cohortIds.map(cohortId => 
      resources.getResourcesByCohort(cohortId)
    );
    
    // Wait for all resource fetches to complete
    const programResourcesArrays = await Promise.all(programResourcesPromises);
    const cohortResourcesArrays = await Promise.all(cohortResourcesPromises);
    
    // Flatten the arrays of arrays
    const programResources = programResourcesArrays.flat();
    const cohortResources = cohortResourcesArrays.flat();
    
    // Combine all resources
    const allResources = [
      ...globalResources,
      ...programResources,
      ...cohortResources
    ];
    
    // Deduplicate resources by ID
    const uniqueResources = allResources.reduce((acc, resource) => {
      if (!acc[resource.id]) {
        acc[resource.id] = resource;
      }
      return acc;
    }, {});
    
    // Organize resources by category
    const resourcesByCategory = Object.values(uniqueResources).reduce((acc, resource) => {
      const category = resource.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(resource);
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      resources: Object.values(uniqueResources),
      resourcesByCategory
    });
  } catch (error) {
    console.error('Error fetching available resources:', error);
    return res.status(500).json({
      error: 'An error occurred while fetching available resources',
      message: error.message,
      details: error.details || {}
    });
  }
}