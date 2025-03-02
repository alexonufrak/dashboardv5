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
    // Get cohort ID from query params
    const { cohortId } = req.query;
    
    if (!cohortId) {
      return res.status(400).json({ 
        error: 'Missing cohort ID',
        applications: [] 
      });
    }

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

    // Query applications where Contact is the user's contact ID AND Cohort is the specified cohort
    let records = [];
    
    try {
      records = await applicationsTable.select({
        filterByFormula: `AND(
          FIND("${contactId}", ARRAYJOIN(Contact))>0,
          FIND("${cohortId}", ARRAYJOIN(Cohort))>0
        )`
      }).firstPage();
    } catch (error) {
      console.error('Error finding applications:', error);
    }
    
    // Transform to simpler format
    const applications = records.map(record => ({
      id: record.id,
      cohortId: cohortId,
      status: record.fields.Status || 'Submitted',
      createdAt: record._rawJson.createdTime
    }));

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