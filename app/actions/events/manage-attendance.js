'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/app-router-auth';
import { getEventsTable, getContactsTable } from '@/lib/airtable/tables/definitions';
import { redirect } from 'next/navigation';
import { getEventById, getEventAttendees } from '@/lib/app-router';

/**
 * Toggle attendance tracking for an event
 */
export async function toggleAttendanceTracking(formData) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      redirect('/auth/login');
    }
    
    // Check if user is an admin (in a real app, use proper role checks)
    const isAdmin = user.email?.endsWith('@xfoundry.org') || false;
    if (!isAdmin) {
      return { success: false, error: 'You do not have permission to manage event attendance' };
    }
    
    // Get event ID from form data
    const eventId = formData.get('eventId');
    if (!eventId) {
      return { success: false, error: 'Event ID is required' };
    }
    
    // Get the current event
    const event = await getEventById(eventId);
    if (!event) {
      return { success: false, error: 'Event not found' };
    }
    
    // Toggle the attendance status
    const newStatus = !event.attendanceOpen;
    
    // Update the event
    const eventsTable = getEventsTable();
    await eventsTable.update(eventId, {
      'Attendance Open': newStatus
    });
    
    // Revalidate paths
    revalidatePath(`/dashboard/events/${eventId}`);
    revalidatePath(`/dashboard/events/${eventId}/attendance`);
    
    return {
      success: true,
      data: { attendanceOpen: newStatus }
    };
  } catch (error) {
    console.error('Error toggling attendance tracking:', error);
    return {
      success: false,
      error: error.message || 'Failed to toggle attendance tracking'
    };
  }
}

/**
 * Check in an attendee
 */
export async function checkInAttendee(formData) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      redirect('/auth/login');
    }
    
    // Check if user is an admin or event staff
    const isStaff = user.email?.endsWith('@xfoundry.org') || false;
    if (!isStaff) {
      return { success: false, error: 'You do not have permission to check in attendees' };
    }
    
    // Get event ID and contact ID from form data
    const eventId = formData.get('eventId');
    const contactId = formData.get('contactId');
    
    if (!eventId || !contactId) {
      return { success: false, error: 'Event ID and Contact ID are required' };
    }
    
    // Get the event to make sure attendance is open
    const event = await getEventById(eventId);
    if (!event) {
      return { success: false, error: 'Event not found' };
    }
    
    if (!event.attendanceOpen) {
      return { success: false, error: 'Attendance tracking is not open for this event' };
    }
    
    // Get the attendees to check if the contact is registered
    const attendees = await getEventAttendees(eventId);
    const attendee = attendees.find(a => a.contactId === contactId);
    
    if (!attendee) {
      return { success: false, error: 'Attendee is not registered for this event' };
    }
    
    // Check if already checked in
    if (attendee.checkedIn) {
      return { success: false, error: 'Attendee is already checked in' };
    }
    
    // Get the contact
    const contactsTable = getContactsTable();
    const contact = await contactsTable.find(contactId);
    
    // Get existing checked in events
    const checkedInEvents = contact.fields['Checked In Events'] || [];
    const checkInTimes = contact.fields['Check In Time'] || [];
    
    // Generate timestamp for check-in
    const timestamp = new Date().toISOString();
    
    // Update the contact
    await contactsTable.update(contactId, {
      'Checked In Events': [...checkedInEvents, eventId],
      'Check In Time': [...checkInTimes, `${eventId}::${timestamp}`]
    });
    
    // Update the event check-in count
    const eventsTable = getEventsTable();
    await eventsTable.update(eventId, {
      'Checked In Count': (event.checkedInCount || 0) + 1
    });
    
    // Revalidate paths
    revalidatePath(`/dashboard/events/${eventId}/attendance`);
    
    return {
      success: true,
      data: {
        contactId,
        eventId,
        checkInTime: timestamp
      }
    };
  } catch (error) {
    console.error('Error checking in attendee:', error);
    return {
      success: false,
      error: error.message || 'Failed to check in attendee'
    };
  }
}

/**
 * Manual registration for an attendee
 */
export async function registerAttendeeManually(formData) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      redirect('/auth/login');
    }
    
    // Check if user is an admin or event staff
    const isStaff = user.email?.endsWith('@xfoundry.org') || false;
    if (!isStaff) {
      return { success: false, error: 'You do not have permission to register attendees' };
    }
    
    // Get event ID and contact info from form data
    const eventId = formData.get('eventId');
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const email = formData.get('email');
    
    if (!eventId || !firstName || !lastName || !email) {
      return { success: false, error: 'Event ID, first name, last name, and email are required' };
    }
    
    // Get the event
    const event = await getEventById(eventId);
    if (!event) {
      return { success: false, error: 'Event not found' };
    }
    
    // Check if event has reached capacity
    if (event.capacity && event.registrationCount >= event.capacity) {
      return { success: false, error: 'Event has reached capacity' };
    }
    
    // Check if a contact with this email already exists
    const contactsTable = getContactsTable();
    const contacts = await contactsTable.select({
      filterByFormula: `{Email} = "${email.replace(/"/g, '\\"')}"`
    }).firstPage();
    
    let contactId;
    
    if (contacts.length > 0) {
      // Use existing contact
      contactId = contacts[0].id;
      
      // Check if already registered
      if (contacts[0].fields['Registered Events']?.includes(eventId)) {
        return { success: false, error: 'Contact is already registered for this event' };
      }
      
      // Update with registration
      await contactsTable.update(contactId, {
        'Registered Events': [...(contacts[0].fields['Registered Events'] || []), eventId]
      });
    } else {
      // Create new contact
      const newContact = await contactsTable.create({
        'First Name': firstName,
        'Last Name': lastName,
        'Email': email,
        'Registered Events': [eventId]
      });
      contactId = newContact.id;
    }
    
    // Add contact to event's registered contacts
    const eventsTable = getEventsTable();
    await eventsTable.update(eventId, {
      'Registered Contacts': [...(event.registeredContacts || []), contactId],
      'Registration Count': (event.registrationCount || 0) + 1
    });
    
    // Revalidate paths
    revalidatePath(`/dashboard/events/${eventId}`);
    revalidatePath(`/dashboard/events/${eventId}/attendance`);
    
    return {
      success: true,
      data: {
        contactId,
        eventId,
        firstName,
        lastName,
        email
      }
    };
  } catch (error) {
    console.error('Error registering attendee manually:', error);
    return {
      success: false,
      error: error.message || 'Failed to register attendee'
    };
  }
}