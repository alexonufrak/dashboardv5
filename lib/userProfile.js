import { getUserProfile, getInstitution, getEducation, getMajor } from "./airtable"

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
    let institutionData = null;
    let majorData = null;
    
    if (airtableProfile.Education && airtableProfile.Education.length > 0) {
      const educationId = airtableProfile.Education[0]; // Get the first education record ID
      educationRecord = await getEducation(educationId);
      console.log("Education Record:", educationRecord);
      
      // Fetch institution details if available
      if (educationRecord && educationRecord.Institution && educationRecord.Institution.length > 0) {
        const institutionId = educationRecord.Institution[0];
        institutionData = await getInstitution(institutionId);
        console.log("Institution Data:", institutionData);
      }
      
      // Fetch major details if available
      if (educationRecord && educationRecord.Major && educationRecord.Major.length > 0) {
        const majorId = educationRecord.Major[0];
        majorData = await getMajor(majorId);
        console.log("Major Data:", majorData);
      }
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
      
      // For major, use the resolved major name instead of just the ID
      major: majorData?.Name || 
             educationRecord?.["Major Name"] || 
             airtableProfile["Major (from Education)"]?.[0] || "",
      
      majorId: majorData?.id || educationRecord?.Major?.[0] || null,
      
      graduationYear: educationRecord?.["Graduation Year"] || airtableProfile["Graduation Year (from Education)"]?.[0] || "",
      
      // For institution, use the resolved institution name instead of just the ID
      institution: {
        name: institutionData?.Name || 
              educationRecord?.["Institution Name"] || 
              airtableProfile["Institution (from Education)"]?.[0] || "Not specified",
        id: institutionData?.id || educationRecord?.Institution?.[0] || null
      },
      
      institutionName: institutionData?.Name || 
                       educationRecord?.["Institution Name"] || 
                       airtableProfile["Institution (from Education)"]?.[0] || 
                       "Not specified",
      
      // Include the education record ID
      educationId: educationRecord?.id || airtableProfile.Education?.[0] || null,
      
      // Check if required fields are complete
      isProfileComplete: Boolean(
        airtableProfile["First Name"] &&
        airtableProfile["Last Name"] &&
        (educationRecord?.["Degree Type"] || airtableProfile["Degree Type (from Education)"]?.[0]) &&
        (majorData?.Name || educationRecord?.["Major Name"] || airtableProfile["Major (from Education)"]?.[0]) &&
        (educationRecord?.["Graduation Year"] || airtableProfile["Graduation Year (from Education)"]?.[0]) &&
        (institutionData?.Name || educationRecord?.["Institution Name"] || airtableProfile["Institution (from Education)"]?.[0])
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