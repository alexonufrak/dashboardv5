/**
 * Enhanced User Profile Module
 * Refactored to use the new domain-driven Airtable integration
 */

// Import entity modules from our new Airtable structure
import { getUserByEmail, getUserByAuth0Id } from '@/lib/airtable/entities/users';
import { getParticipationRecords } from '@/lib/airtable/entities/participation';
import { getTeamById } from '@/lib/airtable/entities/teams';
import { getInstitution, lookupInstitutionByEmail } from '@/lib/airtable/entities/institutions';
import { getEducation } from '@/lib/airtable/entities/education';

/**
 * Get a complete user profile with all related data
 * @param {Object} auth0User - Auth0 user object
 * @param {Object} options - Options for profile fetching
 * @returns {Promise<Object>} Complete user profile
 */
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

    // Fetch Airtable profile using our new module function
    const airtableProfile = await getUserByAuth0Id(auth0User.sub);
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
      // If we're in minimal mode, fetch essential data plus institution/cohort data
      if (isMinimal) {
        console.log("Minimal profile mode with cohort data");
        
        // Run essential queries in parallel
        const [participationData, emailInstitution] = await Promise.all([
          // Fetch participation data (needed for onboarding check)
          getParticipationRecords(airtableProfile.contactId),
          
          // Also get institution data from email (needed for cohorts)
          auth0User.email ? lookupInstitutionByEmail(auth0User.email) : null
        ]);
        
        // Assign results
        participationRecords = participationData || [];
        suggestedInstitution = emailInstitution || null;
        
        // Set other data to null/empty
        teamRecords = [];
        educationRecord = null;
        institutionData = null;
        programData = null;
        
        // Get institution ID from email
        const institutionId = suggestedInstitution?.id;
        
        // We'd need to implement getCohortsByInstitution in the new structure
        // For now, this would be handled by a new entity module
        // cohorts = await getCohortsByInstitution(institutionId);
        cohorts = [];
      } else {
        // Full profile mode - fetch everything in parallel
        // Use our new entity module functions
        const [education, participation, emailInstitution] = await Promise.all([
          // If there's an education record, fetch it
          airtableProfile.Education && airtableProfile.Education.length > 0 
            ? getEducation(airtableProfile.Education[0]) 
            : null,
          
          // Fetch participation data directly using our optimized function
          getParticipationRecords(airtableProfile.contactId),
          
          // Conditionally try to look up institution by email domain if we have an email
          auth0User.email ? lookupInstitutionByEmail(auth0User.email) : null
        ]);
        
        // Assign results to variables
        educationRecord = education;
        participationRecords = participation || [];
        suggestedInstitution = emailInstitution;
        
        console.log("Education Record:", educationRecord);
        console.log(`Found ${participationRecords?.length || 0} participation records`);
        console.log("Suggested Institution:", suggestedInstitution);
        
        // Fetch team data - this requires an additional step with our new structure
        // as we need to extract team IDs from participation records first
        const teamIds = participationRecords
          .filter(p => p.team && p.team.id)
          .map(p => p.team.id);
          
        // Fetch teams in parallel if we have any team IDs
        if (teamIds.length > 0) {
          const uniqueTeamIds = [...new Set(teamIds)];
          const teamPromises = uniqueTeamIds.map(id => getTeamById(id));
          teamRecords = await Promise.all(teamPromises);
        } else {
          teamRecords = [];
        }
        
        console.log(`Found ${teamRecords.length} team records`);
      
        // Extract unique cohort IDs from participation records
        relevantCohortIds = [...new Set(
          participationRecords
            .filter(p => p && p.cohort && p.cohort.id)
            .map(p => p.cohort.id)
        )];
        
        console.log(`Found ${relevantCohortIds.length} unique cohort IDs from participation records`);
        
        // Process institution data
        if (educationRecord && educationRecord.institution && educationRecord.institution.length > 0) {
          const institutionId = educationRecord.institution[0];
          institutionData = await getInstitution(institutionId);
          console.log("Institution Data from Education Record:", institutionData);
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
        
        // For cohorts and program data, we would need additional entity modules
        // which we haven't created yet. These would be handled by:
        // 1. getCohortsByInstitution from a cohorts.js entity module 
        // 2. getProgram from a programs.js entity module
      }
    } catch (error) {
      console.error("Error in parallel data fetching:", error);
    }

    // Process participation data
    const hasActiveParticipation = Array.isArray(participationRecords) && participationRecords.length > 0;
    
    // Determine if any participation is a team initiative
    const hasTeamParticipation = Array.isArray(participationRecords) && 
                               participationRecords.some(p => p && p.isTeamParticipation);
    
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
                           (hasActiveParticipation ? "Applied" : "Registered");

    // Create the complete profile with all the data
    const completeProfile = {
      ...basicProfile,
      ...airtableProfile,
      
      // Include standard profile fields with consistent naming
      contactId: airtableProfile.contactId,
      firstName: airtableProfile.firstName || auth0User.given_name,
      lastName: airtableProfile.lastName || auth0User.family_name,
      
      // Make sure onboarding status is explicitly included
      onboardingStatus: onboardingStatus,
      
      // Include headshot from Airtable if available
      headshot: airtableProfile.Headshot && airtableProfile.Headshot.length > 0 
        ? airtableProfile.Headshot[0].url
        : null,
      
      // Use education data if available, otherwise fallback to contact data
      degreeType: educationRecord?.degreeType || airtableProfile["Degree Type (from Education)"]?.[0] || "",
      
      // For major, use the resolved program name instead of just the ID, but only if it's UMD
      major: isUMD ? (programData?.Major || 
             educationRecord?.majorName || 
             airtableProfile["Major (from Education)"]?.[0] || "") : "",
      
      showMajor: isUMD, // Flag to indicate if we should show the major field
      programId: programData?.id || (educationRecord?.major && educationRecord.major.length > 0 ? educationRecord.major[0] : null) || null,
      
      graduationYear: educationRecord?.graduationYear || airtableProfile["Graduation Year (from Education)"]?.[0] || "",
      
      // For institution, use the resolved institution name instead of just the ID
      // Include both actual institution data and suggested institution from email
      institution: {
        name: institutionData?.Name || // Keep Name capitalized as it comes from Airtable API
              educationRecord?.institutionName || 
              suggestedInstitution?.name || 
              "Not specified",
        id: institutionData?.id || 
            (educationRecord?.institution && Array.isArray(educationRecord.institution) && 
              educationRecord.institution.length > 0 ? educationRecord.institution[0] : null) || 
            suggestedInstitution?.id || 
            null
      },
      
      institutionName: institutionData?.Name || // Keep Name capitalized as it comes from Airtable API
                     educationRecord?.institutionName || 
                     suggestedInstitution?.name || 
                     "Not specified",
      
      // Include suggested institution separately
      suggestedInstitution: !institutionData && suggestedInstitution ? {
        id: suggestedInstitution.id,
        name: suggestedInstitution.name
      } : null,
      
      // Include the education record ID
      educationId: educationRecord?.id || (airtableProfile.Education && airtableProfile.Education.length > 0 ? airtableProfile.Education[0] : null) || null,
      
      // Include available cohorts
      cohorts: cohorts || [],
      
      // Include directly determined properties
      hasActiveParticipation,
      hasTeamParticipation,
      isOnboardingComplete: onboardingStatus === "Applied" || hasActiveParticipation,
      
      // Include related data
      participations: participationRecords,
      teams: formattedTeams,
      relevantCohortIds: relevantCohortIds,
      activeInitiatives,
      
      // Check if required fields are complete with safer null checks
      isProfileComplete: Boolean(
        airtableProfile.firstName &&
        airtableProfile.lastName &&
        (educationRecord?.degreeType || (airtableProfile["Degree Type (from Education)"] && airtableProfile["Degree Type (from Education)"].length > 0)) &&
        (!isUMD || (programData?.Major || educationRecord?.majorName || (airtableProfile["Major (from Education)"] && airtableProfile["Major (from Education)"].length > 0))) &&
        (educationRecord?.graduationYear || (airtableProfile["Graduation Year (from Education)"] && airtableProfile["Graduation Year (from Education)"].length > 0)) &&
        // Add safer institution checks
        ((institutionData?.Name || educationRecord?.institutionName) && 
         (institutionData?.id || (educationRecord?.institution && Array.isArray(educationRecord.institution) && educationRecord.institution.length > 0)))
      ),
      
      // Need to set institution flag if they need to confirm institution
      needsInstitutionConfirm: Boolean(
        !institutionData && 
        !(educationRecord?.institution && Array.isArray(educationRecord.institution) && educationRecord.institution.length > 0) && 
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