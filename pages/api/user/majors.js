import { auth0 } from "@/lib/auth0";
import { getAllPrograms } from "../../../lib/airtable";

export default async function handler(req, res) {
  // Check authentication using Auth0 v4 approach
  const session = await auth0.getSession(req);
  if (!session || !session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    // Get all majors from Airtable
    const programs = await getAllPrograms();
    
    // Format for the dropdown (using the already validated and filtered results)
    const formattedPrograms = programs.map(program => ({
      id: program.id,
      name: program.name || "Unnamed Major"
    }));
    
    // Sort alphabetically by name
    formattedPrograms.sort((a, b) => a.name.localeCompare(b.name));
    
    return res.status(200).json({ majors: formattedPrograms });
  } catch (error) {
    console.error("Error fetching majors:", error);
    return res.status(500).json({ error: "Failed to fetch majors" });
  }
}