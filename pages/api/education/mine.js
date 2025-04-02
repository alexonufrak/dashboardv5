/**
 * API endpoint for managing the current user's education record
 * Supports GET and PATCH methods
 */
import { auth0 } from '@/lib/auth0';
import { getCompleteProfile } from '@/lib/airtable/entities/users';
import { getEducation, updateEducation } from '@/lib/airtable/entities/education';

export default async function handler(req, res) {
  try {
    // Get Auth0 session and validate user is authenticated
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({
        error: 'Not authenticated'
      });
    }
    const { user } = session;
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return handleGetRequest(req, res, user);
      case 'PATCH':
        return handlePatchRequest(req, res, user);
      case 'POST':
        // Support POST with _method=PATCH to handle SameSite cookie issues
        if (req.body && req.body._method?.toUpperCase() === 'PATCH') {
          return handlePatchRequest(req, res, user);
        }
        return res.status(405).json({ error: 'Method not allowed' });
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in education/mine API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Handle GET request to fetch the user's education record
 */
async function handleGetRequest(req, res, user) {
  try {
    // Get the user's profile to find their contact ID, using the complete profile function
    // which prioritizes email-based lookups over Auth0 ID
    const profile = await getCompleteProfile(user);
    
    if (!profile || !profile.contactId) {
      return res.status(404).json({
        error: 'User profile not found'
      });
    }
    
    // Check if the user has an education record linked
    if (!profile.education || profile.education.length === 0) {
      return res.status(200).json({
        education: {
          exists: false,
          message: 'No education record found for this user'
        }
      });
    }
    
    // Use the first education record ID
    const educationId = profile.education[0];
    
    // Fetch the education record
    const education = await getEducation(educationId);
    
    if (!education) {
      return res.status(200).json({
        education: {
          exists: false,
          message: 'Education record linked but not found'
        }
      });
    }
    
    // Return the education data
    return res.status(200).json({
      education: {
        ...education,
        exists: true
      }
    });
  } catch (error) {
    console.error('Error fetching education:', error);
    return res.status(500).json({
      error: 'Failed to fetch education information',
      message: error.message
    });
  }
}

/**
 * Handle PATCH request to update the user's education record
 */
async function handlePatchRequest(req, res, user) {
  try {
    // Get the user's profile to find their contact ID, using the complete profile function
    // which prioritizes email-based lookups over Auth0 ID
    const profile = await getCompleteProfile(user);
    
    if (!profile || !profile.contactId) {
      return res.status(404).json({
        error: 'User profile or contact record not found'
      });
    }
    
    // Extract education data from the request body
    const {
      educationId,
      institutionId,
      institutionName,
      degreeType,
      major,
      majorName,
      graduationYear,
      graduationSemester
    } = req.body;
    
    // Validate required fields
    if (!institutionId && !institutionName) {
      return res.status(400).json({
        error: 'Institution is required'
      });
    }
    
    // Get existing educationId if available
    const existingEducationId = 
      educationId || 
      (profile.education && profile.education.length > 0 ? profile.education[0] : null);
    
    // Update or create the education record
    const updatedEducation = await updateEducation({
      educationId: existingEducationId,
      contactId: profile.contactId,
      institutionId,
      institutionName,
      degreeType,
      major,
      majorName,
      graduationYear,
      graduationSemester
    });
    
    // Return the updated education data
    return res.status(200).json({
      education: {
        ...updatedEducation,
        exists: true
      },
      message: 'Education information updated successfully'
    });
  } catch (error) {
    console.error('Error updating education:', error);
    return res.status(500).json({
      error: 'Failed to update education information',
      message: error.message
    });
  }
}