/**
 * User Profile API v3
 * Refactored with the new API middleware pattern
 */
import { createApiHandler, createApiResponse } from '@/lib/api/middleware';
import { getUserByEmail, updateUserProfile } from '@/lib/airtable/entities/users';
import { updateEducation } from '@/lib/airtable/entities/education';

// Force Node.js runtime for Auth0 compatibility
export const runtime = 'nodejs';

export default createApiHandler({
  // GET handler for retrieving profile
  GET: async (req, res, { user }) => {
    // Start timing for performance monitoring
    const startTime = Date.now();
    
    try {
      // Check if minimal mode is requested (for onboarding flow)
      const minimal = req.query.minimal === 'true';
      
      // Import the refactored profile implementation
      const { getCompleteUserProfile } = await import('@/lib/userProfile.refactored');
      
      // Get complete profile using the refactored implementation
      const profile = await getCompleteUserProfile(user, { minimal });
      
      // Return full profile with metadata
      return res.status(200).json(createApiResponse({ profile }, startTime));
    } catch (error) {
      console.error("Error fetching profile:", error);
      
      // Return basic profile as fallback so the app doesn't completely break
      return res.status(200).json(createApiResponse({
        profile: {
          auth0Id: user.sub,
          email: user.email,
          name: user.name,
          firstName: user.given_name || user.name?.split(' ')[0] || '',
          lastName: user.family_name || user.name?.split(' ').slice(1).join(' ') || '',
          picture: user.picture,
          isProfileComplete: false,
        },
        _meta: {
          error: error.message,
          errorType: error.name || 'UnknownError',
          errorCode: error.code || error.statusCode
        }
      }, startTime));
    }
  },
  
  // PATCH handler for updating profile
  PATCH: async (req, res, { user }) => {
    // Start timing for performance monitoring
    const startTime = Date.now();
    
    try {
      // Extract update data from request body
      const { contactId, ...updateData } = req.body;
      
      // Validate required fields
      if (!contactId) {
        return res.status(400).json({ 
          error: "Contact ID is required for updates" 
        });
      }
      
      // Create an enhanced update data object
      const enhancedUpdateData = {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        referralSource: updateData.referralSource
      };
      
      // First update the main contact record
      const updatedProfile = await updateUserProfile(contactId, enhancedUpdateData);
      
      // Then handle education updates if needed
      if (updateData.educationId || 
          updateData.institutionId || 
          updateData.degreeType ||
          updateData.graduationYear ||
          updateData.graduationSemester ||
          updateData.major) {
        
        // Prepare education data
        const educationData = {
          educationId: updateData.educationId,
          contactId,
          institutionId: updateData.institutionId,
          degreeType: updateData.degreeType,
          graduationYear: updateData.graduationYear,
          graduationSemester: updateData.graduationSemester,
          major: updateData.major
        };
        
        // Update or create education record
        await updateEducation(educationData);
      }
      
      // Return success response
      return res.status(200).json(createApiResponse({
        success: true,
        message: "Profile updated successfully",
        contactId
      }, startTime));
    } catch (error) {
      throw error; // Let the middleware handle the error
    }
  },
  
  // PUT handler (same as PATCH for this endpoint)
  PUT: async (req, res, { user }) => {
    // Re-use the same handler function as PATCH
    const { contactId, ...updateData } = req.body;
    
    // Validate required fields
    if (!contactId) {
      return res.status(400).json({ 
        error: "Contact ID is required for updates" 
      });
    }
    
    // Create an enhanced update data object
    const enhancedUpdateData = {
      firstName: updateData.firstName,
      lastName: updateData.lastName,
      referralSource: updateData.referralSource
    };
    
    // First update the main contact record
    const updatedProfile = await updateUserProfile(contactId, enhancedUpdateData);
    
    // Then handle education updates if needed
    if (updateData.educationId || 
        updateData.institutionId || 
        updateData.degreeType ||
        updateData.graduationYear ||
        updateData.graduationSemester ||
        updateData.major) {
      
      // Prepare education data
      const educationData = {
        educationId: updateData.educationId,
        contactId,
        institutionId: updateData.institutionId,
        degreeType: updateData.degreeType,
        graduationYear: updateData.graduationYear,
        graduationSemester: updateData.graduationSemester,
        major: updateData.major
      };
      
      // Update or create education record
      await updateEducation(educationData);
    }
    
    // Return success response
    return res.status(200).json(createApiResponse({
      success: true,
      message: "Profile updated successfully",
      contactId
    }, Date.now()));
  }
}, {
  // Options for the API handler
  requireAuth: true, // Require authentication
  cors: true, // Enable CORS for this endpoint
  cacheControl: 'no-store, private, no-cache, must-revalidate' // Cache control header
});