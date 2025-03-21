import { auth0 } from '@/lib/auth0';
import { base } from '../../../lib/airtable';
import { getCompleteUserProfile } from '../../../lib/userProfile';

/**
 * API endpoint to check if the current user has applied to a specific cohort
 * Returns all applications for the user, or filtered by cohort if cohortId is provided
 */
export default async function checkApplication(req, res) {
  try {
    // Get cohort ID from query params (optional)
    const { cohortId } = req.query;

    // Get the user session
    const session = await auth0.getSession(req);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated', applications: [] });
    }
    
    const userEmail = session.user.email.toLowerCase();
    
    // Try to get user profile to get the contact ID, but handle errors gracefully
    let userProfile = null;
    let contactId = null;
    
    try {
      userProfile = await getCompleteUserProfile(session.user);
      contactId = userProfile?.contactId;
      console.log(`Retrieved user profile with contactId: ${contactId || 'not found'}`);
    } catch (profileError) {
      console.error("Error fetching user profile:", profileError);
      // Instead of failing, we'll try a direct lookup by email below
    }
    
    if (!userProfile) {
      console.log("User profile not found, will try direct email lookup");
    }
    
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
      
      // Process application records but also include cohort details
      const processedApps = [];
      
      for (const record of records) {
        // Extract cohort ID from the record
        const recordCohortId = record.fields.Cohort && 
          Array.isArray(record.fields.Cohort) && 
          record.fields.Cohort.length > 0 
            ? record.fields.Cohort[0] 
            : null;
        
        // Create base application object
        const application = {
          id: record.id,
          cohortId: recordCohortId,
          status: record.fields.Status || 'Submitted',
          createdAt: record.fields.Created || record._rawJson.createdTime,
          // Add team join specific fields
          'Team to Join': record.fields['Team to Join'] || null,
          joinTeamMessage: record.fields['Join Team Message'] || record.fields['Xperience/Join Team Message'] || null,
          applicationType: record.fields['Type'] || (record.fields['Team to Join'] ? 'joinTeam' : null)
        };
        
        // If we have a cohort ID, fetch cohort details too
        if (recordCohortId) {
          try {
            const cohortsTable = process.env.AIRTABLE_COHORTS_TABLE_ID
              ? base(process.env.AIRTABLE_COHORTS_TABLE_ID)
              : null;
              
            if (cohortsTable) {
              const cohortRecord = await cohortsTable.find(recordCohortId);
              if (cohortRecord) {
                // Extract initiative details if available
                let initiativeDetails = null;
                
                if (cohortRecord.fields.Initiative && 
                    Array.isArray(cohortRecord.fields.Initiative) && 
                    cohortRecord.fields.Initiative.length > 0) {
                  const initiativesTable = process.env.AIRTABLE_INITIATIVES_TABLE_ID
                    ? base(process.env.AIRTABLE_INITIATIVES_TABLE_ID)
                    : null;
                    
                  if (initiativesTable) {
                    try {
                      const initiativeRecord = await initiativesTable.find(cohortRecord.fields.Initiative[0]);
                      if (initiativeRecord) {
                        initiativeDetails = {
                          id: initiativeRecord.id,
                          name: initiativeRecord.fields.Name || "Unknown Initiative",
                          description: initiativeRecord.fields.Description || ""
                        };
                      }
                    } catch (initError) {
                      console.error(`Error fetching initiative for cohort ${recordCohortId}:`, initError);
                    }
                  }
                }
                
                // Add cohort details to the application object
                application.cohortDetails = {
                  id: cohortRecord.id,
                  name: cohortRecord.fields['Short Name'] || "Unknown Cohort",
                  initiativeDetails
                };
              }
            }
          } catch (cohortError) {
            console.error(`Error fetching cohort ${recordCohortId}:`, cohortError);
          }
        }
        
        processedApps.push(application);
      }
      
      applications = processedApps;
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
                // Create application object
                const application = {
                  id: appRecord.id,
                  cohortId: appCohortId,
                  status: appRecord.fields.Status || 'Submitted',
                  createdAt: appRecord.fields.Created || appRecord._rawJson.createdTime,
                  // Add team join specific fields
                  'Team to Join': appRecord.fields['Team to Join'] || null,
                  joinTeamMessage: appRecord.fields['Join Team Message'] || appRecord.fields['Xperience/Join Team Message'] || null,
                  applicationType: appRecord.fields['Type'] || (appRecord.fields['Team to Join'] ? 'joinTeam' : null)
                };
                
                // If we have a cohort ID, fetch cohort details too
                if (appCohortId) {
                  try {
                    const cohortsTable = process.env.AIRTABLE_COHORTS_TABLE_ID
                      ? base(process.env.AIRTABLE_COHORTS_TABLE_ID)
                      : null;
                      
                    if (cohortsTable) {
                      const cohortRecord = await cohortsTable.find(appCohortId);
                      if (cohortRecord) {
                        // Extract initiative details if available
                        let initiativeDetails = null;
                        
                        if (cohortRecord.fields.Initiative && 
                            Array.isArray(cohortRecord.fields.Initiative) && 
                            cohortRecord.fields.Initiative.length > 0) {
                          const initiativesTable = process.env.AIRTABLE_INITIATIVES_TABLE_ID
                            ? base(process.env.AIRTABLE_INITIATIVES_TABLE_ID)
                            : null;
                            
                          if (initiativesTable) {
                            try {
                              const initiativeRecord = await initiativesTable.find(cohortRecord.fields.Initiative[0]);
                              if (initiativeRecord) {
                                initiativeDetails = {
                                  id: initiativeRecord.id,
                                  name: initiativeRecord.fields.Name || "Unknown Initiative",
                                  description: initiativeRecord.fields.Description || ""
                                };
                              }
                            } catch (initError) {
                              console.error(`Error fetching initiative for cohort ${appCohortId}:`, initError);
                            }
                          }
                        }
                        
                        // Add cohort details to the application object
                        application.cohortDetails = {
                          id: cohortRecord.id,
                          name: cohortRecord.fields['Short Name'] || "Unknown Cohort",
                          initiativeDetails
                        };
                      }
                    }
                  } catch (cohortError) {
                    console.error(`Error fetching cohort ${appCohortId}:`, cohortError);
                  }
                }
                
                applications.push(application);
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
};