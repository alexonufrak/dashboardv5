import { auth0 } from "@/lib/auth0";
import { getUserProfile, updateUserProfile } from '../../../lib/airtable';

// Force Node.js runtime for Auth0 compatibility
export const runtime = 'nodejs';

/**
 * Template for protected API route with Auth0 v4
 * This follows the recommended approach from Auth0 documentation
 */
export default async function handler(req, res) {
  try {
    // Get Auth0 session - this validates the user is authenticated
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({
        error: 'Not authenticated'
      });
    }
    const { user } = session;

    // Set common headers
    res.setHeader('Cache-Control', 'no-store, private, no-cache, must-revalidate');
    
    // Handle request based on method
    switch (req.method) {
      case 'GET':
        return handleGetRequest(req, res, user);
      
      case 'PATCH':
        return handleUpdateRequest(req, res, user);
      
      case 'OPTIONS':
        // Handle preflight CORS request
        res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Access-Control-Max-Age', '86400');
        return res.status(200).end();
      
      default:
        // Method not allowed
        return res.status(405).json({
          error: 'Method not allowed',
          allowedMethods: ['GET', 'PATCH', 'OPTIONS'],
        });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * Handle GET request to fetch user profile
 */
async function handleGetRequest(req, res, user) {
  try {
    // Start time for performance tracking
    const startTime = Date.now();
    
    // Get profile data using email from authenticated session
    const profile = await getUserProfile(null, user.email);
    
    if (!profile) {
      // Profile not found - return basic profile from Auth0
      return res.status(404).json({
        profile: {
          email: user.email,
          name: user.name,
          picture: user.picture,
          isProfileComplete: false,
        },
        _meta: {
          error: 'Profile not found in database',
          timestamp: new Date().toISOString(),
        }
      });
    }
    
    // Return profile with performance metadata
    return res.status(200).json({
      profile,
      _meta: {
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({
      error: 'Failed to fetch profile',
      message: error.message,
    });
  }
}

/**
 * Handle PATCH request to update user profile
 */
async function handleUpdateRequest(req, res, user) {
  try {
    // Get update data from request body
    const { contactId, ...updateData } = req.body;
    
    // Validate required fields
    if (!contactId) {
      return res.status(400).json({
        error: 'Contact ID is required for updates',
      });
    }
    
    // Validate user can only update their own profile
    // This check depends on how your profile records are stored
    const profile = await getUserProfile(null, user.email);
    if (!profile || profile.contactId !== contactId) {
      return res.status(403).json({
        error: 'You can only update your own profile',
      });
    }
    
    // Perform the update
    await updateUserProfile(contactId, mapToAirtableFields(updateData));
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      contactId,
      _meta: {
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      error: 'Failed to update profile',
      message: error.message,
    });
  }
}

/**
 * Map client field names to Airtable field names
 */
function mapToAirtableFields(data) {
  return {
    FirstName: data.firstName,
    LastName: data.lastName,
    // Add other fields as needed
    // Ensure proper validation and mapping for each field
  };
}