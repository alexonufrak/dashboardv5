import { teams, participation, users } from '@/lib/airtable/entities';
import { auth0 } from '@/lib/auth0';

/**
 * API endpoint to create a new team and join it
 * Uses the new domain-driven Airtable architecture
 * 
 * @param {object} req - Next.js request object
 * @param {object} res - Next.js response object
 */
export default async function handler(req, res) {
  try {
    // Get Auth0 session and validate user is authenticated
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({
        error: 'Not authenticated'
      });
    }
    const { user } = session;

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { 
      name, 
      description, 
      programId, 
      cohortId
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Team name is required' });
    }

    if (!programId && !cohortId) {
      return res.status(400).json({ error: 'Either programId or cohortId is required' });
    }

    // Get the user's profile to add as team creator
    const userProfile = await users.getUserByAuth0Id(user.sub);
    
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Create the team
    const teamData = {
      name,
      description: description || '',
      programId,
      cohortId,
      createdBy: user.sub,
      members: [userProfile.id]
    };

    const newTeam = await teams.createTeam(teamData);
    
    if (!newTeam) {
      return res.status(500).json({ error: 'Failed to create team' });
    }

    // Create or update participation record for the user
    let participationRecord;
    
    try {
      // Get all user participations and filter for this program/cohort
      const allParticipations = await participation.getParticipationRecords(user.sub);
      const existingParticipation = allParticipations.find(p => 
        (programId && p.programId === programId) || 
        (cohortId && p.cohortId === cohortId)
      );
      
      if (existingParticipation) {
        // Update existing participation to include the new team
        // Direct table operation since updateParticipationRecord isn't available
        const updatedData = {
          teamId: newTeam.id,
          status: 'Active'
        };
        
        // Get table directly
        const participationTable = await import('@/lib/airtable/tables');
        const table = participationTable.getParticipationTable();
        await table.update(existingParticipation.id, updatedData);
        
        // Return updated record
        participationRecord = {
          ...existingParticipation,
          ...updatedData
        };
      } else {
        // Create new participation record
        participationRecord = await participation.createParticipationRecord({
          userId: user.sub,
          programId: programId || null,
          cohortId: cohortId || null,
          teamId: newTeam.id,
          status: 'Active'
        });
      }
    } catch (error) {
      console.error('Error creating/updating participation record:', error);
      
      // If team was created but participation failed, we should still return success
      // but include a warning. The user is in the team but might not show up in participation.
      return res.status(200).json({
        success: true,
        team: newTeam,
        participation: null,
        warning: 'Team created but there was an issue updating participation records'
      });
    }

    return res.status(200).json({
      success: true,
      team: newTeam,
      participation: participationRecord
    });
  } catch (error) {
    console.error('Error creating team:', error);
    return res.status(500).json({
      error: 'An error occurred while creating the team',
      message: error.message,
      details: error.details || {}
    });
  }
}