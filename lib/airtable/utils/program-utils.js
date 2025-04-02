/**
 * Utility functions for program and initiative handling
 * Helps standardize program-related logic across the application
 */

/**
 * Determines if a program name or type is a team-based program
 * @param {string} programType - Program participation type or name
 * @returns {boolean} True if it's a team-based program
 */
export function isTeamBasedProgram(programType) {
  if (!programType) return false;
  
  const normalizedType = programType.trim().toLowerCase();
  
  return (
    normalizedType === "team" || 
    normalizedType.includes("team") ||
    normalizedType === "teams" ||
    normalizedType === "group" ||
    normalizedType.includes("group") ||
    normalizedType === "collaborative" ||
    normalizedType.includes("collaborative")
  );
}

/**
 * Determines if a program name is an Xperiment program
 * @param {string} programName - Program name
 * @returns {boolean} True if it's an Xperiment program
 */
export function isXperimentProgram(programName) {
  if (!programName) return false;
  
  return programName.toLowerCase().includes('xperiment');
}

/**
 * Determines if a program name is an Xtrapreneurs program
 * @param {string} programName - Program name
 * @returns {boolean} True if it's an Xtrapreneurs program
 */
export function isXtrapreneursProgram(programName) {
  if (!programName) return false;
  
  return programName.toLowerCase().includes('xtrapreneurs');
}

/**
 * Gets the appropriate button text based on program type
 * @param {string} programName - Program name
 * @param {string} participationType - Program participation type
 * @param {string} defaultText - Default button text
 * @returns {string} Button text
 */
export function getActionButtonText(programName, participationType, defaultText = "Join Now") {
  if (!programName && !participationType) return defaultText;
  
  const isXperimentOrTeam = 
    (programName && programName.toLowerCase().includes("xperiment")) || 
    (participationType && isTeamBasedProgram(participationType));
    
  return isXperimentOrTeam ? "Apply Now" : defaultText;
}

/**
 * Determines enrollment type from program properties
 * @param {Object} program - Program object
 * @returns {string} 'Review' or 'Immediate'
 */
export function determineEnrollmentType(program) {
  if (!program) return 'Review';
  
  // Use explicit enrollment type if available
  if (program.enrollmentType) {
    return program.enrollmentType;
  }
  
  // Determine based on program name
  if (isXperimentProgram(program.name)) {
    return 'Review';
  }
  
  // Determine based on participation type
  if (isTeamBasedProgram(program.participationType)) {
    return 'Review';
  }
  
  // Default to 'Immediate' for individual programs
  return 'Immediate';
}

/**
 * Gets the status badge styling based on status
 * @param {string} status - Program status
 * @param {boolean} condensed - Whether in condensed view
 * @returns {string} CSS class for badge
 */
export function getStatusBadgeClass(status, condensed = false) {
  const isOpen = status === "Applications Open" || status === "Open";
  
  if (condensed) {
    return isOpen ? "bg-green-50 text-green-800" : "bg-blue-50 text-blue-800";
  } else {
    return isOpen ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800";
  }
}

/**
 * Gets the participation type badge styling
 * @param {string} participationType - Participation type
 * @returns {string} CSS class for badge
 */
export function getParticipationTypeBadgeClass(participationType) {
  return isTeamBasedProgram(participationType)
    ? "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-800"
    : "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800";
}

export default {
  isTeamBasedProgram,
  isXperimentProgram,
  isXtrapreneursProgram,
  getActionButtonText,
  determineEnrollmentType,
  getStatusBadgeClass,
  getParticipationTypeBadgeClass
};