// Import dependencies without using @ alias (direct path for better compatibility)
import { auth0 } from "../../../lib/auth0";
import { 
  getUserByAuth0Id,
  updateUserProfile 
} from "../../../lib/airtable/entities/users";
import { getEducation, updateEducation } from "../../../lib/airtable/entities/education";
import { getInstitution } from "../../../lib/airtable/entities/institutions";

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
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Handle GET requests for user profile
 */
async function handleGetRequest(req, res, user, startTime) {
  try {
    // Check if minimal mode is requested (for onboarding flow)
    const minimal = req.query.minimal === 'true';
    
    // Set timeout for profile fetch
    const timeoutDuration = minimal ? 3000 : 9000;
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Profile fetch timed out")), timeoutDuration)
    );
    
    // Prepare profile processing function
    const processingPromise = async () => {
      // Get the user profile from our entity layer
      const baseProfile = await getUserByAuth0Id(user.sub);
      
      if (!baseProfile) {
        // Return basic profile from Auth0 if no profile found
        return {
          auth0Id: user.sub,
          email: user.email,
          name: user.name,
          picture: user.picture,
          isProfileComplete: false,
        };
      }
      
      // If we're in minimal mode, return basic profile
      if (minimal) {
        return {
          auth0Id: user.sub,
          contactId: baseProfile.contactId,
          email: baseProfile.email || user.email,
          firstName: baseProfile.firstName || user.given_name,
          lastName: baseProfile.lastName || user.family_name,
          picture: user.picture,
          onboardingStatus: baseProfile.onboardingStatus || "Registered",
          isProfileComplete: false, // Simplified determination for minimal mode
        };
      }
      
      // For full profile, fetch related data
      const educationId = baseProfile.Education && baseProfile.Education.length > 0 
        ? baseProfile.Education[0] 
        : null;
      
      // Fetch education data if available
      let educationData = null;
      let institutionData = null;
      
      if (educationId) {
        educationData = await getEducation(educationId);
        
        // Fetch institution data if available in education
        if (educationData && educationData.institution && educationData.institution.length > 0) {
          institutionData = await getInstitution(educationData.institution[0]);
        }
      }
      
      // Combine all data into complete profile
      const completeProfile = {
        // Basic user info
        auth0Id: user.sub,
        contactId: baseProfile.contactId,
        email: baseProfile.email || user.email,
        firstName: baseProfile.firstName || user.given_name,
        lastName: baseProfile.lastName || user.family_name,
        picture: user.picture,
        
        // Education data
        educationId: educationId,
        degreeType: educationData?.degreeType || baseProfile["Degree Type (from Education)"]?.[0] || "",
        major: educationData?.majorName || baseProfile["Major (from Education)"]?.[0] || "",
        programId: educationData?.major?.[0] || null,
        graduationYear: educationData?.graduationYear || baseProfile["Graduation Year (from Education)"]?.[0] || "",
        graduationSemester: educationData?.graduationSemester || baseProfile["Graduation Semester (from Education)"]?.[0] || "",
        
        // Institution data
        institution: {
          id: institutionData?.id || educationData?.institution?.[0] || null,
          name: institutionData?.name || educationData?.institutionName?.[0] || 
                baseProfile["Name (from Institution (from Education))"]?.[0] || "Not specified"
        },
        institutionId: institutionData?.id || educationData?.institution?.[0] || null,
        institutionName: institutionData?.name || educationData?.institutionName?.[0] || 
                        baseProfile["Name (from Institution (from Education))"]?.[0] || "Not specified",
        
        // Other profile data
        referralSource: baseProfile["Referral Source"] || "",
        onboardingStatus: baseProfile.onboardingStatus || "Registered",
        headshot: baseProfile.Headshot && baseProfile.Headshot.length > 0 
          ? baseProfile.Headshot[0].url 
          : null,
        
        // Determine if profile is complete
        isProfileComplete: Boolean(
          baseProfile.firstName &&
          baseProfile.lastName &&
          (educationData?.degreeType || baseProfile["Degree Type (from Education)"]?.[0]) &&
          (educationData?.graduationYear || baseProfile["Graduation Year (from Education)"]?.[0]) &&
          ((institutionData?.name || educationData?.institutionName?.[0] || 
            baseProfile["Name (from Institution (from Education))"]?.[0]) && 
           (institutionData?.id || educationData?.institution?.[0]))
        ),
        
        // Add timestamp for caching and debugging
        lastUpdated: new Date().toISOString()
      };
      
      return completeProfile;
    };
    
    // Race profile fetch against timeout
    const profile = await Promise.race([processingPromise(), timeoutPromise]);
    
    // Return full profile with metadata
    return res.status(200).json({
      profile,
      _meta: {
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    
    // Return basic profile as fallback
    return res.status(200).json({
      profile: {
        auth0Id: user.sub,
        email: user.email,
        name: user.name,
        picture: user.picture,
        isProfileComplete: false,
      },
      _meta: {
        error: error.message,
        timestamp: new Date().toISOString()
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