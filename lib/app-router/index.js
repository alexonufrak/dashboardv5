/**
 * App Router server component data fetching utilities
 * 
 * This file provides a centralized entry point for all server-side
 * data fetching functionality in the App Router architecture.
 */

// Re-export all entity-specific functions
export * from './entities';

// Export base Airtable utilities
export * from './airtable';

/**
 * Helper function to fetch multiple data sources in parallel
 * Use this to prevent request waterfalls in server components
 */
export async function fetchParallelData(fetchFunctions) {
  const results = await Promise.all(
    Object.entries(fetchFunctions).map(async ([key, fetchFn]) => {
      try {
        const result = await fetchFn();
        return [key, result];
      } catch (error) {
        console.error(`Error fetching ${key}:`, error);
        return [key, null];
      }
    })
  );
  
  return Object.fromEntries(results);
}

/**
 * Dashboard data fetching
 * Gets all data needed for the dashboard in a single parallel request
 */
export async function getDashboardData(contactId) {
  return fetchParallelData({
    teams: () => getUserTeams(contactId),
    programs: () => getActivePrograms(),
    events: () => getUpcomingEvents(5),
  });
}