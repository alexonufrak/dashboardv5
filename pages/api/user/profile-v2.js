import { auth0 } from '@/lib/auth0';
import { users } from '@/lib/airtable/entities';

/**
 * V2 API endpoint to get user's complete profile
 * This demonstrates the refactored Airtable integration
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 */
export default async function handler(req, res) {
  try {
    // Record start time for performance measurement
    const startTime = Date.now();
    
    // Get the current session and user using Auth0
    const session = await auth0.getSession(req, res);
    if (!session?.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return handleGetProfile(req, res, session.user, startTime);
      case 'POST':
        // Handle POST with _method override for PATCH
        if (req.body && req.body._method === 'PATCH') {
          return handleUpdateProfile(req, res, session.user, startTime);
        }
        return res.status(405).json({ error: "Method not allowed" });
      case 'PATCH':
        return handleUpdateProfile(req, res, session.user, startTime);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}

/**
 * Handle GET request for user profile
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 * @param {object} user - Auth0 user
 * @param {number} startTime - Request start time for performance metrics
 */
async function handleGetProfile(req, res, user, startTime) {
  try {
    // Get minimal flag from query params
    const minimal = req.query.minimal === 'true';
    
    // Force refresh parameter for bypassing cache
    const forceRefresh = req.query.refresh === 'true';
    
    // Get complete profile using our entity module
    const profile = await users.getCompleteProfile(user, { minimal, forceRefresh });
    
    // If the profile has education record IDs but no education data, fetch that data
    if (profile && Array.isArray(profile.education) && profile.education.length > 0) {
      try {
        // Import the education module to fetch education data
        const { getEducation } = await import('@/lib/airtable/entities/education');
        
        // Get the first education record (most profiles only have one)
        const educationId = profile.education[0];
        const educationData = await getEducation(educationId);
        
        if (educationData) {
          console.log(`Found education data for profile, adding to response`);
          
          // Add education data to the profile
          profile.educationData = educationData;
          
          // Expose education fields at the top level for easier access in components
          profile.educationId = educationData.id;
          profile.institutionName = educationData.institutionName;
          profile.institution = educationData.institution;
          profile.degreeType = educationData.degreeType;
          profile.graduationYear = educationData.graduationYear;
          profile.graduationSemester = educationData.graduationSemester;
          profile.major = educationData.major;
          profile.majorName = educationData.majorName;
        }
      } catch (educationError) {
        console.error("Error fetching education data:", educationError);
        // Don't fail the whole request if education data fetch fails
      }
    }
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Return the enhanced profile data
    return res.status(200).json({
      profile,
      _meta: {
        processingTime,
        minimal,
        timestamp: new Date().toISOString(),
        version: 'v2'
      }
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
}

/**
 * Handle PATCH request to update user profile
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 * @param {object} user - Auth0 user
 * @param {number} startTime - Request start time for performance metrics
 */
async function handleUpdateProfile(req, res, user, startTime) {
  try {
    const userId = user.sub;
    const userEmail = user.email;
    
    // Validate required fields
    if (!req.body) {
      return res.status(400).json({ error: "Request body is required" });
    }
    
    // Get the current profile to find contactId, prioritizing email lookup
    let currentProfile = null;
    
    if (userEmail) {
      // Try email lookup first
      currentProfile = await users.getUserByEmail(userEmail);
      
      // If email lookup fails, try finding via linked records
      if (!currentProfile) {
        try {
          currentProfile = await users.findUserViaLinkedRecords(userEmail);
        } catch (err) {
          console.error("Error finding user via linked records:", err);
        }
      }
    }
    
    // Fallback to Auth0 ID lookup only if email methods failed
    if (!currentProfile && userId) {
      currentProfile = await users.getUserByAuth0Id(userId);
    }
    
    if (!currentProfile || !currentProfile.contactId) {
      return res.status(404).json({ error: "User profile not found" });
    }
    
    // Extract update data
    const updateData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      degreeType: req.body.degreeType,
      graduationYear: req.body.graduationYear,
      institutionId: req.body.institutionId,
      major: req.body.major || null,
      educationId: req.body.educationId, // Include education ID for updating existing record
      contactId: currentProfile.contactId
    };
    
    // Log detailed update information to help with debugging
    console.log(`Profile update for user ${userEmail} with education data:`, {
      educationId: req.body.educationId,
      degreeType: req.body.degreeType,
      major: req.body.major,
      graduationYear: req.body.graduationYear
    });
    
    // Update profile using entity module
    const updatedProfile = await users.updateUserProfile(currentProfile.contactId, updateData);
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Return updated profile
    return res.status(200).json({
      profile: updatedProfile,
      success: true,
      _meta: {
        processingTime,
        timestamp: new Date().toISOString(),
        version: 'v2'
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
}