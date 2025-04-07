'use server'

import { institutions } from '@/lib/airtable/entities';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/lib/app-router-auth';

export async function updateInstitution(institutionId, formData) {
  try {
    // Get auth session
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    // Validate institution ID
    if (!institutionId) {
      return { success: false, error: 'Institution ID is required' };
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
      updatedBy: session.user.email,
      updatedAt: new Date().toISOString()
    };
    
    // Filter out undefined or null values
    const filteredData = Object.entries(institutionData)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    // Update the institution
    const result = await institutions.updateInstitution(institutionId, filteredData);
    
    if (!result) {
      return { success: false, error: 'Failed to update institution' };
    }
    
    // Revalidate caches
    revalidateTag('institutions');
    revalidateTag(`institution-${institutionId}`);
    
    // Revalidate paths
    revalidatePath('/dashboard/institutions');
    revalidatePath(`/dashboard/institutions/${institutionId}`);
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating institution:', error);
    return { success: false, error: error.message || 'Failed to update institution' };
  }
}