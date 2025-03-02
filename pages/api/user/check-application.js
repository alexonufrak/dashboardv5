import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { base } from '../../../lib/airtable';
import { getCompleteUserProfile } from '../../../lib/userProfile';

/**
 * API endpoint to check if the current user has applied to a specific cohort
 */
export default withApiAuthRequired(async function checkApplication(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get cohort ID from query params (optional)
    const { cohortId } = req.query;

    // Get the user session
    const session = await getSession(req, res);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get user profile to get the contact ID
    const userProfile = await getCompleteUserProfile(session.user);
    
    if (!userProfile || !userProfile.contactId) {
      return res.status(404).json({ 
        error: 'User profile not found',
        applications: []
      });
    }
    
    const contactId = userProfile.contactId;
    
    // Initialize Applications table
    const applicationsTable = process.env.AIRTABLE_APPLICATIONS_TABLE_ID
      ? base(process.env.AIRTABLE_APPLICATIONS_TABLE_ID)
      : null;

    if (!applicationsTable) {
      return res.status(500).json({
        error: 'Applications table not configured',
        applications: []
      });
    }

    // Query applications for the current user
    let records = [];
    
    try {
      // If cohortId is provided, filter by both contact and cohort
      // Otherwise, just filter by contact
      const filterFormula = cohortId 
        ? `AND(
            FIND("${contactId}", ARRAYJOIN(Contact))>0,
            FIND("${cohortId}", ARRAYJOIN(Cohort))>0
          )`
        : `FIND("${contactId}", ARRAYJOIN(Contact))>0`;
      
      records = await applicationsTable.select({
        filterByFormula: filterFormula
      }).firstPage();
    } catch (error) {
      console.error('Error finding applications:', error);
    }
    
    // Transform to simpler format
    const applications = records.map(record => {
      // Get cohort ID from the record
      const recordCohortId = record.fields.Cohort && Array.isArray(record.fields.Cohort) 
        ? record.fields.Cohort[0] 
        : null;
      
      return {
        id: record.id,
        cohortId: recordCohortId,
        status: record.fields.Status || 'Submitted',
        createdAt: record._rawJson.createdTime
      };
    });

    // Return applications matching the criteria
    return res.status(200).json({
      applications
    });
  } catch (error) {
    console.error('Error checking application:', error);
    return res.status(500).json({
      error: 'Failed to check application',
      applications: []
    });
  }
});