import { 
  getUserProfile, 
  getInstitution, 
  getEducation, 
  getProgram, 
  getCohortsByInstitution, 
  lookupInstitutionByEmail,
  getParticipationRecords,
  getUserTeams
} from "./airtable"

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

    // Fetch Airtable profile (existing)
    const airtableProfile = await getUserProfile(auth0User.sub, auth0User.email)
    console.log("Airtable Profile:", airtableProfile);

    // If Airtable profile doesn't exist, return basic profile
    if (!airtableProfile) {
      return {
        ...basicProfile,
        isProfileComplete: false,
      }
    }
    
    // NEW: Fetch participation, team data, and other related data in parallel
    // This follows the recommendation to reduce waterfall requests
    const fetchPromises = {
      // If there's an education record, fetch it
      educationPromise: airtableProfile.Education && airtableProfile.Education.length > 0 
        ? getEducation(airtableProfile.Education[0]) 
        : Promise.resolve(null),
      
      // Fetch participation data directly using our optimized function
      participationPromise: getParticipationRecords(airtableProfile.contactId),
      
      // Fetch team data directly
      teamsPromise: getUserTeams(airtableProfile.contactId)
    };
    
    // Wait for all promises to resolve
    const [educationRecord, participationRecords, teamRecords] = await Promise.all([
      fetchPromises.educationPromise,
      fetchPromises.participationPromise,
      fetchPromises.teamsPromise
    ]);
    
    console.log("Education Record:", educationRecord);
    console.log(`Found ${participationRecords?.length || 0} participation records`);
    console.log(`Found ${Array.isArray(teamRecords) ? teamRecords.length : (teamRecords ? 1 : 0)} team records`);
    
    // For milestone handling, we'll include the cohort IDs rather than fetching milestones directly
    // This follows the idea of providing enough data for components to fetch what they need
    // without doing excessive prefetching that might not be used
    const relevantCohortIds = participationRecords && participationRecords.length > 0
      ? [...new Set(
          participationRecords
            .filter(p => p.cohort && p.cohort.id)
            .map(p => p.cohort.id)
        )]
      : [];
    
    console.log(`Found ${relevantCohortIds.length} unique cohort IDs from participation records`);
    
    // We'll attach these to the profile so components can fetch milestones as needed
    // This is a compromise between complete prefetching and on-demand loading
    
    // Additional data variables
    let institutionData = null;
    let suggestedInstitution = null;
    let programData = null;
    let cohorts = [];
    let isUMD = false;
    
    try {
      // Process institution data
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

    // Process participation data
    const hasActiveParticipation = participationRecords && participationRecords.length > 0;
    
    // Determine if any participation is a team initiative
    const hasTeamParticipation = participationRecords?.some(p => p.isTeamParticipation) || false;
    
    // Extract active initiatives from participation records
    const activeInitiatives = participationRecords?.map(p => p.initiative).filter(Boolean) || [];
    
    // Format team data
    const formattedTeams = Array.isArray(teamRecords) 
      ? teamRecords 
      : (teamRecords ? [teamRecords] : []);

    // Determine onboarding status - prefer profile value, fall back to participation-based detection
    const onboardingStatus = airtableProfile.onboardingStatus || 
                             airtableProfile.Onboarding ||
                             (hasActiveParticipation ? "Applied" : "Registered");

    // Create the complete profile with all the data, following the plan's recommendations
    const completeProfile = {
      ...basicProfile,
      ...airtableProfile,
      
      // Include standard profile fields with consistent naming
      contactId: airtableProfile.contactId,
      firstName: airtableProfile["First Name"] || auth0User.given_name,
      lastName: airtableProfile["Last Name"] || auth0User.family_name,
      
      // Make sure onboarding status is explicitly included
      Onboarding: onboardingStatus,
      onboardingStatus: onboardingStatus,
      
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
      
      // Include directly determined properties as recommended in the plan
      hasActiveParticipation,
      hasTeamParticipation,
      isOnboardingComplete: onboardingStatus === "Applied" || hasActiveParticipation,
      
      // Include related data as recommended in the plan
      participations: participationRecords || [],
      teams: formattedTeams,
      relevantCohortIds: relevantCohortIds,
      activeInitiatives,
      
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
      ),
      
      // Add timestamp for caching and debugging
      lastUpdated: new Date().toISOString()
    }

    console.log("Enhanced Complete Profile:", completeProfile);
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