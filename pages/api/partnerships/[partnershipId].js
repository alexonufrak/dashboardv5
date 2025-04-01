import { auth0 } from '@/lib/auth0';
import { partnerships } from '@/lib/airtable/entities';

/**
 * API endpoint for a specific partnership
 * 
 * Note: In the Airtable schema, "Initiative" is the actual table name for what
 * users often refer to as "Programs" in the UI. We use "initiative" terminology in
 * our internal implementation for consistency with the database schema.
 * 
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 */
export default async function handler(req, res) {
  try {
    // Get the current session and user using Auth0
    const session = await auth0.getSession(req, res);
    if (!session?.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Get partnership ID from URL
    const { partnershipId } = req.query;
    
    if (!partnershipId) {
      return res.status(400).json({ error: "Partnership ID is required" });
    }
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return handleGetPartnership(req, res, partnershipId);
      case 'PATCH':
        return handleUpdatePartnership(req, res, partnershipId, session.user);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(error.status || 500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}

/**
 * Handle GET request to fetch a partnership
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 * @param {string} partnershipId - Partnership ID
 */
async function handleGetPartnership(req, res, partnershipId) {
  try {
    // Fetch the partnership
    const partnership = await partnerships.getPartnershipById(partnershipId);
    
    if (!partnership) {
      return res.status(404).json({ 
        error: "Partnership not found" 
      });
    }
    
    // Return the partnership
    return res.status(200).json({
      success: true,
      partnership
    });
  } catch (error) {
    console.error("Error fetching partnership:", error);
    return res.status(500).json({ 
      error: "Failed to fetch partnership",
      details: error.message
    });
  }
}

/**
 * Handle PATCH request to update a partnership
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 * @param {string} partnershipId - Partnership ID
 * @param {object} user - Auth0 user
 */
async function handleUpdatePartnership(req, res, partnershipId, user) {
  try {
    // Extract update fields from request body
    const { 
      cohortIds,
      status,
      partnershipType,
      startDate,
      endDate,
      notes
    } = req.body;
    
    // Check if partnership exists
    const existingPartnership = await partnerships.getPartnershipById(partnershipId);
    
    if (!existingPartnership) {
      return res.status(404).json({ 
        error: "Partnership not found" 
      });
    }
    
    // Update the partnership
    const updatedPartnership = await partnerships.updatePartnership(partnershipId, {
      cohortIds,
      status,
      partnershipType,
      startDate,
      endDate,
      notes
    });
    
    // Return the updated partnership
    return res.status(200).json({
      success: true,
      partnership: updatedPartnership,
      message: 'Partnership updated successfully'
    });
  } catch (error) {
    console.error("Error updating partnership:", error);
    return res.status(500).json({ 
      error: "Failed to update partnership",
      details: error.message
    });
  }
}