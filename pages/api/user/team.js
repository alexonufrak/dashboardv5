// pages/api/user/team.js
import { auth0 } from "@/lib/auth0"
import { getCompleteUserProfile } from "../../../lib/userProfile"
import { getUserTeams } from "../../../lib/airtable"

async function handlerImpl(req, res) {
  // Auth0 v4 approach - check session directly instead of using withApiAuthRequired
  const session = await auth0.getSession(req, res)
  if (!session || !session.user) {
    return res.status(401).json({ error: "Not authenticated" })
  }

  try {
    if (req.method === "GET") {
      // First, get the user profile to get the contact ID
      const profile = await getCompleteUserProfile(session.user)
      
      if (!profile || !profile.contactId) {
        return res.status(404).json({ error: "User profile not found or missing contact ID" })
      }
      
      // Get the user's team
      const team = await getUserTeams(profile.contactId)
      
      // Return the team data (or null if no team found)
      return res.status(200).json({ team })
    } else {
      return res.status(405).json({ error: "Method not allowed" })
    }
  } catch (error) {
    console.error("Error in team API:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export default async function handler(req, res) {
  try {
    // Check for valid Auth0 session
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Call the original handler with the authenticated session
    return handlerImpl(req, res);
  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}