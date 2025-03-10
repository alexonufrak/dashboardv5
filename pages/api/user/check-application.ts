import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth0ManagementClient } from '@/lib/auth0';
import { queryRecords, TABLES } from '@/lib/airtableClient';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSession(req, res);
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get user's Auth0 ID (sub)
    const userId = session.user.sub;
    
    // Get the user's metadata from Auth0 to find their Airtable Contact ID
    const auth0 = await getAuth0ManagementClient();
    const userResponse = await auth0.users.get({ id: userId });
    
    // The response is wrapped in an ApiResponse, so we need to access the data property
    const user = userResponse?.data;
    const metadata = user?.user_metadata || {};
    const contactId = metadata.contactId;
    
    if (!contactId) {
      // No contact ID, so no applications
      return res.status(200).json({ applications: [] });
    }
    
    // Query Airtable for this user's applications
    if (TABLES.APPLICATIONS) {
      try {
        // Construct a filter formula that looks for applications from this contact
        const filterFormula = `{Contact} = '${contactId}'`;
        
        const applications = await queryRecords('APPLICATIONS', filterFormula, {
          fields: [
            'Cohort', 
            'Status', 
            'Created At', 
            'Application Type',
            'Team',
            'Submission Date'
          ]
        });
        
        // If we have cohort references, fetch the cohort details
        // Create an array of unique cohort IDs
        const cohortIdsArray = applications
          .map((app: any) => app.Cohort)
          .filter(Boolean)
          .flat();
        
        // Use a manual approach to deduplicate
        const cohortIds: string[] = [];
        cohortIdsArray.forEach((id: string) => {
          if (id && !cohortIds.includes(id)) {
            cohortIds.push(id);
          }
        });
        
        let cohorts = {};
        
        if (cohortIds.length > 0 && TABLES.COHORTS) {
          // Fetch cohort details for all related cohorts
          const cohortRecords = await Promise.all(
            cohortIds.map(cohortId => 
              queryRecords('COHORTS', `RECORD_ID() = '${cohortId}'`, {
                fields: ['Name', 'Initiative', 'Current Cohort', 'Status']
              })
            )
          );
          
          // Create a lookup map of cohort details
          cohorts = cohortRecords
            .flat()
            .reduce((map: Record<string, any>, cohort: any) => {
              if (cohort.id) {
                map[cohort.id] = cohort;
              }
              return map;
            }, {});
        }
        
        // Format the application data for the frontend
        const formattedApplications = applications.map((app: any) => {
          const cohortId = Array.isArray(app.Cohort) ? app.Cohort[0] : app.Cohort;
          const cohort = cohortId ? (cohorts as Record<string, any>)[cohortId] : null;
          
          return {
            id: app.id,
            status: app.Status || 'pending',
            cohortId: cohortId,
            cohortName: cohort?.Name || 'Unknown Cohort',
            programId: cohort?.Initiative?.[0] || null,
            programName: null, // We would fetch this separately if needed
            submittedDate: app['Submission Date'] || app['Created At'] || new Date().toISOString(),
            applicationType: app['Application Type'] || 'Individual',
            teamId: Array.isArray(app.Team) ? app.Team[0] : app.Team
          };
        });
        
        return res.status(200).json({ applications: formattedApplications });
      } catch (airtableError) {
        console.error('Error fetching applications from Airtable:', airtableError);
        // If Airtable error, return empty array
        return res.status(200).json({ applications: [] });
      }
    } else {
      // If APPLICATIONS table ID is not configured, return empty array
      console.warn('AIRTABLE_APPLICATIONS_TABLE_ID not configured');
      return res.status(200).json({ applications: [] });
    }
  } catch (error: any) {
    console.error('Applications API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export default withApiAuthRequired(handler);