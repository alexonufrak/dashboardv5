'use server'

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/app-router-auth';
import { getEventsTable } from '@/lib/airtable/tables/definitions';
import { redirect } from 'next/navigation';

/**
 * Server Action to create a new event
 * Can be used directly with forms via action attribute
 */
export async function createEvent(formData) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      redirect('/auth/login');
    }
    
    // Parse dates from the form
    const startDate = formData.get('startDate');
    const startTime = formData.get('startTime');
    const endDate = formData.get('endDate') || startDate;
    const endTime = formData.get('endTime');
    
    // Format dates for Airtable
    const formatDateForAirtable = (date, time) => {
      if (!date) return null;
      
      // If no time provided, set to start of day
      const timeToUse = time || '00:00';
      
      // Combine date and time into ISO string
      const combinedDateTime = `${date}T${timeToUse}:00`;
      return new Date(combinedDateTime).toISOString();
    };
    
    const startDateTime = formatDateForAirtable(startDate, startTime);
    const endDateTime = formatDateForAirtable(endDate, endTime);
    
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
      'Registration Status': registrationStatus,
      'Capacity': capacity,
      'Registration Count': 0
    };
    
    // Add program and cohort if provided
    if (programId) {
      fields['Program'] = [programId];
    }
    
    if (cohortId) {
      fields['Cohort'] = [cohortId];
    }
    
    // Create the event in Airtable
    const eventsTable = getEventsTable();
    const createdEvent = await eventsTable.create(fields);
    
    // Revalidate related paths
    revalidatePath('/dashboard/events');
    revalidatePath('/dashboard');
    
    if (programId) {
      revalidatePath(`/dashboard/programs/${programId}`);
    }
    
    return { 
      success: true,
      data: createdEvent._rawJson
    };
  } catch (error) {
    console.error('Failed to create event:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create event'
    };
  }
}