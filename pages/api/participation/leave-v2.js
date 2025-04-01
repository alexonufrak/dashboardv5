import { auth0 } from '@/lib/auth0';
import { getUserByEmail } from '@/lib/airtable/entities/users';
import { leaveParticipation } from '@/lib/leaveOperations.refactored';

/**
 * V2 API endpoint to leave a program participation
 * This demonstrates the refactored Airtable integration
 * @param {object} req - Next.js API request
 * @param {object} res - Next.js API response
 */
export default async function handler(req, res) {
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: "Method not allowed" });
    }
    
    // Get the current session and user using Auth0
    const session = await auth0.getSession(req, res);
    if (!session?.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Get the participation ID from the request body
    const { participationId, cohortId, programId } = req.body;
    
    // Need at least one identifier to leave a program
    if (!participationId && !cohortId && !programId) {
      return res.status(400).json({ 
        error: "At least one of participationId, cohortId, or programId is required" 
      });
    }
    
    // Get the user's contactId from their email
    const userProfile = await getUserByEmail(session.user.email);
    if (!userProfile || !userProfile.contactId) {
      return res.status(404).json({ error: "User profile not found" });
    }
    
    // Use our refactored leaveParticipation function to update the record
    const result = await leaveParticipation(
      userProfile.contactId,
      participationId,
      cohortId,
      programId
    );
    
    // Return the result
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        updatedRecords: result.updatedRecords
      });
    } else {
      return res.status(400).json({ 
        error: result.error || "Failed to leave program" 
      });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}