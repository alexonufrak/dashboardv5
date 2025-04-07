'use server'

import { events } from '@/lib/airtable/entities';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/lib/app-router-auth';

export async function updateEvent(eventId, formData) {
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
    
    // Extract data from formData
    const eventData = {
      name: formData.get('name'),
      description: formData.get('description'),
      date: formData.get('date'),
      location: formData.get('location'),
      programId: formData.get('programId'),
      updatedBy: session.user.email,
      updatedAt: new Date().toISOString()
    };
    
    // Filter out undefined or null values
    const filteredData = Object.entries(eventData)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    // Update the event
    const result = await events.updateEvent(eventId, filteredData);
    
    if (!result) {
      return { success: false, error: 'Failed to update event' };
    }
    
    // Revalidate caches
    revalidateTag('events');
    revalidateTag('upcoming-events');
    revalidateTag(`event-${eventId}`);
    
    // Revalidate paths
    revalidatePath('/dashboard/events');
    revalidatePath(`/dashboard/events/${eventId}`);
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating event:', error);
    return { success: false, error: error.message || 'Failed to update event' };
  }
}