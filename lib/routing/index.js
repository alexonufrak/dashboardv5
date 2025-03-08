/**
 * Centralized routing utilities for the dashboard
 * This provides a single source of truth for all URL construction and navigation
 */

// Base paths for the application
export const ROUTES = {
  // Main dashboard routes
  DASHBOARD: '/dashboard',
  
  // Program routes
  PROGRAM: {
    INDEX: '/program',
    DETAIL: (programId) => `/program/${encodeURIComponent(programId)}`,
    MILESTONES: (programId) => `/program/${encodeURIComponent(programId)}/milestones`,
    TEAM: (programId) => `/program/${encodeURIComponent(programId)}/team`,
    BOUNTIES: (programId) => `/program/${encodeURIComponent(programId)}/bounties`
  },
  
  // User routes
  PROFILE: '/profile',
  
  // Legacy routes (for reference only - should not be used directly)
  LEGACY: {
    DASHBOARD_SHELL: '/dashboard-shell',
    PROGRAM_DASHBOARD: '/program-dashboard',
    PROGRAM_WITH_QUERY: (programId) => `/dashboard?program=${encodeURIComponent(programId)}`
  }
};

/**
 * Get the program ID from the URL (for both new and legacy URL structures)
 * @param {object} router - Next.js router object
 * @returns {string|null} Program ID if found, null otherwise
 */
export function getProgramIdFromUrl(router) {
  // Check for programId in path parameter (new URL structure)
  if (router.query.programId) {
    return router.query.programId;
  }
  
  // Check for program in query parameter (legacy URL structure)
  if (router.query.program) {
    return router.query.program;
  }
  
  // No program ID found
  return null;
}

/**
 * Navigate to a program page
 * @param {object} router - Next.js router object
 * @param {string} programId - Program ID to navigate to
 * @param {object} options - Navigation options
 * @param {boolean} options.shallow - Whether to perform a shallow route update
 * @param {boolean} options.replace - Whether to replace the current history entry
 */
export function navigateToProgram(router, programId, options = {}) {
  const { shallow = true, replace = false, scroll = false } = options;
  const url = ROUTES.PROGRAM.DETAIL(programId);
  
  // Enhanced options for smoother navigation
  const routerOptions = { 
    shallow,   // Don't run getServerSideProps again
    scroll,    // Don't scroll to top
  };
  
  if (replace) {
    router.replace(url, undefined, routerOptions);
  } else {
    router.push(url, undefined, routerOptions);
  }
}

/**
 * Navigate to a specific program section
 * @param {object} router - Next.js router object
 * @param {string} programId - Program ID to navigate to
 * @param {'milestones'|'team'|'bounties'} section - Program section to navigate to
 * @param {object} options - Navigation options
 */
export function navigateToProgramSection(router, programId, section, options = {}) {
  const { shallow = true, replace = false } = options;
  
  let url;
  switch (section) {
    case 'milestones':
      url = ROUTES.PROGRAM.MILESTONES(programId);
      break;
    case 'team':
      url = ROUTES.PROGRAM.TEAM(programId);
      break;
    case 'bounties':
      url = ROUTES.PROGRAM.BOUNTIES(programId);
      break;
    default:
      url = ROUTES.PROGRAM.DETAIL(programId);
  }
  
  if (replace) {
    router.replace(url, undefined, { shallow });
  } else {
    router.push(url, undefined, { shallow });
  }
}

/**
 * Navigate to the dashboard
 * @param {object} router - Next.js router object
 * @param {object} options - Navigation options
 */
export function navigateToDashboard(router, options = {}) {
  const { shallow = true, replace = false, scroll = false } = options;
  
  // Enhanced options for smoother navigation
  const routerOptions = { 
    shallow,   // Don't run getServerSideProps again
    scroll,    // Don't scroll to top
  };
  
  if (replace) {
    router.replace(ROUTES.DASHBOARD, undefined, routerOptions);
  } else {
    router.push(ROUTES.DASHBOARD, undefined, routerOptions);
  }
}

/**
 * Navigate to the profile page
 * @param {object} router - Next.js router object
 * @param {object} options - Navigation options
 */
export function navigateToProfile(router, options = {}) {
  const { shallow = true, replace = false } = options;
  
  if (replace) {
    router.replace(ROUTES.PROFILE, undefined, { shallow });
  } else {
    router.push(ROUTES.PROFILE, undefined, { shallow });
  }
}

/**
 * Check if the current route is a program route
 * @param {object} router - Next.js router object
 * @returns {boolean} True if the current route is a program route
 */
export function isProgramRoute(router) {
  return router.pathname.startsWith('/program/');
}

/**
 * Check if the current route is a specific program section
 * @param {object} router - Next.js router object
 * @param {'milestones'|'team'|'bounties'} section - Program section to check
 * @returns {boolean} True if the current route is the specified program section
 */
export function isProgramSection(router, section) {
  return router.pathname === `/program/[programId]/${section}`;
}