'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/app-router-auth';
import { 
  getCurrentUserContact,
  getEventById
} from '@/lib/app-router';
import { getEventsTable } from '@/lib/airtable/tables/definitions';

/**
 * Register a user for an event
 * Server action that registers a contact for an event
 */
export async function registerForEvent(eventId) {
  if (!eventId) {
    return { success: false, error: 'Event ID is required' };
  }
  
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      redirect('/auth/login');
    }
    
    // Get user's contact record
    const contact = await getCurrentUserContact(user);
    if (!contact) {
      return { 
        success: false, 
        error: 'User profile not found. Please complete your profile first.' 
      };
    }
    
    const contactId = contact.id;
    
    // Get event details
    const event = await getEventById(eventId);
    if (!event) {
      return { success: false, error: 'Event not found' };
    }
    
    // Check if registration is open
    if (!event.isRegistrationOpen) {
      return { success: false, error: 'Registration is not open for this event' };
    }
    
    // Check if event is in the past
    if (event.isPast) {
      return { success: false, error: 'This event has already taken place' };
    }
    
    // Check if user is already registered
    if (event.registeredContacts?.includes(contactId)) {
      return { success: false, error: 'You are already registered for this event' };
    }
    
    // Check capacity limit
    if (event.capacity && event.registrationCount >= event.capacity) {
      return { success: false, error: 'This event has reached capacity' };
    }
    
    // Register the user for the event
    const eventsTable = getEventsTable();
    await eventsTable.update(eventId, {
      'Registered Contacts': [...(event.registeredContacts || []), contactId],
      'Registration Count': (event.registrationCount || 0) + 1
    });
    
    // Revalidate the events pages to show updated registration
    revalidatePath('/dashboard/events');
    revalidatePath(`/dashboard/events/${eventId}`);
    
    return { 
      success: true, 
      message: 'Successfully registered for event' 
    };
  } catch (error) {
    console.error('Error registering for event:', error);
    return { 
      success: false, 
      error: 'An error occurred while registering for the event' 
    };
  }
}