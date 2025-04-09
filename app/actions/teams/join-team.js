'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/app-router-auth';
import { getCurrentUserContact } from '@/lib/app-router';
import { getMembersTable, getTeamsTable } from '@/lib/airtable/tables/definitions';

/**
 * Join a team or request to join a team
 * 
 * This server action creates a new team member record in Airtable
 * and invalidates the relevant cache paths.
 */
export async function joinTeam(formData) {
  // Validate user is authenticated
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  
  try {
    // Get the contact record
    const contact = await getCurrentUserContact(user);
    if (!contact) {
      throw new Error('Contact record not found');
    }
    
    const contactId = contact.id;
    
    // Extract form data
    const teamId = formData.get('teamId') || '';
    const message = formData.get('message') || '';
    
    // Validate form data
    if (!teamId.trim()) {
      throw new Error('Team ID is required');
    }
    
    // Get the team record to check its recruitment status
    const teamsTable = getTeamsTable();
    const team = await teamsTable.find(teamId);
    
    if (!team) {
      throw new Error('Team not found');
    }
    
    // Check if user is already a member
    const membersTable = getMembersTable();
    const existingMembers = await membersTable.select({
      filterByFormula: `AND({Contact} = "${contactId}", {Team} = "${teamId}")`,
      maxRecords: 1
    }).firstPage();
    
    if (existingMembers && existingMembers.length > 0) {
      throw new Error('You are already a member of this team');
    }
    
    // Determine initial status based on team's recruitment status
    // If open, directly add as member; if approval required, set as pending
    const initialStatus = team.fields['Recruitment Status'] === 'Open' ? 'Active' : 'Pending';
    
    // Create the member record
    const newMember = await membersTable.create({
      'Contact': [contactId],
      'Team': [teamId],
      'Status': initialStatus,
      'Role': 'Member',
      'Joined Date': new Date().toISOString(),
      'Application Message': message
    });
    
    // If direct join, update team's member count
    if (initialStatus === 'Active') {
      const currentMemberCount = team.fields['Member Count'] || 0;
      await teamsTable.update(teamId, {
        'Member Count': currentMemberCount + 1
      });
    }
    
    // Revalidate relevant paths
    revalidatePath('/dashboard/teams');
    revalidatePath(`/dashboard/teams/${teamId}`);
    
    return { 
      success: true,
      memberId: newMember.id,
      status: initialStatus,
      requiresApproval: initialStatus === 'Pending'
    };
  } catch (error) {
    console.error('Error joining team:', error);
    return { 
      success: false, 
      error: error.message || 'An error occurred while attempting to join the team'
    };
  }
}