import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { getAllPrograms } from "../../../lib/airtable";

async function handler(req, res) {
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

export default withApiAuthRequired(handler);