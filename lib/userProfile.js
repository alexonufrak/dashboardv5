import { getUserProfile, getInstitution, getEducation, getProgram, getCohortsByInstitution, lookupInstitutionByEmail } from "./airtable"

/**
 * Get a user by email address - used for checking if a user exists
 * @param {string} email - User email address
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUserByEmail(email) {
  try {
    if (!email) return null;
    
    // Normalize the email to lowercase for consistency
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`getUserByEmail: Looking up user with normalized email: ${normalizedEmail}`);
    
    // Use the existing getUserProfile function with null userId
    // It already has logic to search by email
    const user = await getUserProfile(null, normalizedEmail);
    
    console.log(`getUserByEmail result: ${user ? 'User found' : 'No user found'}`);
    if (user) {
      console.log(`Found user with contactId: ${user.contactId}`);
    }
    
    return user;
  } catch (error) {
    console.error("Error in getUserByEmail:", error);
    return null;
  }
}

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
    let suggestedInstitution = null;
    let programData = null;
    let cohorts = [];
    let isUMD = false;
    
    try {
      // First check if there's an existing education record
      if (airtableProfile && airtableProfile.Education && airtableProfile.Education.length > 0) {
        const educationId = airtableProfile.Education[0]; // Get the first education record ID
        educationRecord = await getEducation(educationId);
        console.log("Education Record:", educationRecord);
        
        // Fetch institution details if available in education record
        if (educationRecord && educationRecord.Institution && educationRecord.Institution.length > 0) {
          const institutionId = educationRecord.Institution[0];
          institutionData = await getInstitution(institutionId);
          console.log("Institution Data from Education Record:", institutionData);
          
          // Check if the institution is University of Maryland, College Park
          if (institutionData && institutionData.Name && 
              (institutionData.Name.includes("University of Maryland") || 
               institutionData.Name.includes("UMD") || 
               institutionData.Name.includes("Maryland"))) {
            isUMD = true;
          }
        }
      } 
      // If no institution was found but we have a profile, try to look up by email domain
      if (!institutionData && auth0User.email) {
        console.log("No institution found in records, attempting domain lookup");
        suggestedInstitution = await lookupInstitutionByEmail(auth0User.email);
        console.log("Suggested Institution from Email Domain:", suggestedInstitution);
        
        // If we found an institution from email domain, check if it's UMD
        if (suggestedInstitution && suggestedInstitution.name && 
            (suggestedInstitution.name.includes("University of Maryland") || 
             suggestedInstitution.name.includes("UMD") || 
             suggestedInstitution.name.includes("Maryland"))) {
          isUMD = true;
        }
      }
      
      // Get the institution ID to use for cohorts (from either education record or email domain)
      const institutionId = institutionData?.id || suggestedInstitution?.id;
      
      // Fetch available cohorts for this institution if we have an ID
      if (institutionId) {
        try {
          console.log(`Fetching cohorts for institution: ${institutionId}`);
          cohorts = await getCohortsByInstitution(institutionId);
          console.log("Available Cohorts:", cohorts);
        } catch (error) {
          console.error("Error fetching cohorts:", error);
          cohorts = [];
        }
      } else {
        console.log("No institution ID available to fetch cohorts");
        cohorts = [];
      }
      
      // Fetch program (major) details if available and if it's UMD
      if (isUMD && educationRecord && educationRecord.Major && educationRecord.Major.length > 0) {
        const programId = educationRecord.Major[0];
        try {
          programData = await getProgram(programId);
          console.log("Program Data:", programData);
        } catch (error) {
          console.error("Error fetching program data:", error);
        }
      }
    } catch (error) {
      console.error("Error processing education data:", error);
    }

    // Map fields from Airtable to our application's field names
    // Using the field names from your Airtable record
    const completeProfile = {
      ...basicProfile,
      contactId: airtableProfile.contactId,
      firstName: airtableProfile["First Name"] || auth0User.given_name,
      lastName: airtableProfile["Last Name"] || auth0User.family_name,
      
      // Include headshot from Airtable if available
      Headshot: airtableProfile["Headshot"] && airtableProfile["Headshot"].length > 0 
        ? airtableProfile["Headshot"][0].url
        : null,
      
      // Use education data if available, otherwise fallback to contact data
      degreeType: educationRecord?.["Degree Type"] || airtableProfile["Degree Type (from Education)"]?.[0] || "",
      
      // For major, use the resolved program name instead of just the ID, but only if it's UMD
      major: isUMD ? (programData?.Major || 
             educationRecord?.["Major (from Major)"] || 
             airtableProfile["Major (from Education)"]?.[0] || "") : "",
      
      showMajor: isUMD, // Flag to indicate if we should show the major field
      programId: programData?.id || educationRecord?.Major?.[0] || null,
      
      graduationYear: educationRecord?.["Graduation Year"] || airtableProfile["Graduation Year (from Education)"]?.[0] || "",
      
      // For institution, use the resolved institution name instead of just the ID
      // Include both actual institution data and suggested institution from email
      institution: {
        name: institutionData?.Name || 
              educationRecord?.["Name (from Institution)"]?.[0] || 
              airtableProfile["Institution (from Education)"]?.[0] || 
              suggestedInstitution?.name || "Not specified",
        id: institutionData?.id || 
            educationRecord?.Institution?.[0] || 
            suggestedInstitution?.id || null
      },
      
      institutionName: institutionData?.Name || 
                       educationRecord?.["Name (from Institution)"]?.[0] || 
                       airtableProfile["Institution (from Education)"]?.[0] || 
                       suggestedInstitution?.name || "Not specified",
      
      // Include suggested institution separately
      suggestedInstitution: !institutionData && suggestedInstitution ? {
        id: suggestedInstitution.id,
        name: suggestedInstitution.name
      } : null,
      
      // Include the education record ID
      educationId: educationRecord?.id || airtableProfile.Education?.[0] || null,
      
      // Include available cohorts
      cohorts: cohorts,
      
      // Check if required fields are complete
      isProfileComplete: Boolean(
        airtableProfile["First Name"] &&
        airtableProfile["Last Name"] &&
        (educationRecord?.["Degree Type"] || airtableProfile["Degree Type (from Education)"]?.[0]) &&
        (!isUMD || (programData?.Major || educationRecord?.["Major (from Major)"] || airtableProfile["Major (from Education)"]?.[0])) &&
        (educationRecord?.["Graduation Year"] || airtableProfile["Graduation Year (from Education)"]?.[0]) &&
        ((institutionData?.Name || 
          educationRecord?.["Name (from Institution)"]?.[0] || 
          airtableProfile["Institution (from Education)"]?.[0]) && 
         (institutionData?.id || educationRecord?.Institution?.[0]))
      ),
      
      // Need to set institution flag if they need to confirm institution
      needsInstitutionConfirm: Boolean(
        !institutionData && 
        !educationRecord?.Institution?.[0] && 
        suggestedInstitution
      )
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
  getUserByEmail
}