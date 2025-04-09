'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/app-router-auth';
import { getEventsTable } from '@/lib/airtable/tables/definitions';
import { redirect } from 'next/navigation';
import { getEventById } from '@/lib/app-router';

/**
 * Server Action to update an existing event
 * Can be used directly with forms via action attribute
 */
export async function updateEvent(formData) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      redirect('/auth/login');
    }
    
    // Get event ID from form data
    const eventId = formData.get('eventId');
    if (!eventId) {
      return { success: false, error: 'Event ID is required' };
    }
    
    // Get current event data to preserve any fields not in the form
    const currentEvent = await getEventById(eventId);
    if (!currentEvent) {
      return { success: false, error: 'Event not found' };
    }
    
    // Parse dates from the form
    const startDate = formData.get('startDate');
    const startTime = formData.get('startTime');
    const endDate = formData.get('endDate') || startDate;
    const endTime = formData.get('endTime');
    
    // Extract remaining data from formData
    const name = formData.get('name');
    const description = formData.get('description') || '';
    const location = formData.get('location') || '';
    const registrationUrl = formData.get('registrationUrl') || '';
    const type = formData.get('type') || 'Workshop';
    const programId = formData.get('programId') || null;
    const cohortId = formData.get('cohortId') || null;
    const status = formData.get('status') || 'Confirmed';
    const registrationStatus = formData.get('registrationStatus') || 'Open';
    const capacity = formData.get('capacity') ? parseInt(formData.get('capacity'), 10) : null;
    
    // Validate required fields
    if (!name) {
      return { success: false, error: 'Event name is required' };
    }
    
    if (!startDate) {
      return { success: false, error: 'Start date is required' };
    }
    
    // Create fields object for Airtable
    const fields = {
      'Name': name,
      'Description': description,
      'Start Date': startDate,
      'End Date': endDate || startDate,
      'Start Time': startTime,
      'End Time': endTime,
      'Location': location,
      'Registration URL': registrationUrl,
      'Type': type,
      'Status': status,
      'Registration Status': registrationStatus
    };
    
    // Only update capacity if it's provided and different from current
    if (capacity !== null && capacity !== currentEvent.capacity) {
      fields['Capacity'] = capacity;
    }
    
    // Update program and cohort if provided
    if (programId) {
      fields['Program'] = [programId];
    } else if (programId === '') {
      // Clear the program if explicitly set to empty
      fields['Program'] = [];
    }
    
    if (cohortId) {
      fields['Cohort'] = [cohortId];
    } else if (cohortId === '') {
      // Clear the cohort if explicitly set to empty
      fields['Cohort'] = [];
    }
    
    // Update the event in Airtable
    const eventsTable = getEventsTable();
    const updatedEvent = await eventsTable.update(eventId, fields);
    
    // Revalidate related paths
    revalidatePath('/dashboard/events');
    revalidatePath(`/dashboard/events/${eventId}`);
    revalidatePath('/dashboard');
    
    if (programId) {
      revalidatePath(`/dashboard/programs/${programId}`);
    }
    
    return { 
      success: true,
      data: updatedEvent._rawJson
    };
  } catch (error) {
    console.error('Failed to update event:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to update event'
    };
  }
}