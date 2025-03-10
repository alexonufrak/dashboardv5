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
    
    const userId = session.user.sub;
    
    // Get user from Auth0 to access metadata
    const auth0 = await getAuth0ManagementClient();
    const userResponse = await auth0.users.get({ id: userId });
    const user = userResponse?.data || {};
    
    // Extract contact ID from user metadata
    const metadata = user.user_metadata || {};
    const contactId = metadata.contactId;
    
    if (!contactId) {
      // If no contact ID, return empty participation
      return res.status(200).json({ participation: [] });
    }
    
    // Query Airtable for this user's participation records
    if (TABLES.PARTICIPATION) {
      try {
        // Construct a filter formula that looks for participation from this contact
        const filterFormula = `{Contact} = '${contactId}'`;
        
        const participationRecords = await queryRecords('PARTICIPATION', filterFormula, {
          fields: [
            'Cohort',
            'Team',
            'Status',
            'Acceptance Date',
            'Created At'
          ]
        });
        
        // If we have cohort references, fetch the cohort details
        // Get all cohort IDs and deduplicate them
        const cohortIdsArray = participationRecords
          .map((p: any) => p.Cohort)
          .filter(Boolean)
          .flat();
          
        // Manually deduplicate the array
        const cohortIds: string[] = [];
        cohortIdsArray.forEach((id: string) => {
          if (id && !cohortIds.includes(id)) {
            cohortIds.push(id);
          }
        });
        
        let cohorts = {};
        let programs = {};
        
        if (cohortIds.length > 0 && TABLES.COHORTS) {
          // Fetch cohort details for all related cohorts
          const cohortRecords = await Promise.all(
            cohortIds.map(cohortId => 
              queryRecords('COHORTS', `RECORD_ID() = '${cohortId}'`, {
                fields: [
                  'Name', 
                  'Initiative', 
                  'Current Cohort', 
                  'Status',
                  'Is Current',
                  'Participation Type'
                ]
              })
            )
          );
          
          // Flatten and create lookup map
          const flattenedCohorts = cohortRecords.flat();
          
          // Create a lookup map of cohort details
          cohorts = flattenedCohorts.reduce((map: Record<string, any>, cohort: any) => {
            if (cohort.id) {
              map[cohort.id] = cohort;
            }
            return map;
          }, {});
          
          // Collect program IDs to fetch program details
          const programIdsArray = flattenedCohorts
            .map((c: any) => c.Initiative)
            .filter(Boolean)
            .flat();
            
          // Manually deduplicate the array
          const programIds: string[] = [];
          programIdsArray.forEach((id: string) => {
            if (id && !programIds.includes(id)) {
              programIds.push(id);
            }
          });
          
          // Fetch program details if we have program IDs
          if (programIds.length > 0 && TABLES.PROGRAMS) {
            const programRecords = await Promise.all(
              programIds.map(programId => 
                queryRecords('PROGRAMS', `RECORD_ID() = '${programId}'`, {
                  fields: ['Name', 'Participation Type', 'Description']
                })
              )
            );
            
            // Create a lookup map of program details
            programs = programRecords
              .flat()
              .reduce((map: Record<string, any>, program: any) => {
                if (program.id) {
                  map[program.id] = program;
                }
                return map;
              }, {});
          }
        }
        
        // Format the participation data for the frontend
        const formattedParticipation = participationRecords.map((p: any) => {
          const cohortId = Array.isArray(p.Cohort) ? p.Cohort[0] : p.Cohort;
          const cohort = cohortId ? (cohorts as Record<string, any>)[cohortId] : null;
          
          const programId = cohort?.Initiative?.length ? cohort.Initiative[0] : null;
          const program = programId ? (programs as Record<string, any>)[programId] : null;
          
          // Determine participation type from program or cohort
          const participationType = program?.['Participation Type'] || 
                                  cohort?.['Participation Type'] || 
                                  'Individual';
                                  
          // Build initiative details object
          const initiativeDetails = program ? {
            id: programId,
            name: program.Name || 'Unknown Program',
            description: program.Description,
            'Participation Type': participationType
          } : null;
          
          return {
            id: p.id,
            cohort: {
              id: cohortId,
              name: cohort?.Name || 'Unknown Cohort',
              'Current Cohort': cohort?.['Current Cohort'] || false,
              'Is Current': cohort?.['Is Current'] || false,
              initiativeDetails,
              participationType
            },
            teamId: Array.isArray(p.Team) ? p.Team[0] : p.Team,
            status: p.Status || 'active'
          };
        });
        
        return res.status(200).json({ participation: formattedParticipation });
      } catch (airtableError) {
        console.error('Error fetching participation data from Airtable:', airtableError);
        // If Airtable error, return empty array
        return res.status(200).json({ participation: [] });
      }
    } else {
      // If PARTICIPATION table ID is not configured, return empty array
      console.warn('AIRTABLE_PARTICIPATION_TABLE_ID not configured');
      return res.status(200).json({ participation: [] });
    }
  } catch (error: any) {
    console.error('Participation API error:', error);
    
    // If the error is a 404, return an empty participation array instead of an error
    if (error.status === 404 || error.statusCode === 404) {
      return res.status(200).json({ participation: [] });
    }
    
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export default withApiAuthRequired(handler);