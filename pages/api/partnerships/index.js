import { auth0 } from '@/lib/auth0';
import { partnerships } from '@/lib/airtable/entities';

/**
 * API endpoint for partnerships
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
    
    // Handle different HTTP methods
    switch (req.method) {
      case 'POST':
        return handleCreatePartnership(req, res, session.user);
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
 * Handle POST request to create a partnership
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 * @param {object} user - Auth0 user
 */
async function handleCreatePartnership(req, res, user) {
  try {
    // Extract and validate required fields
    const { 
      institutionId,
      initiativeId,
      programId, // For backward compatibility
      cohortIds,
      status,
      partnershipType,
      startDate,
      endDate,
      notes
    } = req.body;
    
    // Either initiativeId or programId must be provided
    const effectiveInitiativeId = initiativeId || programId;
    
    if (!institutionId || !effectiveInitiativeId) {
      return res.status(400).json({ 
        error: "Institution ID and Initiative ID are required" 
      });
    }
    
    // Create the partnership
    const partnership = await partnerships.createPartnership({
      institutionId,
      initiativeId: effectiveInitiativeId,
      cohortIds,
      status,
      partnershipType,
      startDate,
      endDate,
      notes
    });
    
    // Return the created partnership
    return res.status(201).json({
      success: true,
      partnership,
      message: 'Partnership created successfully'
    });
  } catch (error) {
    console.error("Error creating partnership:", error);
    return res.status(500).json({ 
      error: "Failed to create partnership",
      details: error.message
    });
  }
}