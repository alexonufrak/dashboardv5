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

    // Debug applications table configuration
    console.log(`Applications table initialized: ${!!applicationsTable}`);
    console.log('Applications table ID:', process.env.AIRTABLE_APPLICATIONS_TABLE_ID || 'Not set');
    
    // List all available table IDs from env vars for debugging
    const envKeys = Object.keys(process.env).filter(key => 
      key.startsWith('AIRTABLE_') && key.endsWith('_TABLE_ID')
    );
    console.log('Available Airtable table env vars:', envKeys);
    
    // For debugging - Airtable doesn't have a tables() method in this version
    // We'll extract table info from the environment variables instead
    try {
      console.log('Listing tables from environment variables');
      const tableInfo = [];
      
      // Find all Airtable table IDs from env vars
      const tableEnvVars = Object.keys(process.env).filter(key => 
        key.startsWith('AIRTABLE_') && key.endsWith('_TABLE_ID')
      );
      
      // Map each env var to a table entry with name and ID
      tableEnvVars.forEach(envVar => {
        const tableName = envVar.replace('AIRTABLE_', '').replace('_TABLE_ID', '');
        const tableId = process.env[envVar];
        tableInfo.push({ name: tableName, id: tableId });
      });
      
      console.log('Tables configured in environment:', tableInfo);
    } catch (error) {
      console.error('Error listing tables from environment:', error);
      console.log('Error details:', error.message);
    }
    
    // Check table fields (for debugging)
    try {
      // Try to get just one record to see the schema
      const sampleRecords = await applicationsTable.select({
        maxRecords: 1
      }).firstPage();
      
      if (sampleRecords.length > 0) {
        console.log('Application record fields sample:', Object.keys(sampleRecords[0].fields));
        console.log('Sample record details:', sampleRecords[0].fields);
      } else {
        console.log('No sample records found in Applications table');
      }
    } catch (sampleError) {
      console.error('Error fetching sample record:', sampleError);
    }
    
    // Try different field names that might be used in the table
    // Look for applications with multiple possible field names for Contact
    console.log(`Attempting to find applications for contact ${contactId} with various field name options`);
    
    // Try with simple formula first - use the correct field name from schema
    let records = [];
    try {
      records = await applicationsTable.select({
        filterByFormula: `SEARCH("${contactId}", {Record ID (from Contact)})`,
      }).firstPage();
      
      console.log(`Found ${records.length} applications using {Record ID (from Contact)} field`);
    } catch (error) {
      console.error('Error querying with Record ID (from Contact) field:', error);
      
      // Try the Contact field directly (this is the linked record field)
      try {
        // Proper syntax for checking linked record fields in Airtable
        records = await applicationsTable.select({
          filterByFormula: `SEARCH("${contactId}", ARRAYJOIN({Contact}))`,
        }).firstPage();
        
        console.log(`Found ${records.length} applications using {Contact} linked record field`);
      } catch (contactError) {
        console.error('Error querying with Contact linked record field:', contactError);
      }
    }
    
    // If still no results, try listing all applications to see what's there
    if (records.length === 0) {
      try {
        const allRecords = await applicationsTable.select({
          maxRecords: 5 // Limit to 5 for testing
        }).firstPage();
        
        console.log(`Found ${allRecords.length} total applications in table`);
        
        if (allRecords.length > 0) {
          // Check the fields of the first record
          console.log('Application record example:', {
            id: allRecords[0].id,
            allFields: allRecords[0].fields
          });
        }
      } catch (error) {
        console.error('Error listing all applications:', error);
      }
    }
    
    console.log(`Found ${records.length} applications for contact ${contactId}`);
    
    if (records.length > 0) {
      console.log('First application details:', {
        id: records[0].id,
        allFields: records[0].fields
      });
    }
    
    // Get possible field names for cohort and status
    const cohortFieldNames = ['Cohort', 'Program', 'Initiative', 'CohortId'];
    const statusFieldNames = ['Status', 'Application Status', 'State'];
    
    // Transform the records into a simpler format with field name flexibility
    const applications = records.map(record => {
      // Find cohort ID using various possible field names
      let cohortId = null;
      for (const fieldName of cohortFieldNames) {
        if (record.fields[fieldName]) {
          // Handle both string and array formats
          cohortId = Array.isArray(record.fields[fieldName]) 
            ? record.fields[fieldName][0] 
            : record.fields[fieldName];
          break;
        }
      }
      
      // Find status using various possible field names
      let status = 'Submitted';
      for (const fieldName of statusFieldNames) {
        if (record.fields[fieldName]) {
          status = record.fields[fieldName];
          break;
        }
      }
      
      return {
        id: record.id,
        cohortId: cohortId,
        status: status,
        createdAt: record._rawJson.createdTime
      };
    });
    
    console.log('Transformed applications:', applications);

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