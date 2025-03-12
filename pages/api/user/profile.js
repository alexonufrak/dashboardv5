import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0"
import { getCompleteUserProfile } from "../../../lib/userProfile"
import { updateUserProfile } from "../../../lib/airtable"

async function handler(req, res) {
  // Record start time for performance monitoring
  const startTime = Date.now();
  
  const session = await getSession(req, res)
  if (!session || !session.user) {
    return res.status(401).json({ error: "Not authenticated" })
  }

  try {
    if (req.method === "GET") {
      // Fetch the enhanced user profile
      const profile = await getCompleteUserProfile(session.user)
      
      // Calculate processing time
      const processingTime = Date.now() - startTime;
      console.log(`User profile fetched in ${processingTime}ms`);
      
      // Set cache control headers - cache for 5 minutes (300 seconds)
      // Client caching for 1 minute, CDN/edge caching for 5 minutes
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
      
      // Include processing metadata in response
      return res.status(200).json({
        ...profile,
        _meta: {
          processingTime,
          timestamp: new Date().toISOString()
        }
      })
    } else if (req.method === "PUT") {
      const { contactId, ...updateData } = req.body

      if (!contactId) {
        return res.status(400).json({ error: "Contact ID is required for updates" })
      }

      // Check if major ID is valid - it must be an Airtable record ID format or null/undefined
      if (updateData.major !== undefined && updateData.major !== null) {
        if (typeof updateData.major === 'string') {
          // Log the received major value for debugging
          console.log(`Major field received in update: "${updateData.major}" (${typeof updateData.major})`);
          
          // Validate the major field is an Airtable record ID (usually starts with "rec")
          if (!updateData.major.startsWith('rec')) {
            console.warn(`Invalid major ID format received: ${updateData.major}`);
            return res.status(400).json({ 
              error: "Invalid major ID format. Expected record ID but received text value.",
              receivedValue: updateData.major
            });
          }
        } else {
          // If it's not a string or null, it's invalid
          console.warn(`Invalid major field type received: ${typeof updateData.major}`);
          return res.status(400).json({
            error: "Invalid major field type. Expected string record ID or null.",
            receivedType: typeof updateData.major
          });
        }
      } else {
        // Handle explicit null/undefined case (clearing the field)
        console.log("Major field is null or undefined - will be cleared");
      }

      // Map fields to Airtable field names
      const airtableData = {
        FirstName: updateData.firstName,
        LastName: updateData.lastName,
        DegreeType: updateData.degreeType,
        // Use programId (the ID reference) instead of text value for Major
        Major: updateData.major,  // This should be a record ID from the Programs table
        GraduationYear: updateData.graduationYear,
        InstitutionId: updateData.institutionId,
        educationId: updateData.educationId, // Include education record ID for updating
      }
      
      // Debug the data being sent
      console.log("Updating user profile with data:", JSON.stringify(airtableData, null, 2));

      const updatedProfile = await updateUserProfile(contactId, airtableData)
      const completeProfile = await getCompleteUserProfile(session.user)

      return res.status(200).json(completeProfile)
    } else {
      return res.status(405).json({ error: "Method not allowed" })
    }
  } catch (error) {
    console.error("Error in profile API:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export default withApiAuthRequired(handler)

