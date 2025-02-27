import { getUserProfile, getInstitution } from "./airtable"

export async function getCompleteUserProfile(auth0User) {
  try {
    // Extract basic profile data from Auth0
    const basicProfile = {
      auth0Id: auth0User.sub,
      email: auth0User.email,
      name: auth0User.name,
      picture: auth0User.picture,
    }

    // Fetch additional data from Airtable
    const airtableProfile = await getUserProfile(auth0User.sub)

    // If Airtable profile doesn't exist, return basic profile
    if (!airtableProfile) {
      return {
        ...basicProfile,
        isProfileComplete: false,
      }
    }

    // Fetch institution data if available
    let institutionData = null
    if (airtableProfile.InstitutionId) {
      institutionData = await getInstitution(airtableProfile.InstitutionId)
    }

    // Combine data into a complete profile object
    const completeProfile = {
      ...basicProfile,
      contactId: airtableProfile.id,
      firstName: airtableProfile.FirstName || auth0User.given_name,
      lastName: airtableProfile.LastName || auth0User.family_name,
      degreeType: airtableProfile.DegreeType,
      major: airtableProfile.Major,
      graduationYear: airtableProfile.GraduationYear,
      institution: institutionData
        ? {
            id: institutionData.id,
            name: institutionData.Name,
            type: institutionData.Type,
          }
        : null,
      isProfileComplete: Boolean(
        airtableProfile.FirstName &&
          airtableProfile.LastName &&
          airtableProfile.DegreeType &&
          airtableProfile.Major &&
          airtableProfile.GraduationYear &&
          airtableProfile.InstitutionId,
      ),
    }

    return completeProfile
  } catch (error) {
    console.error("Error in getCompleteUserProfile:", error)
    throw new Error("Failed to fetch complete user profile")
  }
}

export default {
  getCompleteUserProfile,
}

