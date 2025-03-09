/**
 * Utility function to clean and standardize team data
 * @param {Object} baseTeamData - Raw team data from API or context
 * @returns {Object} - Cleaned team data with proper structure
 */
export function cleanTeamData(baseTeamData) {
  if (!baseTeamData) return null;
  
  return {
    ...baseTeamData,
    // Ensure members is an array
    members: Array.isArray(baseTeamData.members) ? baseTeamData.members : [],
    // Clean points - convert to number and remove any trailing characters
    points: baseTeamData.points ? parseInt(String(baseTeamData.points).replace(/[^0-9]/g, ''), 10) || 0 : 0
  };
}

/**
 * Utility function to check if a program error is a "not participating" error
 * @param {string} error - Error message
 * @returns {boolean} - Whether the error is a "not participating" error
 */
export function isNotParticipatingError(error) {
  if (!error) return false;
  
  return error.includes("not currently participating") || 
         error.includes("No active program");
}

/**
 * Utility function to determine if a program is team-based
 * @param {Object} activeProgramData - Active program data
 * @param {string} programParticipationType - Participation type from context
 * @param {Object} teamData - Team data from context
 * @returns {boolean} - Whether the program is team-based
 */
export function isTeamBasedProgram(activeProgramData, programParticipationType, teamData) {
  return activeProgramData?.isTeamBased || 
         programParticipationType === "Team" || 
         teamData !== null;
}