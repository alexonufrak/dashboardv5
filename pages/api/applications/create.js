import { auth0 } from '@/lib/auth0'
import { createParticipationRecord } from '@/lib/airtable/entities';


/**
 * API handler to create a new application
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
async function createApplicationHandler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the user session using Auth0 v4
    const session = await auth0.getSession(req, res)
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    
    // Get the request body containing application data
    const { 
      cohortId, 
      teamId, 
      participationType,
      applicationType,
      // Additional fields for Xtrapreneurs applications
      reason,
      commitment,
      // Fields for team join requests (Xperience and Horizons Challenge)
      teamToJoin,
      joinTeamMessage
    } = req.body
    
    console.log("Application create request:", {
      cohortId,
      teamId,
      participationType,
      applicationType,
      teamToJoin,
      hasJoinMessage: !!joinTeamMessage
    });
    
    if (!cohortId) {
      return res.status(400).json({ error: 'Cohort ID is required' })
    }
    
    // Only require team ID for team applications
    // We get the participation type from the client to avoid having to re-fetch the cohort
    if (participationType === 'Team' && !teamId) {
      return res.status(400).json({ error: 'Team ID is required for team applications' })
    }
    
    // Verify Xtrapreneurs application data if applicable
    if (applicationType === 'xtrapreneurs') {
      if (!reason) {
        return res.status(400).json({ error: 'Reason for joining Xtrapreneurs is required' })
      }
      if (!commitment) {
        return res.status(400).json({ error: 'Commitment level is required' })
      }
      
      // For Xtrapreneurs applications, set status to "Accepted" immediately
      applicationStatus = 'Accepted'
    }
    
    // Get user profile from Airtable
    const userProfile = await getUserProfile(session.user.sub, session.user.email)
    
    if (!userProfile || !userProfile.contactId) {
      return res.status(404).json({ error: 'User profile not found' })
    }
    
    // Use the imported base from lib/airtable.js
    
    // Get the Applications table ID from environment variables
    const applicationsTableId = process.env.AIRTABLE_APPLICATIONS_TABLE_ID
    if (!applicationsTableId) {
      return res.status(500).json({ error: 'Applications table ID not configured' })
    }
    
    // Initialize the applications table
    const applicationsTable = base(applicationsTableId)
    
    // Check if we need to create an application record
    console.log(`Evaluating application record creation for contact ${userProfile.contactId}, cohort ${cohortId}, team ${teamId}`)
    
    // Fetch initiative details to determine if we need to create an application
    let shouldCreateApplication = false;
    let applicationStatus = 'Submitted';
    let initiativeName = "";
    let isTeamBasedInitiative = false;
    let participationResult = null;
    
    try {
      // Get the cohort record
      const cohortsTable = base(process.env.AIRTABLE_COHORTS_TABLE_ID);
      const initiativesTable = base(process.env.AIRTABLE_INITIATIVES_TABLE_ID);
      
      const cohort = await cohortsTable.find(cohortId);
      
      if (cohort && cohort.fields.Initiative && cohort.fields.Initiative.length > 0) {
        const initiativeId = cohort.fields.Initiative[0];
        const initiative = await initiativesTable.find(initiativeId);
        
        if (initiative) {
          initiativeName = initiative.fields.Name || "Unknown Initiative";
          const enrollmentType = initiative.fields["Enrollment Type"] || "Review";
          const participationType = initiative.fields["Participation Type"] || "Individual";
          
          // Check if this is a team-based participation
          isTeamBasedInitiative = 
            participationType.toLowerCase().includes("team") ||
            participationType.toLowerCase() === "teams" ||
            participationType.toLowerCase() === "group" ||
            participationType.toLowerCase().includes("collaborative");
            
          console.log(`Initiative ${initiativeName} has enrollment type: ${enrollmentType}, participation type: ${participationType}`);
          
          // Determine if this is a special case where we need a formal application
          // 1. Xperiment initiatives always need applications
          // 2. Team join requests always need applications
          // 3. Any program with "Review" enrollment that requires approval needs applications
          
          const isXperiment = initiativeName.toLowerCase().includes("xperiment");
          
          // Set application status to "Accepted" if enrollment type is "Immediate"
          if (enrollmentType === "Immediate") {
            applicationStatus = 'Accepted';
            console.log(`Setting application status to "Accepted" for immediate enrollment`);
          }
          
          // Determine if we should create an application record
          if (isXperiment) {
            console.log("Creating application for Xperiment (always requires approval)");
            shouldCreateApplication = true;
          } else if (applicationType === 'joinTeam') {
            console.log("Creating application for team join request (always requires approval)");
            shouldCreateApplication = true;
          } else if (isTeamBasedInitiative && enrollmentType === "Review") {
            console.log("Creating application for team-based initiative with Review enrollment");
            shouldCreateApplication = true;
          } else {
            console.log("Skipping application creation - this is a direct join program");
            shouldCreateApplication = false;
            
            // For direct join programs, create participation record directly
            try {
              participationResult = await createParticipationRecord(userProfile.contactId, cohortId);
              console.log("Direct join participation record creation result:", participationResult);
            } catch (participationError) {
              console.error("Error creating direct join participation record:", participationError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking initiative details:", error);
      // Default to creating application if we can't determine
      shouldCreateApplication = true;
    }
    
    // If we're not creating an application, return success with participation result
    if (!shouldCreateApplication) {
      // Also update the user's Onboarding status in Airtable to "Joined"
      try {
        // Initialize the contacts table
        const contactsTableId = process.env.AIRTABLE_CONTACTS_TABLE_ID;
        if (!contactsTableId) {
          console.error('Contacts table ID not configured');
        } else {
          const contactsTable = base(contactsTableId);
          await contactsTable.update(userProfile.contactId, {
            "Onboarding": "Joined"
          });
          console.log(`Updated contact ${userProfile.contactId} Onboarding status to "Joined" for direct join`);
        }
      } catch (onboardingError) {
        console.error("Error updating onboarding status:", onboardingError);
      }
      
      return res.status(200).json({
        success: true,
        message: "Direct join program - created participation record without application",
        contactId: userProfile.contactId,
        cohortId: cohortId,
        teamId: teamId,
        participation: participationResult || null
      });
    }
    
    // Prepare application data - using only the current field names
    const applicationData = {
      'Contact': [userProfile.contactId],
      'Cohort': [cohortId],
      'Status': applicationStatus
      // Removed 'Submission Date' as it doesn't exist in the Airtable schema
      // The 'Created' field is automatically handled by Airtable
    }
    
    // If team ID is provided for a regular application, we DON'T add it to Team to Join
    // Only join team requests should use Team to Join field
    // For regular team applications, we don't set any team field in the application data
    if (teamId) {
      // Don't add any team field for regular applications
      // The Team field no longer exists in schema and Team to Join is for join requests only
      
      // Also update the team with the cohort ID - this is a critical addition
      try {
        // Get the Teams table
        const teamsTableId = process.env.AIRTABLE_TEAMS_TABLE_ID
        if (!teamsTableId) {
          console.error('Teams table ID not configured')
        } else {
          // Initialize the teams table
          const teamsTable = base(teamsTableId)
          
          // First, get the current team to check existing cohorts
          const teamRecord = await teamsTable.find(teamId)
          
          if (teamRecord) {
            // Check if the team already has this cohort
            const currentCohorts = teamRecord.fields['Cohorts'] || []
            
            // Only update if this cohort isn't already associated
            if (!currentCohorts.includes(cohortId)) {
              console.log(`Updating team ${teamId} to add cohort ${cohortId}`)
              
              // Add the cohort to the team's cohorts array
              await teamsTable.update(teamId, {
                'Cohorts': [...currentCohorts, cohortId]
              })
              
              console.log(`Successfully associated cohort ${cohortId} with team ${teamId}`)
            } else {
              console.log(`Cohort ${cohortId} already associated with team ${teamId}`)
            }
          } else {
            console.error(`Team ${teamId} not found during application submission`)
          }
        }
      } catch (teamUpdateError) {
        // Log but don't fail if team update fails
        console.error('Error updating team with cohort ID:', teamUpdateError)
        console.error('Application will continue without team-cohort association')
      }
    }
    
    // Add Xtrapreneurs-specific data if applicable
    if (applicationType === 'xtrapreneurs') {
      applicationData['Xtrapreneurs/Reason'] = reason;
      
      // Set status to Accepted for Xtrapreneurs applications
      applicationData['Status'] = 'Accepted';
      
      // Store the commitment level directly (already in correct format)
      applicationData['Xtrapreneurs/Commitment'] = commitment;
      
      console.log('Creating Xtrapreneurs application with data:', {
        reason,
        commitment,
        status: 'Accepted',
        contactId: userProfile.contactId,
        cohortId
      });
    }
    
    // Add join team request data if applicable
    if (applicationType === 'joinTeam') {
      // Get teamToJoin from either teamId (new way) or teamToJoin (old way)
      const targetTeamId = teamId || teamToJoin;
      
      if (!targetTeamId) {
        return res.status(400).json({ error: 'Team to join is required for join team requests' });
      }
      
      if (!joinTeamMessage) {
        return res.status(400).json({ error: 'Join team message is required' });
      }
      
      // Override status to always be 'Submitted' for team join requests, regardless of enrollment type
      // This ensures team join requests are always reviewed by admins
      applicationData['Status'] = 'Submitted';
      console.log("Overriding status to 'Submitted' for team join request");
      
      // Log team join request details for debugging
      console.log("Processing team join request with:", {
        targetTeamId,
        joinTeamMessage,
        fields: Object.keys(applicationData)
      });
      
      // Add join team message - just use the standard field name
      // We're removing 'Xperience/Team to Join' and 'Xperience/Join Team Message' which may no longer exist in schema
      applicationData['Join Team Message'] = joinTeamMessage;
      
      // Log the application data structure before creating
      console.log("Final application data fields:", Object.keys(applicationData));
      
      // Use "Team to Join" field which exists in the Airtable schema
      // The field name "Team" doesn't exist in the current Airtable schema
      applicationData['Team to Join'] = [targetTeamId];
      
      console.log('Creating team join request with data:', {
        teamId: targetTeamId,
        joinTeamMessage,
        status: 'Submitted', // Always Submitted for team join requests
        contactId: userProfile.contactId,
        cohortId
      });
    }
    
    // Create the application record
    const applicationRecord = await applicationsTable.create(applicationData)
    
    // Check if application was created successfully
    if (!applicationRecord || !applicationRecord.id) {
      throw new Error('Failed to create application record')
    }
    
    // Step 3: Update the user's Onboarding status in Airtable to "Applied"
    try {
      // Initialize the contacts table
      const contactsTableId = process.env.AIRTABLE_CONTACTS_TABLE_ID;
      if (!contactsTableId) {
        console.error('Contacts table ID not configured');
      } else {
        const contactsTable = base(contactsTableId);
        // Update the contact record with the new onboarding status
        await contactsTable.update(userProfile.contactId, {
          "Onboarding": "Applied"
        });
        console.log(`Updated contact ${userProfile.contactId} Onboarding status to "Applied"`);
      }
    } catch (onboardingError) {
      // Log but don't fail if onboarding update fails
      console.error("Error updating onboarding status:", onboardingError);
    }
    
    // Step 4: After application is created, try to create a participation record
    // But skip for team join requests - we only create participation when the request is approved
    // Note: We already might have participationResult from the direct join path
    
    // Only process this section if we haven't already created a participation record
    if (!participationResult) {
      // Check if this is a team join request - if so, don't create participation record yet
      if (applicationType === 'joinTeam') {
        console.log("Skipping participation record creation for team join request - will be created when approved");
        participationResult = { 
          success: true, 
          created: false, 
          message: "Team join request - participation record will be created when approved"
        };
      } else if (initiativeName.toLowerCase().includes("xperiment")) {
        // Skip participation record creation for Xperiment which requires approval
        console.log("Skipping participation record creation for Xperiment - requires approval");
        participationResult = { 
          success: true, 
          created: false, 
          message: "Xperiment program - participation record will be created upon approval" 
        };
      } else {
        // For other application types, proceed with normal participation record creation
        // Our createParticipationRecord function now handles the logic for which programs get
        // immediate participation records
        try {
          participationResult = await createParticipationRecord(userProfile.contactId, cohortId);
          console.log("Participation record creation result:", participationResult);
        } catch (participationError) {
          // Log but don't fail if participation creation fails
          console.error("Error creating participation record:", participationError);
        }
      }
    }
    
    // Return success response
    return res.status(201).json({
      id: applicationRecord.id,
      status: applicationStatus, // Use the actual status that was set
      contactId: userProfile.contactId,
      cohortId: cohortId,
      teamId: teamId,
      createdTime: applicationRecord.fields['Created'] || new Date().toISOString(),
      // Include participation information if available
      participation: participationResult || null
    })
  } catch (error) {
    console.error('Error creating application:', error)
    console.error('Error details:', error.message, error.stack)
    
    // Check for specific Airtable error types for better error messages
    if (error.statusCode === 422) {
      return res.status(422).json({ error: 'Invalid field data in application creation. Please check field names match the Airtable schema.' })
    } else if (error.statusCode === 404) {
      return res.status(404).json({ error: 'Applications table not found. Please check environment variables.' })
    } else if (error.statusCode === 403) {
      return res.status(403).json({ error: 'Permission denied to create application. Please check API key permissions.' })
    }
    
    return res.status(500).json({ error: 'Failed to create application: ' + error.message })
  }
}

export default async function handlerImpl(req, res) {
  try {
    // Check for valid Auth0 session
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Call the original handler with the authenticated session
    return createApplicationHandler(req, res);
  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}