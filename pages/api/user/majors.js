import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { getAllPrograms } from "../../../lib/airtable";

async function handler(req, res) {
  try {
    // Get all majors from Airtable
    const programs = await getAllPrograms();
    
    // Log a sample of the raw programs data
    if (programs.length > 0) {
      console.log("Sample program from Airtable:", {
        id: programs[0].id,
        fields: programs[0].Major || programs[0].name,
        hasValidId: programs[0].id?.startsWith('rec') || false
      });
    }
    
    // Format them for the dropdown
    const formattedPrograms = programs.map(program => {
      // Validate that id is in correct format (starts with "rec")
      if (!program.id || !program.id.startsWith('rec')) {
        console.warn(`Program with invalid ID format: ${JSON.stringify(program)}`);
      }
      
      return {
        id: program.id,
        name: program.Major || program.name || "Unnamed Major"
      };
    });
    
    // Sort alphabetically by name
    formattedPrograms.sort((a, b) => a.name.localeCompare(b.name));
    
    // Log the first few items before sending
    console.log(`Sending ${formattedPrograms.length} majors, first 3:`, 
      formattedPrograms.slice(0, 3).map(p => ({ id: p.id, name: p.name })));
    
    return res.status(200).json({ majors: formattedPrograms });
  } catch (error) {
    console.error("Error fetching majors:", error);
    return res.status(500).json({ error: "Failed to fetch majors" });
  }
}

export default withApiAuthRequired(handler);