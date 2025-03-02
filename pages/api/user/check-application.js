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

    // Initialize Applications table with proper logging
    const applicationsTableId = process.env.AIRTABLE_APPLICATIONS_TABLE_ID;
    console.log(`Applications table ID from env: ${applicationsTableId || 'Not set'}`);
    
    // Verify we have a table ID and initialize the table
    const applicationsTable = applicationsTableId 
      ? base(applicationsTableId)
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
    console.log('All environment variables related to Airtable:', 
      Object.keys(process.env)
        .filter(key => key.includes('AIRTABLE'))
        .reduce((obj, key) => {
          obj[key] = process.env[key] ? 'Set' : 'Not set';
          return obj;
        }, {})
    );
    
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
    
    // Try all possible approaches to find the user's applications
    let records = [];
    
    // 1. First try: Use Contact linked field (most reliable)
    try {
      console.log(`Searching for applications with Contact field containing "${contactId}"`);
      records = await applicationsTable.select({
        filterByFormula: `OR(
          SEARCH("${contactId}", ARRAYJOIN({Contact})),
          SEARCH("${contactId}", {Record ID (from Contact)})
        )`,
      }).firstPage();
      
      console.log(`Found ${records.length} applications using Contact field approaches`);
    } catch (error) {
      console.error('Error querying with Contact fields:', error);
    }
    
    // 2. Second try: If no records found, try by user email
    if (records.length === 0) {
      try {
        const userEmail = session.user.email.toLowerCase();
        console.log(`Searching for applications with Email field matching "${userEmail}"`);
        
        records = await applicationsTable.select({
          filterByFormula: `LOWER({Email}) = "${userEmail}"`,
        }).firstPage();
        
        console.log(`Found ${records.length} applications using Email field match`);
      } catch (emailError) {
        console.error('Error querying with Email field:', emailError);
      }
    }
    
    // 3. Third try: If still no records, try using Email lookup from Contact
    if (records.length === 0) {
      try {
        const userEmail = session.user.email.toLowerCase();
        console.log(`Searching for applications with Email (from Contact) matching "${userEmail}"`);
        
        records = await applicationsTable.select({
          filterByFormula: `LOWER({Email (from Contact)}) = "${userEmail}"`,
        }).firstPage();
        
        console.log(`Found ${records.length} applications using Email (from Contact) field match`);
      } catch (emailLookupError) {
        console.error('Error querying with Email (from Contact) field:', emailLookupError);
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
    
    // Log contact ID to confirm correct user
    console.log(`Using contact ID for signed-in user: ${contactId}`);
    
    // If records are still empty, try a direct approach with the app ID env var
    if (records.length === 0) {
      try {
        console.log('Trying to find all applications in table');
        
        // Get all records to see if any applications exist
        const sampleRecords = await applicationsTable.select({
          maxRecords: 10
        }).firstPage();
        
        console.log(`Found ${sampleRecords.length} total applications in table`);
        
        if (sampleRecords.length > 0) {
          console.log('Sample application fields:', Object.keys(sampleRecords[0].fields));
          
          // Check if any of these records match our contact ID
          const matchingRecords = sampleRecords.filter(record => {
            // Check in Contact field if it's an array
            if (record.fields.Contact && Array.isArray(record.fields.Contact)) {
              return record.fields.Contact.includes(contactId);
            }
            // Check in Record ID from Contact if it's a string
            if (record.fields['Record ID (from Contact)'] && 
                record.fields['Record ID (from Contact)'].includes(contactId)) {
              return true;
            }
            // Check in Email field
            if (record.fields.Email && record.fields.Email.toLowerCase() === session.user.email.toLowerCase()) {
              return true;
            }
            return false;
          });
          
          if (matchingRecords.length > 0) {
            console.log(`Found ${matchingRecords.length} matching records by manual filtering`);
            records = matchingRecords;
          }
        }
      } catch (error) {
        console.error('Error in fallback application search:', error);
      }
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
      
      // Log each found application for debugging
      console.log(`Processing application record ${record.id}:`, {
        cohortId,
        status,
        fields: Object.keys(record.fields)
      });
      
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