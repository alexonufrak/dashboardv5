/**
 * Server-side data fetching for Contacts
 * For use in Server Components with App Router
 */

import { cache } from 'react';
import { 
  fetchContactByAuth0Id, 
  fetchContactByEmail, 
  fetchContactById,
  fetchAirtableData
} from '../airtable';
import { getParticipationTable } from '@/lib/airtable/tables/definitions';

/**
 * Get current user's contact record from Airtable
 * To be used in server components with getCurrentUser from app-router-auth
 */
export const getCurrentUserContact = cache(async (user) => {
  if (!user) return null;
  
  try {
    // Try to find by Auth0 ID first
    let contact = await fetchContactByAuth0Id(user.sub);
    
    // If not found by Auth0 ID, try by email
    if (!contact && user.email) {
      contact = await fetchContactByEmail(user.email);
      
      // If found by email but Auth0 ID is missing, we'll need to update it
      // (This would be done using a server action, but we return the contact here anyway)
      if (contact && !contact.fields['Auth0 ID']) {
        console.log(`Contact found by email ${user.email} but Auth0 ID is missing. Should update.`);
      }
    }
    
    return contact;
  } catch (error) {
    console.error('Error getting current user contact:', error);
    return null;
  }
});

/**
 * Fetch participation records for a specific contact
 */
export const fetchParticipationByContactId = cache(async (contactId) => {
  if (!contactId) return [];
  
  try {
    const formula = `FIND("${contactId.replace(/"/g, '\\"')}", ARRAYJOIN({Contact}))`;
    const { records } = await fetchAirtableData(getParticipationTable, { 
      filterByFormula: formula 
    });
    
    if (!records || records.length === 0) {
      return [];
    }
    
    return records;
  } catch (error) {
    console.error(`Error fetching participation for contact ${contactId}:`, error);
    return [];
  }
});

/**
 * Format contact record for client consumption
 * This maps Airtable fields to a standardized format for the UI
 */
export function formatContact(contact) {
  if (!contact) return null;
  
  const { id, fields } = contact;
  
  return {
    id,
    recordId: id,
    email: fields['Email'] || '',
    firstName: fields['First Name'] || '',
    lastName: fields['Last Name'] || '',
    fullName: fields['Full Name'] || `${fields['First Name'] || ''} ${fields['Last Name'] || ''}`.trim(),
    type: fields['Type'] || '',
    phone: fields['Phone'] || '',
    headshot: fields['Headshot']?.[0]?.url || null,
    bio: fields['Bio'] || '',
    linkedin: fields['LinkedIn'] || '',
    website: fields['Website URL'] || '',
    onboarding: fields['Onboarding'] || '',
    referralSource: fields['Referral Source'] || '',
    expertise: fields['Expertise'] || [],
    authId: fields['Auth0 ID'] || ''
  };
}

/**
 * Format participation record for client consumption
 */
export function formatParticipation(participation) {
  if (!participation) return null;
  
  const { id, fields } = participation;
  
  return {
    id,
    recordId: id,
    contactId: fields['Contact']?.[0] || null,
    cohortId: fields['Cohort']?.[0] || null,
    programId: fields['Program (from Cohort)']?.[0] || null,
    status: fields['Status'] || '',
    joinedDate: fields['Joined Date'] || '',
    capacity: fields['Capacity'] || '',
    isActive: fields['Status'] === 'Active'
  };
}