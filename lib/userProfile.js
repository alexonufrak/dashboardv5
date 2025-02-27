import { getUserProfile, getInstitution, getEducation } from "./airtable"

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
    
    // Get education record if available
    let educationRecord = null;
    if (airtableProfile.Education && airtableProfile.Education.length > 0) {
      const educationId = airtableProfile.Education[0]; // Get the first education record ID
      educationRecord = await getEducation(educationId);
      console.log("Education Record:", educationRecord);
    }

    // Map fields from Airtable to our application's field names
    // Using the field names from your Airtable record
    const completeProfile = {
      ...basicProfile,
      contactId: airtableProfile.contactId,
      firstName: airtableProfile["First Name"] || auth0User.given_name,
      lastName: airtableProfile["Last Name"] || auth0User.family_name,
      
      // Use education data if available, otherwise fallback to contact data
      degreeType: educationRecord?.["Degree Type"] || airtableProfile["Degree Type (from Education)"]?.[0] || "",
      major: educationRecord?.["Major"] || airtableProfile["Major (from Education)"]?.[0] || "",
      graduationYear: educationRecord?.["Graduation Year"] || airtableProfile["Graduation Year (from Education)"]?.[0] || "",
      
      // For institution, prefer the one from the education record
      institution: educationRecord?.["Institution"] ? {
        name: educationRecord["Institution Name"] || "Not specified",
        id: educationRecord["Institution"][0]
      } : {
        name: airtableProfile["Institution (from Education)"]?.[0] || "Not specified"
      },
      
      institutionName: educationRecord?.["Institution Name"] || 
                       airtableProfile["Institution (from Education)"]?.[0] || 
                       "Not specified",
      
      // Include the education record ID
      educationId: educationRecord?.id || airtableProfile.Education?.[0] || null,
      
      // Check if required fields are complete
      isProfileComplete: Boolean(
        airtableProfile["First Name"] &&
        airtableProfile["Last Name"] &&
        (educationRecord?.["Degree Type"] || airtableProfile["Degree Type (from Education)"]?.[0]) &&
        (educationRecord?.["Major"] || airtableProfile["Major (from Education)"]?.[0]) &&
        (educationRecord?.["Graduation Year"] || airtableProfile["Graduation Year (from Education)"]?.[0]) &&
        (educationRecord?.["Institution"] || airtableProfile["Institution (from Education)"]?.[0])
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