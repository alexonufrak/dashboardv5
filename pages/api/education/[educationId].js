/**
 * API endpoint for managing education records by ID
 * Supports GET and PATCH methods
 */
import { auth0 } from '@/lib/auth0';
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
    
    // Get education ID from route parameter
    const { educationId } = req.query;
    
    if (!educationId) {
      return res.status(400).json({
        error: 'Education ID is required'
      });
    }
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return handleGetRequest(req, res, educationId);
      case 'PATCH':
        return handlePatchRequest(req, res, educationId);
      case 'POST':
        // Support POST with _method=PATCH to handle SameSite cookie issues
        if (req.body && req.body._method?.toUpperCase() === 'PATCH') {
          return handlePatchRequest(req, res, educationId);
        }
        return res.status(405).json({ error: 'Method not allowed' });
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error(`Error in education/[educationId] API:`, error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Handle GET request to fetch a specific education record
 */
async function handleGetRequest(req, res, educationId) {
  try {
    // Fetch the education record
    const education = await getEducation(educationId);
    
    if (!education) {
      return res.status(404).json({
        error: 'Education record not found'
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
 * Handle PATCH request to update a specific education record
 */
async function handlePatchRequest(req, res, educationId) {
  try {
    // Check if education record exists
    const existingEducation = await getEducation(educationId);
    
    if (!existingEducation) {
      return res.status(404).json({
        error: 'Education record not found'
      });
    }
    
    // Extract education data from the request body
    const {
      contactId,
      institutionId,
      institutionName,
      degreeType,
      major,
      majorName,
      graduationYear,
      graduationSemester
    } = req.body;
    
    // Validate required fields
    if (!contactId) {
      return res.status(400).json({
        error: 'Contact ID is required'
      });
    }
    
    // Update the education record
    const updatedEducation = await updateEducation({
      educationId,
      contactId,
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