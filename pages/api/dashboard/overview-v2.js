import { 
  users, 
  participation, 
  teams, 
  events, 
  points,
  submissions, 
  programs 
} from '@/lib/airtable/entities';
import { auth0 } from '@/lib/auth0';

/**
 * API endpoint to fetch user dashboard overview data
 * Demonstrates combining multiple entities from the new Airtable architecture
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

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get user profile
    const userProfile = await users.getUserByAuth0Id(user.sub);
    
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Get user's participation records
    const participationRecords = await participation.getParticipationRecords(user.sub);
    
    // Extract team IDs from participation records
    const teamIds = participationRecords
      .filter(record => record.teamId)
      .map(record => record.teamId);
    
    // Get teams the user is part of (with Promise.all for parallel execution)
    const userTeams = await Promise.all(
      teamIds.map(teamId => teams.getTeamById(teamId))
    );
    
    // Get program IDs from participation records
    const programIds = participationRecords
      .filter(record => record.programId)
      .map(record => record.programId);
    
    // Get programs the user is participating in
    const userPrograms = await Promise.all(
      programIds.map(programId => programs.getProgramById(programId))
    );
    
    // Get upcoming events for the user
    const upcomingEvents = await events.getEventsByUser(user.sub);
    
    // Get user's points summary
    const pointsSummary = await points.getUserPointsSummary(user.sub);
    
    // Get recent submissions for teams the user is in
    const recentSubmissions = [];
    
    if (teamIds.length > 0) {
      const submissionsPromises = teamIds.map(teamId => 
        submissions.getSubmissionsByTeam(teamId)
      );
      
      const teamSubmissions = await Promise.all(submissionsPromises);
      
      // Flatten and sort all submissions by date
      const allSubmissions = teamSubmissions.flat();
      
      // Sort submissions by created time (descending) and take the 5 most recent
      allSubmissions.sort((a, b) => {
        const dateA = a.createdTime ? new Date(a.createdTime) : new Date(0);
        const dateB = b.createdTime ? new Date(b.createdTime) : new Date(0);
        return dateB - dateA;
      });
      
      // Take only the 5 most recent submissions
      recentSubmissions.push(...allSubmissions.slice(0, 5));
    }

    // Compile dashboard data
    const dashboardData = {
      user: {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        institution: userProfile.institutionName,
        avatarUrl: userProfile.avatarUrl
      },
      participation: {
        count: participationRecords.length,
        active: participationRecords.filter(p => p.status === 'Active').length,
        records: participationRecords.map(p => ({
          id: p.id,
          programId: p.programId,
          programName: p.programName,
          cohortId: p.cohortId,
          cohortName: p.cohortName,
          teamId: p.teamId,
          teamName: p.teamName,
          status: p.status
        }))
      },
      teams: userTeams.map(team => ({
        id: team.id,
        name: team.name,
        description: team.description,
        programId: team.programId,
        programName: team.programName,
        memberCount: team.memberCount || 0
      })),
      programs: userPrograms.map(program => ({
        id: program.id,
        name: program.name,
        status: program.status,
        institutionId: program.institutionId,
        institutionName: program.institutionName
      })),
      events: upcomingEvents.slice(0, 5).map(event => ({
        id: event.id,
        name: event.name,
        startDateTime: event.startDateTime,
        endDateTime: event.endDateTime,
        location: event.location,
        type: event.type,
        programId: event.programId,
        programName: event.programName
      })),
      points: {
        available: pointsSummary?.available || 0,
        total: pointsSummary?.total || 0,
        spent: pointsSummary?.spent || 0,
        recentTransactions: (pointsSummary?.transactions || []).slice(0, 5).map(tx => ({
          id: tx.id,
          points: tx.points,
          description: tx.description,
          type: tx.type,
          createdTime: tx.createdTime
        }))
      },
      submissions: recentSubmissions.map(submission => ({
        id: submission.id,
        teamId: submission.teamId,
        teamName: submission.teamName,
        milestoneId: submission.milestoneId,
        milestoneName: submission.milestoneName,
        status: submission.status,
        createdTime: submission.createdTime
      }))
    };

    return res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    return res.status(500).json({
      error: 'An error occurred while fetching dashboard overview',
      message: error.message,
      details: error.details || {}
    });
  }
}