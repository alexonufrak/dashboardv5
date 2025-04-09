'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/app-router-auth';
import { 
  fetchContactByAuth0Id,
  fetchContactByEmail
} from '@/lib/app-router';
import { getContactsTable } from '@/lib/airtable/tables/definitions';

/**
 * Update user profile in Airtable
 * 
 * This server action updates the user's contact record in Airtable
 * and invalidates the cache for the profile page.
 */
export async function updateProfile(formData) {
  // Validate user is authenticated
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  
  try {
    // Get the contact record
    let contact = await fetchContactByAuth0Id(user.sub);
    
    // If not found by Auth0 ID, try by email
    if (!contact && user.email) {
      contact = await fetchContactByEmail(user.email);
    }
    
    if (!contact) {
      throw new Error('Contact record not found');
    }
    
    const contactId = contact.id;
    
    // Extract form data
    const firstName = formData.get('firstName') || '';
    const lastName = formData.get('lastName') || '';
    const phone = formData.get('phone') || '';
    const bio = formData.get('bio') || '';
    const linkedin = formData.get('linkedin') || '';
    const website = formData.get('website') || '';
    const expertise = formData.getAll('expertise') || [];
    
    // Validate form data
    if (!firstName.trim() || !lastName.trim()) {
      throw new Error('First name and last name are required');
    }
    
    // URL validation
    if (linkedin && !isValidUrl(linkedin)) {
      throw new Error('LinkedIn URL is not valid');
    }
    
    if (website && !isValidUrl(website)) {
      throw new Error('Website URL is not valid');
    }
    
    // Prepare update data
    const updateData = {
      'First Name': firstName,
      'Last Name': lastName,
      'Phone': phone,
      'Bio': bio,
      'LinkedIn': linkedin,
      'Website URL': website
    };
    
    // Add expertise if provided
    if (expertise && expertise.length > 0) {
      updateData['Expertise'] = expertise;
    }
    
    // Update the contact record in Airtable
    const table = getContactsTable();
    await table.update(contactId, updateData);
    
    // Update Auth0 ID if missing (reconciliation between Auth0 and Airtable)
    if (!contact.fields['Auth0 ID'] && user.sub) {
      await table.update(contactId, {
        'Auth0 ID': user.sub
      });
    }
    
    // Revalidate the profile page
    revalidatePath('/dashboard/profile');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { 
      success: false, 
      error: error.message || 'An error occurred while updating your profile'
    };
  }
}

// Helper function to validate URLs
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    // If the URL is provided without a protocol, try with https://
    if (!string.startsWith('http://') && !string.startsWith('https://')) {
      try {
        const url = new URL(`https://${string}`);
        return true;
      } catch (_) {
        return false;
      }
    }
    return false;
  }
}