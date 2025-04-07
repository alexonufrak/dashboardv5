'use server'

import { institutions } from '@/lib/airtable/entities';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/lib/app-router-auth';

export async function createInstitution(formData) {
  try {
    // Get auth session
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // Extract data from formData
    const institutionData = {
      name: formData.get('name'),
      type: formData.get('type'),
      website: formData.get('website'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state'),
      zip: formData.get('zip'),
      country: formData.get('country'),
      createdBy: session.user.email,
      createdAt: new Date().toISOString()
    };
    
    // Validate required fields
    if (!institutionData.name) {
      return { success: false, error: 'Institution name is required' };
    }
    
    // Filter out undefined or null values
    const filteredData = Object.entries(institutionData)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    // Create the institution
    const result = await institutions.createInstitution(filteredData);
    
    if (!result) {
      return { success: false, error: 'Failed to create institution' };
    }
    
    // Revalidate caches
    revalidateTag('institutions');
    
    // Revalidate paths
    revalidatePath('/dashboard/institutions');
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating institution:', error);
    return { success: false, error: error.message || 'Failed to create institution' };
  }
}