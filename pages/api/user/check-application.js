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
    console.log(`Getting applications for contact ID: ${contactId}`);

    // Initialize Applications table
    const applicationsTable = process.env.AIRTABLE_APPLICATIONS_TABLE_ID
      ? base(process.env.AIRTABLE_APPLICATIONS_TABLE_ID)
      : null;

    if (!applicationsTable) {
      console.error("Applications table not configured");
      return res.status(500).json({
        error: 'Applications table not configured',
        applications: []
      });
    }

    // Look for all applications for this contact
    const records = await applicationsTable.select({
      filterByFormula: `{Contact} = "${contactId}"`,
      fields: ['Cohort', 'Status', 'Created Time']
    }).firstPage();

    console.log(`Found ${records.length} applications for contact ${contactId}`);
    
    // Transform the records into a simpler format
    const applications = records.map(record => ({
      id: record.id,
      cohortId: record.fields.Cohort ? record.fields.Cohort[0] : null,
      status: record.fields.Status || 'Submitted',
      createdAt: record.fields['Created Time'] || record._rawJson.createdTime
    }));

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