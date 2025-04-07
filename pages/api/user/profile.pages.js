// Import dependencies without using @ alias (direct path for better compatibility)
import { auth0 } from "../../../lib/auth0";
import { updateUserProfile } from "../../../lib/airtable/entities/users";
import { updateEducation } from "../../../lib/airtable/entities/education";

// Force Node.js runtime for Auth0 compatibility
export const runtime = 'nodejs';

/**
 * User Profile API - Protected with Auth0
 * Refactored to use Auth0 v4 best practices and domain-driven design
 * IMPORTANT: This endpoint does NOT use withApiAuthRequired - it uses direct session validation
 */
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
    
    // Set standard headers for all responses
    res.setHeader('Cache-Control', 'no-store, private, no-cache, must-revalidate');
    
    // Track request performance
    const startTime = Date.now();
    
    // Handle request based on method
    switch (req.method) {
      case 'GET':
        return handleGetRequest(req, res, user, startTime);
      
      case 'PATCH':
      case 'PUT':
        return handleUpdateRequest(req, res, user, startTime);
      
      case 'POST':
        // Special case for POST with _method override
        const method = req.body?._method?.toUpperCase();
        if (method === 'PATCH') {
          return handleUpdateRequest(req, res, user, startTime);
        }
        return res.status(405).json({
          error: 'Method not allowed',
          allowedMethods: ['GET', 'PATCH', 'PUT', 'OPTIONS']
        });
      
      case 'OPTIONS':
        // Handle preflight requests
        res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, PATCH, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-HTTP-Method-Override');
        res.setHeader('Access-Control-Max-Age', '86400');
        return res.status(200).end();
      
      default:
        return res.status(405).json({
          error: 'Method not allowed',
          allowedMethods: ['GET', 'PATCH', 'PUT', 'POST', 'OPTIONS']
        });
    }
  } catch (error) {
    console.error('Profile API error:', error);
    
    // Check for specific Airtable schema errors
    let errorMessage = error.message;
    let statusCode = 500;
    
    if (error.message && error.message.includes('Unknown field name')) {
      errorMessage = 'Database schema error: Unknown field name referenced. The schema may have changed. Please contact support.';
      console.error('Schema error detected. Original error:', error.message);
      statusCode = 422; // Unprocessable entity
    }
    
    return res.status(statusCode).json({
      error: 'Internal server error',
      message: errorMessage,
      errorType: error.name || 'UnknownError',
      statusCode
    });
  }
};

/**
 * Handle GET requests for user profile
 * Now uses the refactored profile implementation
 */
async function handleGetRequest(req, res, user, startTime) {
  try {
    // Check if minimal mode is requested (for onboarding flow)
    const minimal = req.query.minimal === 'true';
    
    // Import the refactored profile implementation
    const { getCompleteUserProfile } = await import('@/lib/userProfile.refactored');
    
    // Get complete profile using the refactored implementation
    const profile = await getCompleteUserProfile(user, { minimal });
    
    // Return full profile with metadata
    return res.status(200).json({
      profile,
      _meta: {
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        // Include a flag to indicate this is using the refactored implementation
        refactored: true
      }
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    
    // Analyze the error to provide more helpful responses
    const isAirtableSchemaError = error.message && (
      error.message.includes('Unknown field name') || 
      error.message.includes('UNKNOWN_FIELD_NAME')
    );
    
    const isNetworkError = error.code === 'ECONNRESET' || 
                         error.code === 'ETIMEDOUT' || 
                         error.name === 'AbortError';
    
    // Log additional details for debugging
    if (isAirtableSchemaError) {
      console.error('Airtable schema error detected:', error.message);
    } else if (isNetworkError) {
      console.error('Network error when communicating with Airtable:', error.message);
    }
    
    // Return basic profile as fallback so the app doesn't completely break
    return res.status(200).json({
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
        error: isAirtableSchemaError 
               ? 'Database schema error: The database structure may have changed. Please contact support.'
               : error.message,
        errorType: error.name || 'UnknownError',
        timestamp: new Date().toISOString(),
        errorCode: error.code || error.statusCode
      }
    });
  }
}

/**
 * Handle PATCH/PUT requests for updating user profile
 */
async function handleUpdateRequest(req, res, user, startTime) {
  try {
    // Extract update data from request body
    const { contactId, ...updateData } = req.body;
    
    // Validate required fields
    if (!contactId) {
      return res.status(400).json({ 
        error: "Contact ID is required for updates" 
      });
    }
    
    // Validate major field if present
    if (updateData.major !== undefined && updateData.major !== null) {
      if (typeof updateData.major === 'string') {
        if (!updateData.major.startsWith('rec')) {
          return res.status(400).json({ 
            error: "Invalid major ID format. Expected record ID but received text value.",
            receivedValue: updateData.major
          });
        }
      } else {
        return res.status(400).json({
          error: "Invalid major field type. Expected string record ID or null.",
          receivedType: typeof updateData.major
        });
      }
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
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      contactId,
      _meta: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ 
      error: "Failed to update profile", 
      message: error.message 
    });
  }
}