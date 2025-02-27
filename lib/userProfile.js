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

    console.log("Auth0 User:", auth0User);

    // Fetch additional data from Airtable using email instead of user ID
    const airtableProfile = await getUserProfile(auth0User.sub, auth0User.email)
    console.log("Airtable Profile:", airtableProfile);

    // If Airtable profile doesn't exist, return basic profile
    if (!airtableProfile) {
      return {
        ...basicProfile,
        isProfileComplete: false,
      }
    }

    // Map fields from Airtable to our application's field names
    // Using the field names from your Airtable record
    const completeProfile = {
      ...basicProfile,
      contactId: airtableProfile.contactId,
      firstName: airtableProfile["First Name"] || auth0User.given_name,
      lastName: airtableProfile["Last Name"] || auth0User.family_name,
      degreeType: airtableProfile["Degree Type"] || "",
      major: airtableProfile["Major"] || "",
      graduationYear: airtableProfile["Graduation Year"] || "",
      institution: {
        name: airtableProfile["Institution"] || "Not specified"
      },
      institutionName: airtableProfile["Institution"] || "Not specified",
      // Check if required fields are complete
      isProfileComplete: Boolean(
        airtableProfile["First Name"] &&
        airtableProfile["Last Name"] &&
        airtableProfile["Degree Type"] &&
        airtableProfile["Major"] &&
        airtableProfile["Graduation Year"] &&
        airtableProfile["Institution"]
      ),
    }

    console.log("Mapped Profile:", completeProfile);
    return completeProfile
  } catch (error) {
    console.error("Error in getCompleteUserProfile:", error)
    throw new Error("Failed to fetch complete user profile")
  }
}

export default {
  getCompleteUserProfile,
}