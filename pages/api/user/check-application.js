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
    console.log('Getting user profile from session:', session.user.email);
    const userProfile = await getCompleteUserProfile(session.user);
    console.log('User profile retrieved:', {
      hasProfile: !!userProfile,
      hasContactId: userProfile?.contactId ? true : false,
      contactId: userProfile?.contactId || 'N/A'
    });
    
    if (!userProfile || !userProfile.contactId) {
      console.warn('User profile or contact ID missing');
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

    console.log(`Applications table initialized: ${!!applicationsTable}`);
    console.log('Applications table ID:', process.env.AIRTABLE_APPLICATIONS_TABLE_ID || 'Not set');
    
    // Check table fields (for debugging)
    try {
      // Try to get just one record to see the schema
      const sampleRecords = await applicationsTable.select({
        maxRecords: 1
      }).firstPage();
      
      if (sampleRecords.length > 0) {
        console.log('Application record fields sample:', Object.keys(sampleRecords[0].fields));
        console.log('Sample record contact field:', sampleRecords[0].fields.Contact);
      } else {
        console.log('No sample records found in Applications table');
      }
    } catch (sampleError) {
      console.error('Error fetching sample record:', sampleError);
    }
    
    // Look for all applications for this contact
    console.log(`Querying applications with formula: {Contact} = "${contactId}"`);
    const records = await applicationsTable.select({
      filterByFormula: `{Contact} = "${contactId}"`,
      fields: ['Cohort', 'Status']
    }).firstPage();

    console.log(`Found ${records.length} applications for contact ${contactId}`);
    
    if (records.length > 0) {
      console.log('First application details:', {
        id: records[0].id,
        cohortField: records[0].fields.Cohort,
        statusField: records[0].fields.Status
      });
    }
    
    // Transform the records into a simpler format
    const applications = records.map(record => ({
      id: record.id,
      cohortId: record.fields.Cohort ? record.fields.Cohort[0] : null,
      status: record.fields.Status || 'Submitted',
      createdAt: record._rawJson.createdTime
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