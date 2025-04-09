/**
 * Server-side data fetching for Teams
 * For use in Server Components with App Router
 */

import { cache } from 'react';
import { 
  fetchTeams, 
  fetchTeamById, 
  fetchTeamsByContactId,
  fetchAirtableData
} from '../airtable';
import { getMembersTable, getTeamsTable } from '../../airtable/tables/definitions';

/**
 * Fetch teams for a specific user with member details
 */
export const getUserTeams = cache(async (contactId) => {
  if (!contactId) return [];
  
  try {
    // Get team records for this user
    const teams = await fetchTeamsByContactId(contactId);
    
    if (!teams || teams.length === 0) {
      return [];
    }
    
    // For each team, also fetch members
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const members = await getTeamMembers(team.id);
        return {
          ...formatTeam(team),
          members: members.map(formatMember)
        };
      })
    );
    
    return teamsWithMembers;
  } catch (error) {
    console.error(`Error fetching teams for contact ${contactId}:`, error);
    return [];
  }
});

/**
 * Fetch a single team with all member details
 */
export const getTeamWithMembers = cache(async (teamId) => {
  try {
    // Fetch team
    const team = await fetchTeamById(teamId);
    
    // Fetch members for this team
    const members = await getTeamMembers(teamId);
    
    return {
      ...formatTeam(team),
      members: members.map(formatMember)
    };
  } catch (error) {
    console.error(`Error fetching team ${teamId} with members:`, error);
    return null;
  }
});

/**
 * Fetch teams that are open for joining
 * These are teams with open recruitment and capacity for more members
 */
export const getJoinableTeams = cache(async () => {
  try {
    // Filter for teams that are active and have open recruitment
    const formula = `AND({Status} = 'Active', {Recruitment Status} = 'Open')`;
    
    const { records } = await fetchAirtableData(getTeamsTable, {
      filterByFormula: formula,
      sort: [{ field: 'Created', direction: 'desc' }]
    });
    
    if (!records || records.length === 0) {
      return [];
    }
    
    // Format and enhance team data
    const enhancedTeams = await Promise.all(
      records.map(async (team) => {
        const formattedTeam = formatTeam(team);
        
        // Get program and cohort names
        let cohortName = 'Unknown Cohort';
        let programName = 'Unknown Program';
        
        if (team.fields['Cohort Name']) {
          cohortName = team.fields['Cohort Name'];
        }
        
        if (team.fields['Program Name (from Cohort)']) {
          programName = team.fields['Program Name (from Cohort)'];
        }
        
        // Get member count
        const members = await getTeamMembers(team.id);
        
        return {
          ...formattedTeam,
          cohortName,
          programName,
          memberCount: members.length,
          members: members.map(formatMember)
        };
      })
    );
    
    return enhancedTeams;
  } catch (error) {
    console.error('Error fetching joinable teams:', error);
    return [];
  }
});

/**
 * Fetch team submissions
 * Gets all submissions associated with a team
 */
export const getTeamSubmissions = cache(async (teamId) => {
  if (!teamId) return [];
  
  try {
    // Import the submissions table function - can't import at the top due to circular dependencies
    const { getSubmissionsTable } = require('../../airtable/tables/definitions');
    
    // Filter for submissions by this team
    const formula = `{Team} = "${teamId}"`;
    
    const { records } = await fetchAirtableData(getSubmissionsTable, {
      filterByFormula: formula,
      sort: [{ field: 'Submission Date', direction: 'desc' }]
    });
    
    if (!records || records.length === 0) {
      return [];
    }
    
    // Format the submissions for UI consumption
    return records.map(formatSubmission);
  } catch (error) {
    console.error(`Error fetching submissions for team ${teamId}:`, error);
    return [];
  }
});

/**
 * Fetch team members
 */
export const getTeamMembers = cache(async (teamId) => {
  if (!teamId) return [];
  
  try {
    const formula = `FIND("${teamId.replace(/"/g, '\\"')}", ARRAYJOIN({Team}))`;
    const { records } = await fetchAirtableData(getMembersTable, { 
      filterByFormula: formula 
    });
    
    return records || [];
  } catch (error) {
    console.error(`Error fetching members for team ${teamId}:`, error);
    return [];
  }
});

/**
 * Format team record for client consumption
 */
export function formatTeam(team) {
  if (!team) return null;
  
  const { id, fields } = team;
  
  return {
    id,
    recordId: id,
    name: fields['Name'] || '',
    description: fields['Description'] || '',
    status: fields['Status'] || '',
    cohort: fields['Cohort']?.[0] || null,
    cohortName: fields['Cohort Name'] || '',
    programName: fields['Program Name (from Cohort)'] || '',
    logo: fields['Logo']?.[0]?.url || null,
    createdTime: fields['Created'] || '',
    isActive: fields['Status'] === 'Active',
    memberCount: fields['Member Count'] || 0,
    recruitmentStatus: fields['Recruitment Status'] || 'Closed'
  };
}

/**
 * Format member record for client consumption
 */
export function formatMember(member) {
  if (!member) return null;
  
  const { id, fields } = member;
  
  return {
    id,
    recordId: id,
    contact: fields['Contact']?.[0] || null,
    contactName: fields['Contact Name'] || '',
    team: fields['Team']?.[0] || null,
    teamName: fields['Team Name'] || '',
    role: fields['Role'] || 'Member',
    isActive: fields['Status'] === 'Active',
    joinedDate: fields['Joined Date'] || '',
  };
}

/**
 * Format submission record for client consumption
 */
export function formatSubmission(submission) {
  if (!submission) return null;
  
  const { id, fields } = submission;
  
  // Extract file attachments
  const files = fields['Files'] ? fields['Files'].map(file => ({
    id: file.id,
    url: file.url,
    filename: file.filename,
    size: file.size,
    type: file.type
  })) : [];
  
  return {
    id,
    recordId: id,
    title: fields['Title'] || '',
    description: fields['Description'] || '',
    status: fields['Status'] || 'Pending',
    submittedDate: fields['Submission Date'] || '',
    team: fields['Team']?.[0] || null,
    teamName: fields['Team Name'] || '',
    milestone: fields['Milestone']?.[0] || null,
    milestoneName: fields['Milestone Name'] || '',
    files,
    submittedBy: fields['Submitted By']?.[0] || null,
    submittedByName: fields['Submitted By Name'] || '',
    feedback: fields['Feedback'] || '',
    reviewedDate: fields['Reviewed Date'] || '',
    reviewedBy: fields['Reviewed By']?.[0] || null
  };
}