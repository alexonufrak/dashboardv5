/**
 * Server-side data fetching for Events
 * For use in Server Components with App Router
 */

import { cache } from 'react';
import { fetchEvents, fetchUpcomingEvents, fetchContactById } from '../airtable';

/**
 * Fetch upcoming events with details
 */
export const getUpcomingEvents = cache(async (limit = 5) => {
  try {
    const events = await fetchUpcomingEvents(limit);
    return events.map(formatEvent);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }
});

/**
 * Fetch all upcoming events
 */
export const getAllUpcomingEvents = cache(async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const formula = `AND({Start Date} >= '${today}', {Status} = 'Confirmed')`;
    
    const { records } = await fetchEvents({
      filterByFormula: formula,
      sort: [{ field: 'Start Date', direction: 'asc' }]
    });
    
    return (records || []).map(formatEvent);
  } catch (error) {
    console.error('Error fetching all upcoming events:', error);
    return [];
  }
});

/**
 * Fetch past events
 */
export const getPastEvents = cache(async (limit = 20) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const formula = `AND({Start Date} < '${today}', {Status} = 'Confirmed')`;
    
    const { records } = await fetchEvents({
      filterByFormula: formula,
      sort: [{ field: 'Start Date', direction: 'desc' }],
      maxRecords: limit
    });
    
    return (records || []).map(formatEvent);
  } catch (error) {
    console.error('Error fetching past events:', error);
    return [];
  }
});

/**
 * Fetch events for a specific contact (registered events)
 */
export const getContactEvents = cache(async (contactId) => {
  if (!contactId) return [];
  
  try {
    const formula = `AND(FIND("${contactId.replace(/"/g, '\\"')}", ARRAYJOIN({Registered Contacts})), {Status} = 'Confirmed')`;
    
    const { records } = await fetchEvents({
      filterByFormula: formula,
      sort: [{ field: 'Start Date', direction: 'asc' }]
    });
    
    return (records || []).map(formatEvent);
  } catch (error) {
    console.error(`Error fetching events for contact ${contactId}:`, error);
    return [];
  }
});

/**
 * Fetch events for a specific program
 */
export const getProgramEvents = cache(async (programId) => {
  if (!programId) return [];
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const formula = `AND({Program} = "${programId}", {Start Date} >= '${today}')`;
    
    const { records } = await fetchEvents({
      filterByFormula: formula,
      sort: [{ field: 'Start Date', direction: 'asc' }]
    });
    
    return (records || []).map(formatEvent);
  } catch (error) {
    console.error(`Error fetching events for program ${programId}:`, error);
    return [];
  }
});

/**
 * Fetch a single event by ID
 */
export const getEventById = cache(async (eventId) => {
  if (!eventId) return null;
  
  try {
    const { records } = await fetchEvents({
      filterByFormula: `RECORD_ID() = '${eventId}'`
    });
    
    if (!records || records.length === 0) {
      return null;
    }
    
    return formatEvent(records[0]);
  } catch (error) {
    console.error(`Error fetching event with ID ${eventId}:`, error);
    return null;
  }
});

/**
 * Get event attendees with details
 */
export const getEventAttendees = cache(async (eventId) => {
  if (!eventId) return [];
  
  try {
    // First get the event to get the registered contacts
    const event = await getEventById(eventId);
    if (!event || !event.registeredContacts || event.registeredContacts.length === 0) {
      return [];
    }
    
    // Fetch each contact's details
    const attendeesPromises = event.registeredContacts.map(async (contactId) => {
      const contact = await fetchContactById(contactId);
      return contact ? formatAttendee(contact, event.id) : null;
    });
    
    const attendees = await Promise.all(attendeesPromises);
    return attendees.filter(Boolean);
  } catch (error) {
    console.error(`Error fetching attendees for event ${eventId}:`, error);
    return [];
  }
});

/**
 * Format attendee record for client consumption
 */
export function formatAttendee(contact, eventId) {
  if (!contact) return null;
  
  const { id, fields } = contact;
  
  return {
    id,
    contactId: id,
    eventId,
    firstName: fields['First Name'] || '',
    lastName: fields['Last Name'] || '',
    fullName: `${fields['First Name'] || ''} ${fields['Last Name'] || ''}`.trim(),
    email: fields['Email'] || '',
    institution: fields['Institution']?.[0] || null,
    institutionName: fields['Institution Name'] || '',
    role: fields['Role/Title'] || '',
    phone: fields['Phone'] || '',
    checkedIn: fields['Checked In Events']?.includes(eventId) || false,
    checkInTime: fields['Check In Time']?.find(t => t.startsWith(`${eventId}::`))?.split('::')[1] || null
  };
}

/**
 * Format event record for client consumption
 */
export function formatEvent(event) {
  if (!event) return null;
  
  const { id, fields } = event;
  
  // Parse dates properly
  const startDate = fields['Start Date'] ? new Date(fields['Start Date']) : null;
  const endDate = fields['End Date'] ? new Date(fields['End Date']) : null;
  
  // Format time for display
  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Calculate if the event is in the past
  const isPast = startDate ? startDate < new Date() : false;
  
  // Calculate if registration is open
  const isRegistrationOpen = fields['Registration Status'] === 'Open';
  
  return {
    id,
    recordId: id,
    name: fields['Name'] || '',
    description: fields['Description'] || '',
    location: fields['Location'] || '',
    startDate,
    endDate,
    startDateFormatted: startDate ? formatDate(startDate) : '',
    endDateFormatted: endDate ? formatDate(endDate) : '',
    startTimeFormatted: startDate ? formatTime(startDate) : '',
    endTimeFormatted: endDate ? formatTime(endDate) : '',
    type: fields['Type'] || '',
    status: fields['Status'] || '',
    program: fields['Program']?.[0] || null,
    programName: fields['Program Name'] || '',
    cohort: fields['Cohort']?.[0] || null,
    cohortName: fields['Cohort Name'] || '',
    registrationUrl: fields['Registration URL'] || '',
    imageUrl: fields['Image']?.[0]?.url || null,
    registrationStatus: fields['Registration Status'] || 'Closed',
    isRegistrationOpen,
    isPast,
    registeredContacts: fields['Registered Contacts'] || [],
    capacity: fields['Capacity'] || null,
    registrationCount: fields['Registration Count'] || 0,
    checkedInCount: fields['Checked In Count'] || 0,
    attendanceOpen: fields['Attendance Open'] || false
  };
}