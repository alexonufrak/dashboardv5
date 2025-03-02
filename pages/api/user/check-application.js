import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { base } from '../../../lib/airtable';
import { getCompleteUserProfile } from '../../../lib/userProfile';

/**
 * API endpoint to get all applications for the current user
 */
export default withApiAuthRequired(async function checkApplication(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the user session
    const session = await getSession(req, res);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get user profile to get the contact ID
    const userProfile = await getCompleteUserProfile(session.user);
    
    if (!userProfile || !userProfile.contactId) {
      return res.status(404).json({ 
        error: 'User profile not found or missing contact ID',
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

    // Try to find applications for this contact
    let records = [];
    
    try {
      // Query applications where Contact field contains the user's contact ID
      // Using proper formula for linked records
      records = await applicationsTable.select({
        filterByFormula: `FIND("${contactId}", ARRAYJOIN(Contact))>0`
      }).firstPage();
    } catch (error) {
      // If the first query fails, try alternative format
      try {
        records = await applicationsTable.select({
          filterByFormula: `{Contact} = "${contactId}"`
        }).firstPage();
      } catch (secondError) {
        // Just log and continue with empty records
        console.error('Error finding applications:', secondError);
      }
    }
    
    // Transform to simpler format
    const applications = records.map(record => {
      // Get cohort ID from the schema fields
      let cohortId = null;
      
      // Check for Cohort field (linked record)
      if (record.fields.Cohort && Array.isArray(record.fields.Cohort)) {
        cohortId = record.fields.Cohort[0];
      }
      
      // Get application status from Status field
      const status = record.fields.Status || 'Submitted';
      
      return {
        id: record.id,
        cohortId: cohortId,
        status: status,
        createdAt: record._rawJson.createdTime
      };
    });

    // Return all applications
    return res.status(200).json({
      applications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({
      error: 'Failed to fetch applications',
      applications: []
    });
  }
});