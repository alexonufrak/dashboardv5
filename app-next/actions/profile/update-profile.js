'use server'

/**
 * Server Action for profile updates
 * Demonstrates the Server Actions pattern for form mutations
 */
import { revalidatePath, revalidateTag } from 'next/cache';
import { getCurrentUser } from '@/lib/app-router-auth';
import { getUserByAuth0Id, updateUserProfile } from '@/lib/airtable/entities/users';
import { updateEducation } from '@/lib/airtable/entities/education';

/**
 * Server action to update user profile
 * Demonstrates error handling, validation, and cache invalidation
 */
export async function updateProfile(formData) {
  try {
    // Get the authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return { 
        success: false, 
        error: 'Authentication required' 
      };
    }
    
    // Get the user profile from Auth0 ID
    const profile = await getUserByAuth0Id(user.sub);
    if (!profile || !profile.contactId) {
      return { 
        success: false, 
        error: 'User profile not found' 
      };
    }
    
    // Extract form data
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const contactId = profile.contactId;
    
    // Optional education fields
    const educationId = formData.get('educationId');
    const institutionId = formData.get('institutionId');
    const degreeType = formData.get('degreeType');
    const graduationYear = formData.get('graduationYear');
    const graduationSemester = formData.get('graduationSemester');
    const major = formData.get('major');
    
    // Validate required fields
    if (!firstName || !lastName) {
      return { 
        success: false, 
        error: 'First and last name are required',
        fieldErrors: {
          firstName: !firstName ? 'First name is required' : null,
          lastName: !lastName ? 'Last name is required' : null
        }
      };
    }
    
    // Update profile data
    const profileData = {
      firstName,
      lastName
    };
    
    // Update the profile
    await updateUserProfile(contactId, profileData);
    
    // Update education if present
    let educationResult = null;
    if (educationId || institutionId) {
      const educationData = {
        educationId,
        contactId,
        institutionId,
        degreeType,
        graduationYear: graduationYear ? parseInt(graduationYear, 10) : undefined,
        graduationSemester,
        major
      };
      
      educationResult = await updateEducation(educationData);
    }
    
    // Revalidate related pages
    revalidateTag('user-profile');
    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard');
    
    // Return success response
    return { 
      success: true,
      profile: {
        contactId,
        firstName,
        lastName
      },
      education: educationResult
    };
  } catch (error) {
    console.error('Error updating profile:', error);
    
    // Return error response
    return { 
      success: false, 
      error: error.message || 'Failed to update profile'
    };
  }
}