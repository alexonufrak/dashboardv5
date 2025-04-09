'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/app-router-auth';
import { getCurrentUserContact } from '@/lib/app-router';
import { getApplicationsTable } from '@/lib/airtable/tables/definitions';

/**
 * Submit an application to a program/cohort
 * 
 * This server action creates a new application record in Airtable
 * and invalidates the relevant cache paths.
 */
export async function applyToProgram(formData) {
  // Validate user is authenticated
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  
  try {
    // Get the contact record
    const contact = await getCurrentUserContact(user);
    if (!contact) {
      throw new Error('Contact record not found');
    }
    
    const contactId = contact.id;
    
    // Extract form data
    const cohortId = formData.get('cohortId') || null;
    const programId = formData.get('programId') || null;
    const motivation = formData.get('motivation') || '';
    const experience = formData.get('experience') || '';
    const goals = formData.get('goals') || '';
    const backgroundInfo = formData.get('backgroundInfo') || '';
    
    // Validate form data
    if (!cohortId) {
      throw new Error('Cohort ID is required');
    }
    
    if (!programId) {
      throw new Error('Program ID is required');
    }
    
    if (!motivation.trim()) {
      throw new Error('Motivation statement is required');
    }
    
    // Check if user has already applied to this cohort
    const applicationsTable = getApplicationsTable();
    const existingApplications = await applicationsTable.select({
      filterByFormula: `AND({Contact} = "${contactId}", {Cohort} = "${cohortId}")`,
      maxRecords: 1
    }).firstPage();
    
    if (existingApplications && existingApplications.length > 0) {
      throw new Error('You have already applied to this program cohort');
    }
    
    // Create the application record
    const newApplication = await applicationsTable.create({
      'Contact': [contactId],
      'Cohort': [cohortId],
      'Program': programId ? [programId] : undefined,
      'Motivation': motivation,
      'Experience': experience,
      'Goals': goals,
      'Background Info': backgroundInfo,
      'Status': 'Pending',
      'Submission Date': new Date().toISOString()
    });
    
    // Revalidate relevant paths
    revalidatePath('/dashboard/programs');
    revalidatePath(`/dashboard/programs/${programId}`);
    
    return { 
      success: true,
      applicationId: newApplication.id
    };
  } catch (error) {
    console.error('Error submitting program application:', error);
    return { 
      success: false, 
      error: error.message || 'An error occurred while submitting your application'
    };
  }
}