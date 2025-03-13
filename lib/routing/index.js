/**
 * Centralized routing utilities for the dashboard
 * This provides a single source of truth for all URL construction and navigation
 */

// Base paths for the application
export const ROUTES = {
  // Main dashboard routes
  DASHBOARD: '/dashboard',
  PROGRAMS: '/dashboard/programs',
  
  // Program routes
  PROGRAM: {
    INDEX: '/dashboard/program',
    DETAIL: (programId) => `/dashboard/program/${encodeURIComponent(programId)}`,
    MILESTONES: (programId) => `/dashboard/program/${encodeURIComponent(programId)}/milestones`,
    TEAM: (programId) => `/dashboard/program/${encodeURIComponent(programId)}/team`,
    BOUNTIES: (programId) => `/dashboard/program/${encodeURIComponent(programId)}/bounties`,
    APPLY: (programId, cohortId) => `/dashboard/program/${encodeURIComponent(programId)}/apply/${encodeURIComponent(cohortId)}`,
    // Human-friendly URLs with slugs
    SLUG: (programId, slug) => `/dashboard/program/${encodeURIComponent(programId)}/${encodeURIComponent(slug || 'details')}`,
    SLUG_MILESTONES: (programId, slug) => `/dashboard/program/${encodeURIComponent(programId)}/${encodeURIComponent(slug || 'details')}/milestones`,
    SLUG_TEAM: (programId, slug) => `/dashboard/program/${encodeURIComponent(programId)}/${encodeURIComponent(slug || 'details')}/team`,
    SLUG_BOUNTIES: (programId, slug) => `/dashboard/program/${encodeURIComponent(programId)}/${encodeURIComponent(slug || 'details')}/bounties`,
    SLUG_APPLY: (programId, slug, cohortId) => `/dashboard/program/${encodeURIComponent(programId)}/${encodeURIComponent(slug || 'details')}/apply/${encodeURIComponent(cohortId)}`
  },
  
  // User routes
  PROFILE: '/profile',
  
  // Legacy routes (for reference only - should not be used directly)
  LEGACY: {
    DASHBOARD: '/dashboard',
    PROGRAM: {
      DETAIL: (programId) => `/program/${encodeURIComponent(programId)}`,
    },
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
 * Navigate to a program page, using a slug version of the initiative name if available
 * @param {object} router - Next.js router object
 * @param {string} programId - Program ID to navigate to
 * @param {object} options - Navigation options
 * @param {boolean} options.shallow - Whether to perform a shallow route update
 * @param {boolean} options.replace - Whether to replace the current history entry
 * @param {string} options.initiativeName - Optional initiative name to create a slug
 */
export function navigateToProgram(router, programId, options = {}) {
  const { shallow = true, replace = false, scroll = false, initiativeName = null } = options;
  
  // Create a URL with a slug if initiative name is provided
  let url;
  if (initiativeName) {
    // Create a slug from the initiative name
    const slug = initiativeName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
      
    url = ROUTES.PROGRAM.SLUG(programId, slug);
  } else {
    // Use the default URL if no initiative name is provided
    url = ROUTES.PROGRAM.DETAIL(programId);
  }
  
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
 * Navigate to a specific program section, using a slug version of the initiative name if available
 * @param {object} router - Next.js router object
 * @param {string} programId - Program ID to navigate to
 * @param {'milestones'|'team'|'bounties'|'apply'} section - Program section to navigate to
 * @param {object} options - Navigation options
 * @param {boolean} options.shallow - Whether to perform a shallow route update
 * @param {boolean} options.replace - Whether to replace the current history entry
 * @param {string} options.initiativeName - Optional initiative name to create a slug
 * @param {string} options.cohortId - Required for 'apply' section
 */
export function navigateToProgramSection(router, programId, section, options = {}) {
  const { shallow = true, replace = false, initiativeName = null, cohortId = null } = options;
  
  // Create a slug if initiative name is provided
  const slug = initiativeName ? 
    initiativeName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 
    null;
  
  let url;
  switch (section) {
    case 'milestones':
      url = slug ? 
        ROUTES.PROGRAM.SLUG_MILESTONES(programId, slug) : 
        ROUTES.PROGRAM.MILESTONES(programId);
      break;
    case 'team':
      url = slug ? 
        ROUTES.PROGRAM.SLUG_TEAM(programId, slug) : 
        ROUTES.PROGRAM.TEAM(programId);
      break;
    case 'bounties':
      url = slug ? 
        ROUTES.PROGRAM.SLUG_BOUNTIES(programId, slug) : 
        ROUTES.PROGRAM.BOUNTIES(programId);
      break;
    case 'apply':
      if (!cohortId) {
        console.error('cohortId is required for applying to a program');
        return;
      }
      url = slug ? 
        ROUTES.PROGRAM.SLUG_APPLY(programId, slug, cohortId) : 
        ROUTES.PROGRAM.APPLY(programId, cohortId);
      break;
    default:
      url = slug ? 
        ROUTES.PROGRAM.SLUG(programId, slug) : 
        ROUTES.PROGRAM.DETAIL(programId);
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
 * Navigate to the programs page
 * @param {object} router - Next.js router object
 * @param {object} options - Navigation options
 */
export function navigateToPrograms(router, options = {}) {
  const { shallow = true, replace = false, scroll = false } = options;
  
  // Enhanced options for smoother navigation
  const routerOptions = { 
    shallow,   // Don't run getServerSideProps again
    scroll,    // Don't scroll to top
  };
  
  if (replace) {
    router.replace(ROUTES.PROGRAMS, undefined, routerOptions);
  } else {
    router.push(ROUTES.PROGRAMS, undefined, routerOptions);
  }
}

/**
 * Check if the current route is a program route
 * @param {object} router - Next.js router object
 * @returns {boolean} True if the current route is a program route
 */
export function isProgramRoute(router) {
  return router.pathname.startsWith('/program/') || 
         router.pathname.startsWith('/dashboard/program/');
}

/**
 * Check if the current route is a specific program section
 * @param {object} router - Next.js router object
 * @param {'milestones'|'team'|'bounties'|'apply'} section - Program section to check
 * @returns {boolean} True if the current route is the specified program section
 */
export function isProgramSection(router, section) {
  return router.pathname === `/program/[programId]/${section}` || 
         router.pathname === `/dashboard/program/[programId]/${section}` ||
         (section === 'apply' && 
          (router.pathname === `/program/[programId]/apply/[cohortId]` || 
           router.pathname === `/dashboard/program/[programId]/apply/[cohortId]`));
}

/**
 * Navigate to the program application page
 * @param {object} router - Next.js router object
 * @param {string} programId - Program ID to navigate to
 * @param {string} cohortId - Cohort ID for the application
 * @param {object} options - Navigation options
 * @param {boolean} options.shallow - Whether to perform a shallow route update
 * @param {boolean} options.replace - Whether to replace the current history entry
 * @param {string} options.initiativeName - Optional initiative name to create a slug
 */
export function navigateToProgramApplication(router, programId, cohortId, options = {}) {
  const { shallow = false, replace = false, initiativeName = null } = options;
  
  if (!cohortId) {
    console.error('cohortId is required for navigating to a program application');
    return;
  }
  
  navigateToProgramSection(router, programId, 'apply', { 
    shallow, 
    replace, 
    initiativeName,
    cohortId
  });
}