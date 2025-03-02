import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { base } from '../../../lib/airtable';
import { getCompleteUserProfile } from '../../../lib/userProfile';

/**
 * API endpoint to check if the current user has applied to a specific cohort
 * Returns all applications for the user, or filtered by cohort if cohortId is provided
 */
export default withApiAuthRequired(async function checkApplication(req, res) {
  try {
    // Get cohort ID from query params (optional)
    const { cohortId } = req.query;

    // Get the user session
    const session = await getSession(req, res);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated', applications: [] });
    }
    
    const userEmail = session.user.email.toLowerCase();
    
    // Get user profile to get the contact ID
    const userProfile = await getCompleteUserProfile(session.user);
    
    if (!userProfile) {
      return res.status(404).json({ 
        error: 'User profile not found',
        applications: []
      });
    }
    
    const contactId = userProfile.contactId;
    
    // Initialize Airtable tables
    const contactsTable = process.env.AIRTABLE_CONTACTS_TABLE_ID 
      ? base(process.env.AIRTABLE_CONTACTS_TABLE_ID) 
      : null;
      
    const applicationsTable = process.env.AIRTABLE_APPLICATIONS_TABLE_ID
      ? base(process.env.AIRTABLE_APPLICATIONS_TABLE_ID)
      : null;

    if (!applicationsTable || !contactsTable) {
      return res.status(500).json({
        error: 'Airtable tables not configured',
        applications: []
      });
    }
    
    // If we don't have a contact ID yet, try to look it up by email
    let actualContactId = contactId;
    
    if (!actualContactId) {
      try {
        // Look up the contact by email
        const contactRecords = await contactsTable.select({
          filterByFormula: `LOWER({Email}) = "${userEmail}"`,
          maxRecords: 1
        }).firstPage();
        
        if (contactRecords && contactRecords.length > 0) {
          actualContactId = contactRecords[0].id;
        }
      } catch (error) {
        console.error('Error looking up contact by email:', error);
      }
    }
    
    // If we still don't have a contact ID, we can't find applications
    if (!actualContactId) {
      return res.status(404).json({
        error: 'Contact record not found',
        applications: []
      });
    }
    
    // Find applications using multiple approaches
    let applications = [];
    
    // Approach 1: Try to find applications through the Applications table
    try {
      let filterFormula;
      
      if (cohortId) {
        // Filter by both contact and cohort
        filterFormula = `AND(
          OR(
            {Contact} = "${actualContactId}",
            {Email} = "${userEmail}"
          ),
          {Cohort} = "${cohortId}"
        )`;
      } else {
        // Filter by contact only
        filterFormula = `OR(
          {Contact} = "${actualContactId}",
          {Email} = "${userEmail}"
        )`;
      }
      
      const records = await applicationsTable.select({
        filterByFormula: filterFormula
      }).firstPage();
      
      // Process application records
      applications = records.map(record => {
        // Extract cohort ID from the record
        const recordCohortId = record.fields.Cohort && 
          Array.isArray(record.fields.Cohort) && 
          record.fields.Cohort.length > 0 
            ? record.fields.Cohort[0] 
            : null;
        
        return {
          id: record.id,
          cohortId: recordCohortId,
          status: record.fields.Status || 'Submitted',
          createdAt: record.fields.Created || record._rawJson.createdTime
        };
      });
    } catch (error) {
      console.error('Error finding applications through Applications table:', error);
    }
    
    // Approach 2: If no applications found and we have a contactId, check through Contacts→Applications link
    if (applications.length === 0 && actualContactId) {
      try {
        // Get the contact record with its Applications links
        const contactRecord = await contactsTable.find(actualContactId);
        
        if (contactRecord && 
            contactRecord.fields.Applications && 
            Array.isArray(contactRecord.fields.Applications) && 
            contactRecord.fields.Applications.length > 0) {
            
          // Get application IDs from the contact record  
          const applicationIds = contactRecord.fields.Applications;
          
          // Fetch each application
          for (const appId of applicationIds) {
            try {
              const appRecord = await applicationsTable.find(appId);
              
              // Only include if cohort matches (if specified)
              const appCohortId = appRecord.fields.Cohort && 
                Array.isArray(appRecord.fields.Cohort) && 
                appRecord.fields.Cohort.length > 0 
                  ? appRecord.fields.Cohort[0] 
                  : null;
              
              if (!cohortId || cohortId === appCohortId) {
                applications.push({
                  id: appRecord.id,
                  cohortId: appCohortId,
                  status: appRecord.fields.Status || 'Submitted',
                  createdAt: appRecord.fields.Created || appRecord._rawJson.createdTime
                });
              }
            } catch (appError) {
              console.error(`Error fetching application ${appId}:`, appError);
            }
          }
        }
      } catch (error) {
        console.error('Error finding applications through contact record:', error);
      }
    }
    
    // Filter out applications for a specific cohort if requested
    if (cohortId && applications.length > 0) {
      applications = applications.filter(app => app.cohortId === cohortId);
    }
    
    // Return applications
    return res.status(200).json({ applications });
  } catch (error) {
    console.error('Error checking application:', error);
    return res.status(500).json({
      error: 'Failed to check application',
      applications: []
    });
  }
});