import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0"
import { getCompleteUserProfile } from "../../../lib/userProfile"
import { updateUserProfile } from "../../../lib/airtable"

async function handler(req, res) {
  const session = await getSession(req, res)
  if (!session || !session.user) {
    return res.status(401).json({ error: "Not authenticated" })
  }

  try {
    if (req.method === "GET") {
      const profile = await getCompleteUserProfile(session.user)
      return res.status(200).json(profile)
    } else if (req.method === "PUT") {
      const { contactId, ...updateData } = req.body

      if (!contactId) {
        return res.status(400).json({ error: "Contact ID is required for updates" })
      }

      // Check if major ID is valid - it must NOT be "Information Science" text
      if (updateData.major && typeof updateData.major === 'string') {
        if (!updateData.major.startsWith('rec')) {
          console.warn(`Invalid major ID format received: ${updateData.major}`);
          return res.status(400).json({ error: "Invalid major ID format. Expected record ID but received text value." });
        }
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

