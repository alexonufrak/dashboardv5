'use server'

import { partnerships } from '@/lib/airtable/entities';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/lib/app-router-auth';

export async function createPartnership(formData) {
  try {
    // Get auth session
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // Extract data from formData
    const partnershipData = {
      institutionId: formData.get('institutionId'),
      programId: formData.get('programId'),
      status: formData.get('status') || 'active',
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      agreementUrl: formData.get('agreementUrl'),
      notes: formData.get('notes'),
      createdBy: session.user.email,
      createdAt: new Date().toISOString()
    };
    
    // Validate required fields
    if (!partnershipData.institutionId) {
      return { success: false, error: 'Institution ID is required' };
    }
    
    if (!partnershipData.programId) {
      return { success: false, error: 'Program ID is required' };
    }
    
    // Filter out undefined or null values
    const filteredData = Object.entries(partnershipData)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    // Create the partnership
    const result = await partnerships.createPartnership(filteredData);
    
    if (!result) {
      return { success: false, error: 'Failed to create partnership' };
    }
    
    // Revalidate caches
    revalidateTag('partnerships');
    revalidateTag(`institution-partnerships-${partnershipData.institutionId}`);
    revalidateTag(`program-partnerships-${partnershipData.programId}`);
    
    // Revalidate paths
    revalidatePath('/dashboard/institutions');
    revalidatePath(`/dashboard/institutions/${partnershipData.institutionId}`);
    revalidatePath(`/dashboard/programs/${partnershipData.programId}`);
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating partnership:', error);
    return { success: false, error: error.message || 'Failed to create partnership' };
  }
}