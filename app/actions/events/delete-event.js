'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/app-router-auth';
import { getEventsTable } from '@/lib/airtable/tables/definitions';
import { redirect } from 'next/navigation';
import { getEventById } from '@/lib/app-router';

/**
 * Server Action to delete an event
 */
export async function deleteEvent(formData) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      redirect('/auth/login');
    }
    
    // Check if user is an admin (in a real app, use proper role checks)
    const isAdmin = user.email?.endsWith('@xfoundry.org') || false;
    if (!isAdmin) {
      return { success: false, error: 'You do not have permission to delete events' };
    }
    
    // Get event ID from the form data
    const eventId = formData.get('eventId');
    if (!eventId) {
      return { success: false, error: 'Event ID is required' };
    }
    
    // Get the event details for revalidation purposes
    const event = await getEventById(eventId);
    if (!event) {
      return { success: false, error: 'Event not found' };
    }
    
    // Delete the event
    const eventsTable = getEventsTable();
    await eventsTable.destroy(eventId);
    
    // Revalidate related paths
    revalidatePath('/dashboard/events');
    revalidatePath('/dashboard');
    
    if (event.program) {
      revalidatePath(`/dashboard/programs/${event.program}`);
    }
    
    return { 
      success: true,
      message: 'Event deleted successfully'
    };
  } catch (error) {
    console.error('Failed to delete event:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to delete event'
    };
  }
}