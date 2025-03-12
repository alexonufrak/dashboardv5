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

export async function getCompleteUserProfile(auth0User, options = {}) {
  // Check if we're in minimal mode for onboarding
  const isMinimal = options?.minimal === true;
  
  // Initialize all variables that might be used later
  let participationRecords = [];
  let teamRecords = [];
  let educationRecord = null;
  let suggestedInstitution = null;
  let institutionData = null;
  let programData = null;
  let cohorts = [];
  let isUMD = false;
  let relevantCohortIds = [];
    
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
    
    // Fetch all related data in parallel to improve performance
    try {
      // If we're in minimal mode, only fetch the absolutely essential data
      if (isMinimal) {
        console.log("Minimal profile mode - fetching only essential data");
        
        // Only fetch participation records in minimal mode (needed for onboarding check)
        participationRecords = await getParticipationRecords(airtableProfile.contactId);
        
        // Set all other optional data to null/empty
        teamRecords = [];
        educationRecord = null;
        suggestedInstitution = null;
        institutionData = null;
        programData = null;
        cohorts = [];
      } else {
        // Full profile mode - fetch everything in parallel
        const promises = {
          // If there's an education record, fetch it
          educationPromise: airtableProfile.Education && airtableProfile.Education.length > 0 
            ? getEducation(airtableProfile.Education[0]) 
            : Promise.resolve(null),
          
          // Fetch participation data directly using our optimized function
          participationPromise: getParticipationRecords(airtableProfile.contactId),
          
          // Fetch team data directly
          teamsPromise: getUserTeams(airtableProfile.contactId),
          
          // Conditionally try to look up institution by email domain if we have an email
          suggestedInstitutionPromise: auth0User.email
            ? lookupInstitutionByEmail(auth0User.email)
            : Promise.resolve(null)
        };
        
        // Wait for primary data to resolve
        const results = await Promise.all([
          promises.educationPromise,
          promises.participationPromise,
          promises.teamsPromise,
          promises.suggestedInstitutionPromise
        ]);
        
        // Assign results to variables we initialized at the top
        educationRecord = results[0] || null;
        participationRecords = results[1] || [];
        teamRecords = results[2] || [];
        suggestedInstitution = results[3] || null;
        
        console.log("Education Record:", educationRecord);
        console.log(`Found ${participationRecords?.length || 0} participation records`);
        console.log(`Found ${Array.isArray(teamRecords) ? teamRecords.length : (teamRecords ? 1 : 0)} team records`);
        console.log("Suggested Institution:", suggestedInstitution);
      
      }
      
      // Extract unique cohort IDs from participation records (for both minimal and full mode)
      relevantCohortIds = Array.isArray(participationRecords) && participationRecords.length > 0
        ? [...new Set(
            participationRecords
              .filter(p => p && p.cohort && p.cohort.id)
              .map(p => p.cohort.id)
          )]
        : [];
      
      console.log(`Found ${relevantCohortIds.length} unique cohort IDs from participation records`);
      
      // Only continue with secondary data if not in minimal mode
      if (!isMinimal) {
        // Start secondary parallel data fetching
        const secondaryPromises = {};
        
        // Process institution data
        if (educationRecord && educationRecord.Institution && educationRecord.Institution.length > 0) {
          const institutionId = educationRecord.Institution[0];
          secondaryPromises.institutionPromise = getInstitution(institutionId);
        }
      
        // Wait for secondary data to resolve only if we have promises
        if (secondaryPromises.institutionPromise) {
          try {
            institutionData = await secondaryPromises.institutionPromise || null;
            console.log("Institution Data from Education Record:", institutionData);
          } catch (error) {
            console.error("Error fetching institution data:", error);
            institutionData = null;
          }
        }
        
        // Check if institution is UMD  
        if (institutionData && institutionData.Name && 
            (institutionData.Name.includes("University of Maryland") || 
            institutionData.Name.includes("UMD") || 
            institutionData.Name.includes("Maryland"))) {
          isUMD = true;
        } else if (suggestedInstitution && suggestedInstitution.name && 
            (suggestedInstitution.name.includes("University of Maryland") || 
            suggestedInstitution.name.includes("UMD") || 
            suggestedInstitution.name.includes("Maryland"))) {
          isUMD = true;
        }
        
        // Prepare final parallel operations
        const finalPromises = [];
        let cohortsPromise = null;
        let programPromise = null;
      
        // Get the institution ID to use for cohorts (from either education record or email domain)
        const institutionId = institutionData?.id || suggestedInstitution?.id;
        
        // Fetch available cohorts for this institution if we have an ID
        if (institutionId) {
          cohortsPromise = getCohortsByInstitution(institutionId);
          finalPromises.push(cohortsPromise);
        }
        
        // Fetch program (major) details if available and if it's UMD
        if (isUMD && educationRecord && educationRecord.Major && educationRecord.Major.length > 0) {
          const programId = educationRecord.Major[0];
          programPromise = getProgram(programId);
          finalPromises.push(programPromise);
        }
        
        // Wait for all final promises to resolve in parallel if we have any
        if (finalPromises.length > 0) {
          try {
            const finalResults = await Promise.all(finalPromises);
            
            // Assign results if promises were created
            if (cohortsPromise) {
              const cohortIndex = finalPromises.indexOf(cohortsPromise);
              if (cohortIndex >= 0) {
                cohorts = finalResults[cohortIndex] || [];
                console.log("Available Cohorts:", cohorts);
              }
            }
            
            if (programPromise) {
              const programIndex = finalPromises.indexOf(programPromise);
              if (programIndex >= 0) {
                programData = finalResults[programIndex] || null;
                console.log("Program Data:", programData);
              }
            }
          } catch (error) {
            console.error("Error in final data fetching:", error);
          }
        }
      } // End of !isMinimal block
    } catch (error) {
      console.error("Error in parallel data fetching:", error);
    }

    // Process participation data
    const hasActiveParticipation = Array.isArray(participationRecords) && participationRecords.length > 0;
    
    // Determine if any participation is a team initiative
    const hasTeamParticipation = Array.isArray(participationRecords) && 
                               participationRecords.some(p => p && p.isTeamParticipation) || false;
    
    // Extract active initiatives from participation records
    const activeInitiatives = Array.isArray(participationRecords) 
      ? participationRecords
          .filter(p => p && p.initiative)
          .map(p => p.initiative)
          .filter(Boolean) 
      : [];
    
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
      cohorts: cohorts || [],
      
      // Include directly determined properties as recommended in the plan
      hasActiveParticipation,
      hasTeamParticipation,
      isOnboardingComplete: onboardingStatus === "Applied" || hasActiveParticipation,
      
      // Include related data as recommended in the plan
      participations: participationRecords,
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