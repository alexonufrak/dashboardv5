'use server'

/**
 * Server Action for profile updates with useFormState
 * Demonstrates the Server Actions pattern for form mutations with the useFormState hook
 */
import { revalidatePath, revalidateTag } from 'next/cache'
import { getCurrentUser } from '@/lib/app-router-auth'
import { getUserByAuth0Id, updateUserProfile } from '@/lib/airtable/entities/users'
import { updateEducation } from '@/lib/airtable/entities/education'

/**
 * Server action to update user profile, designed to work with useFormState
 * Returns state object with success/error information
 */
export async function updateProfileWithFormState(prevState, formData) {
  try {
    // Get the authenticated user
    const user = await getCurrentUser()
    if (!user) {
      return { 
        success: false, 
        message: 'Authentication required',
        fieldErrors: {}
      }
    }
    
    // Get the user profile from Auth0 ID
    const profile = await getUserByAuth0Id(user.sub)
    if (!profile || !profile.contactId) {
      return { 
        success: false, 
        message: 'User profile not found',
        fieldErrors: {}
      }
    }
    
    // Extract form data
    const firstName = formData.get('firstName')
    const lastName = formData.get('lastName')
    const contactId = profile.contactId
    
    // Optional education fields
    const educationId = formData.get('educationId')
    const institutionId = formData.get('institutionId')
    const degreeType = formData.get('degreeType')
    const graduationYear = formData.get('graduationYear')
    const graduationSemester = formData.get('graduationSemester')
    const major = formData.get('major')
    
    // Field errors tracking
    const fieldErrors = {}
    
    // Validate required fields
    if (!firstName) {
      fieldErrors.firstName = 'First name is required'
    }
    
    if (!lastName) {
      fieldErrors.lastName = 'Last name is required'
    }
    
    // Validate graduation year if provided
    if (graduationYear) {
      const yearPattern = /^[0-9]{4}$/
      if (!yearPattern.test(graduationYear)) {
        fieldErrors.graduationYear = 'Please enter a valid 4-digit year (e.g., 2025)'
      } else {
        const yearValue = parseInt(graduationYear, 10)
        const currentYear = new Date().getFullYear()
        if (yearValue < currentYear - 10 || yearValue > currentYear + 10) {
          fieldErrors.graduationYear = `Year ${yearValue} seems unusual. Please verify.`
        }
      }
    }
    
    // Return errors if validation failed
    if (Object.keys(fieldErrors).length > 0) {
      return {
        success: false,
        message: 'Please fix the errors below',
        fieldErrors
      }
    }
    
    // Update profile data
    const profileData = {
      firstName,
      lastName
    }
    
    // Update the profile
    await updateUserProfile(contactId, profileData)
    
    // Update education if present
    let educationResult = null
    if (educationId || institutionId) {
      const educationData = {
        educationId,
        contactId,
        institutionId,
        degreeType,
        graduationYear: graduationYear ? parseInt(graduationYear, 10) : undefined,
        graduationSemester,
        major
      }
      
      educationResult = await updateEducation(educationData)
    }
    
    // Revalidate related pages
    revalidateTag('user-profile')
    revalidatePath('/dashboard/profile')
    revalidatePath('/dashboard')
    
    // Return success response
    return { 
      success: true,
      message: 'Profile updated successfully',
      fieldErrors: {},
      data: {
        profile: {
          contactId,
          firstName,
          lastName
        },
        education: educationResult
      }
    }
  } catch (error) {
    console.error('Error updating profile:', error)
    
    // Return error response
    return { 
      success: false, 
      message: error.message || 'Failed to update profile',
      fieldErrors: {}
    }
  }
}