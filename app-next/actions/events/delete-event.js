'use server'

import { events } from '@/lib/airtable/entities';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/lib/app-router-auth';

export async function deleteEvent(eventId) {
  try {
    // Get auth session
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    // Validate event ID
    if (!eventId) {
      return { success: false, error: 'Event ID is required' };
    }
    
    // Check if event exists before deletion
    const existingEvent = await events.getEventById(eventId);
    if (!existingEvent) {
      return { success: false, error: 'Event not found' };
    }
    
    // Delete the event
    const result = await events.deleteEvent(eventId);
    
    if (!result) {
      return { success: false, error: 'Failed to delete event' };
    }
    
    // Revalidate caches
    revalidateTag('events');
    revalidateTag('upcoming-events');
    
    // Revalidate paths
    revalidatePath('/dashboard/events');
    
    return { 
      success: true, 
      message: 'Event deleted successfully',
      data: { id: eventId }
    };
  } catch (error) {
    console.error('Error deleting event:', error);
    return { success: false, error: error.message || 'Failed to delete event' };
  }
}