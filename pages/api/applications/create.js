import { auth0 } from '@/lib/auth0';
import { createApplication } from '@/lib/airtable/entities/applications';
import { createParticipationRecord } from '@/lib/airtable/entities/participation';
import { updateTeam } from '@/lib/airtable/entities/teams';
import { getUserByAuth0Id } from '@/lib/airtable/entities/users';
import { getCohortById } from '@/lib/airtable/entities/cohorts';
import { getProgramById } from '@/lib/airtable/entities/programs';

/**
 * API handler to create a new application
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
async function createApplicationHandler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the user session
    const session = await auth0.getSession(req, res);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get the request body containing application data
    const { 
      cohortId, 
      teamId, 
      participationType = 'Individual',
      applicationType,
      // Additional fields for Xtrapreneurs applications
      reason,
      commitment,
      // Fields for team join requests
      teamToJoin,
      joinTeamMessage
    } = req.body;
    
    console.log("Application create request:", {
      cohortId,
      teamId,
      participationType,
      applicationType,
      teamToJoin,
      hasJoinMessage: !!joinTeamMessage
    });
    
    if (!cohortId) {
      return res.status(400).json({ error: 'Cohort ID is required' });
    }
    
    // Only require team ID for team applications
    if (participationType === 'Team' && !teamId) {
      return res.status(400).json({ error: 'Team ID is required for team applications' });
    }
    
    // Verify Xtrapreneurs application data if applicable
    if (applicationType === 'xtrapreneurs') {
      if (!reason) {
        return res.status(400).json({ error: 'Reason for joining Xtrapreneurs is required' });
      }
      if (!commitment) {
        return res.status(400).json({ error: 'Commitment level is required' });
      }
    }
    
    // Get user profile from Auth0 ID
    const userProfile = await getUserByAuth0Id(session.user.sub);
    
    if (!userProfile || !userProfile.contactId) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    
    // Determine if this is a direct join program or one that requires application
    let shouldCreateApplication = true;
    let applicationStatus = 'Submitted';
    let participationResult = null;
    
    try {
      // Get cohort and program details
      const cohort = await getCohortById(cohortId);
      
      if (cohort && cohort.programId) {
        const program = await getProgramById(cohort.programId);
        
        if (program) {
          const enrollmentType = program.enrollmentType || 'Review';
          const programParticipationType = program.participationType || 'Individual';
          
          // Check if this is a team-based participation
          const isTeamBasedProgram = 
            programParticipationType.toLowerCase().includes('team') ||
            programParticipationType.toLowerCase() === 'teams' ||
            programParticipationType.toLowerCase() === 'group' ||
            programParticipationType.toLowerCase().includes('collaborative');
            
          console.log(`Program ${program.name} has enrollment type: ${enrollmentType}, participation type: ${programParticipationType}`);
          
          // Determine if this is a special case where we need a formal application
          const isXperiment = program.name.toLowerCase().includes('xperiment');
          
          // Set application status to "Accepted" if enrollment type is "Immediate"
          if (enrollmentType === 'Immediate') {
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
          } else if (isTeamBasedProgram && enrollmentType === 'Review') {
            console.log("Creating application for team-based program with Review enrollment");
            shouldCreateApplication = true;
          } else {
            console.log("This is a direct join program");
            shouldCreateApplication = true; // We'll still create an application record
            
            // For direct join programs, also create a participation record immediately
            try {
              participationResult = await createParticipationRecord({
                contactId: userProfile.contactId,
                cohortId: cohortId
              });
              console.log("Direct join participation record creation result:", participationResult);
            } catch (participationError) {
              console.error("Error creating direct join participation record:", participationError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking program details:", error);
      // Default to creating application if we can't determine
      shouldCreateApplication = true;
    }
    
    // If this is a team application, update the team with the cohort
    if (teamId) {
      try {
        // Update the team with the cohort ID
        await updateTeam(teamId, {
          cohortIds: [cohortId] // This will be merged with existing cohorts in the entity function
        });
        console.log(`Successfully associated cohort ${cohortId} with team ${teamId}`);
      } catch (teamUpdateError) {
        // Log but don't fail if team update fails
        console.error('Error updating team with cohort ID:', teamUpdateError);
      }
    }
    
    // Create the application data
    const applicationData = {
      contactId: userProfile.contactId,
      cohortId,
      status: applicationStatus
    };
    
    // Add specific fields based on application type
    if (teamId) {
      applicationData.teamId = teamId;
    }
    
    if (applicationType === 'xtrapreneurs') {
      applicationData.reason = reason;
      applicationData.commitment = commitment;
      applicationData.applicationType = 'xtrapreneurs';
      applicationData.status = 'Accepted'; // Xtrapreneurs applications are auto-accepted
    } else if (applicationType === 'joinTeam') {
      const targetTeamId = teamId || teamToJoin;
      applicationData.teamToJoin = targetTeamId;
      applicationData.joinTeamMessage = joinTeamMessage;
      applicationData.applicationType = 'joinTeam';
      applicationData.status = 'Submitted'; // Always requires approval
    } else if (participationType === 'Team') {
      applicationData.applicationType = 'team';
    } else {
      applicationData.applicationType = 'individual';
    }
    
    // Create the application
    const application = await createApplication(applicationData);
    
    // Update user's onboarding status to "Applied" or "Joined"
    try {
      await updateOnboardingStatus(userProfile.contactId, participationResult ? 'Joined' : 'Applied');
      console.log(`Updated contact ${userProfile.contactId} onboarding status`);
    } catch (onboardingError) {
      console.error("Error updating onboarding status:", onboardingError);
    }
    
    // Process participation record creation if application is accepted and we haven't already created one
    if (!participationResult && application.status === 'Accepted') {
      try {
        participationResult = await createParticipationRecord({
          contactId: userProfile.contactId,
          cohortId: cohortId
        });
        console.log("Participation record creation result:", participationResult);
      } catch (participationError) {
        console.error("Error creating participation record:", participationError);
      }
    }
    
    // Return success response
    return res.status(201).json({
      id: application.id,
      status: application.status,
      contactId: userProfile.contactId,
      cohortId: cohortId,
      teamId: teamId,
      createdAt: application.createdAt,
      // Include participation information if available
      participation: participationResult || null
    });
  } catch (error) {
    console.error('Error creating application:', error);
    console.error('Error details:', error.message, error.stack);
    
    return res.status(500).json({ 
      error: 'Failed to create application',
      message: error.message
    });
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