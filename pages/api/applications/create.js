import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0'
import { getUserProfile, base, createParticipationRecord } from '@/lib/airtable'

/**
 * API handler to create a new application
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
export default withApiAuthRequired(async function createApplicationHandler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the user session
    const session = await getSession(req, res)
    
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
    
    // Create the application record
    console.log(`Creating application for contact ${userProfile.contactId}, cohort ${cohortId}, team ${teamId}`)
    
    // First, check if the cohort's initiative has "Immediate" enrollment
    let applicationStatus = 'Submitted';
    try {
      // Get the cohort record
      const cohortsTable = base(process.env.AIRTABLE_COHORTS_TABLE_ID);
      const initiativesTable = base(process.env.AIRTABLE_INITIATIVES_TABLE_ID);
      
      const cohort = await cohortsTable.find(cohortId);
      
      if (cohort && cohort.fields.Initiative && cohort.fields.Initiative.length > 0) {
        const initiativeId = cohort.fields.Initiative[0];
        const initiative = await initiativesTable.find(initiativeId);
        
        if (initiative) {
          const enrollmentType = initiative.fields["Enrollment Type"] || "Review";
          console.log(`Initiative ${initiative.fields.Name} has enrollment type: ${enrollmentType}`);
          
          // Set application status to "Accepted" if enrollment type is "Immediate"
          if (enrollmentType === "Immediate") {
            applicationStatus = 'Accepted';
            console.log(`Setting application status to "Accepted" for immediate enrollment`);
          }
        }
      }
    } catch (error) {
      console.error("Error checking enrollment type:", error);
      // Continue with default 'Submitted' status if there's an error
    }
    
    // Prepare application data - using only the current field names
    const applicationData = {
      'Contact': [userProfile.contactId],
      'Cohort': [cohortId],
      'Status': applicationStatus
      // Removed 'Submission Date' as it doesn't exist in the Airtable schema
      // The 'Created' field is automatically handled by Airtable
    }
    
    // If team ID is provided, add it to the application
    if (teamId) {
      applicationData['Team'] = [teamId]
      
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
      
      // Log team join request details for debugging
      console.log("Processing team join request with:", {
        targetTeamId,
        joinTeamMessage,
        fields: Object.keys(applicationData)
      });
      
      // Add join team message - just use the standard field name
      // We're removing 'Xperience/Team to Join' and 'Xperience/Join Team Message' which may no longer exist in schema
      applicationData['Join Team Message'] = joinTeamMessage;
      
      // Also add the proper Team field for consistent behavior
      applicationData['Team'] = [targetTeamId];
      
      console.log('Creating team join request with data:', {
        teamId: targetTeamId,
        joinTeamMessage,
        status: applicationStatus,
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
      // Update the contact record with the new onboarding status
      await contactsTable.update(userProfile.contactId, {
        "Onboarding": "Applied"
      });
      console.log(`Updated contact ${userProfile.contactId} Onboarding status to "Applied"`);
    } catch (onboardingError) {
      // Log but don't fail if onboarding update fails
      console.error("Error updating onboarding status:", onboardingError);
    }
    
    // Step 4: After application is created, try to create a participation record
    // This is based on the initiative's enrollment type (Immediate vs. Review)
    let participationResult = null;
    try {
      participationResult = await createParticipationRecord(userProfile.contactId, cohortId);
      console.log("Participation record creation result:", participationResult);
    } catch (participationError) {
      // Log but don't fail if participation creation fails
      console.error("Error creating participation record:", participationError);
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
})