'use server'

import { events } from '@/lib/airtable/entities';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/lib/app-router-auth';

/**
 * Server Action to create a new event
 * Can be used directly with forms via action attribute
 */
export async function createEvent(formData) {
  try {
    // Get auth session
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // Extract data from formData
    const eventData = {
      name: formData.get('name'),
      description: formData.get('description') || '',
      startDateTime: formData.get('startDateTime'),
      endDateTime: formData.get('endDateTime') || formData.get('startDateTime'),
      location: formData.get('location') || '',
      url: formData.get('url') || '',
      type: formData.get('type') || 'General',
      programId: formData.get('programId') || null,
      cohortId: formData.get('cohortId') || null,
      status: formData.get('status') || 'Scheduled',
      
      // Add creator information
      createdBy: session.user.sub,
      createdByName: `${session.user.given_name || ''} ${session.user.family_name || ''}`.trim()
    };
    
    // Validate required fields
    if (!eventData.name) {
      return { success: false, error: 'Event name is required' };
    }
    
    if (!eventData.startDateTime) {
      return { success: false, error: 'Start date/time is required' };
    }
    
    // Create the event
    const result = await events.createEvent(eventData);
    
    // Revalidate caches
    revalidateTag('events');
    revalidateTag('upcoming-events');
    
    if (eventData.programId) {
      revalidateTag(`program:${eventData.programId}:events`);
    }
    
    if (eventData.cohortId) {
      revalidateTag(`cohort:${eventData.cohortId}:events`);
    }
    
    // Revalidate related paths
    revalidatePath('/dashboard/events');
    
    if (eventData.programId) {
      revalidatePath(`/dashboard/program/${eventData.programId}`);
    }
    
    return { 
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Failed to create event:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create event'
    };
  }
}