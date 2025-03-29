import { auth0 } from '@/lib/auth0'
import { invalidateAllData } from '@/lib/useDataFetching'
import { clearCacheByPattern, clearCacheByType, CACHE_TYPES } from '@/lib/airtable'

/**
 * API endpoint to invalidate client and server caches
 * This is used to trigger cache invalidation without a full page reload
 */
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    // Check if the user is authenticated
    const session = await auth0.getSession(req, res)
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    
    // Get the cache keys to invalidate from the request body
    const { 
      cacheKeys, 
      serverCachePatterns, 
      cacheTypes, 
      clearSubmissions, 
      teamId, 
      milestoneId 
    } = req.body
    
    if (!cacheKeys || !Array.isArray(cacheKeys) || cacheKeys.length === 0) {
      return res.status(400).json({ error: 'cacheKeys must be a non-empty array' })
    }
    
    // Clear server-side cache based on request
    let clearedServerCaches = [];
    let totalClearedEntries = 0;
    
    // NEW: Type-based cache clearing (preferred method)
    if (cacheTypes && Array.isArray(cacheTypes) && cacheTypes.length > 0) {
      for (const type of cacheTypes) {
        // Only allow valid cache types
        if (Object.values(CACHE_TYPES).includes(type)) {
          const clearedCount = clearCacheByType(type);
          totalClearedEntries += clearedCount;
          clearedServerCaches.push(`${type} (${clearedCount} entries)`);
        }
      }
      
      console.log(`Cleared ${totalClearedEntries} cache entries with type-based clearing`);
    }
    
    // Special handling for submissions cache - now using type-based approach
    if (clearSubmissions === true) {
      // First try with the new type-based cache clearing
      const specificId = teamId && milestoneId ? `${teamId}-${milestoneId}` : (teamId || null);
      const clearedCount = clearCacheByType(CACHE_TYPES.SUBMISSIONS, specificId);
      
      if (clearedCount > 0) {
        totalClearedEntries += clearedCount;
        clearedServerCaches.push(`${CACHE_TYPES.SUBMISSIONS} type ${specificId ? `for ID ${specificId}` : '(all)'} (${clearedCount} entries)`);
      } else {
        // Fallback to the old pattern-based approach if no entries were cleared
        // Get the submissions table ID from environment variable
        const submissionsTableId = process.env.AIRTABLE_SUBMISSIONS_TABLE_ID;
        
        if (submissionsTableId) {
          // First try with the more specific pattern including table ID
          const teamDetails = teamId ? { teamId } : null;
          
          // Try multiple patterns to account for different cache key formats
          const patterns = [
            // Most specific: include table ID and batch prefix
            `batch_${submissionsTableId}_`,
            // Less specific: just the table ID
            submissionsTableId,
            // For keys that might include the table ID elsewhere
            `filterByFormula`
          ];
          
          // Try each pattern
          for (const pattern of patterns) {
            const patternClearedCount = clearCacheByPattern(pattern, teamDetails);
            totalClearedEntries += patternClearedCount;
            if (patternClearedCount > 0) {
              clearedServerCaches.push(`${pattern} (${teamId ? `team ${teamId}` : 'all teams'}) - ${patternClearedCount} entries`);
            }
          }
        }
        
        // If we have a team ID but no submissionsTableId, try with just the team ID
        if (!submissionsTableId && teamId) {
          // Try clearing by team ID
          const teamIdClearedCount = clearCacheByPattern(teamId);
          totalClearedEntries += teamIdClearedCount;
          if (teamIdClearedCount > 0) {
            clearedServerCaches.push(`submissions by team ID: ${teamId} - ${teamIdClearedCount} entries`);
          }
        }
      }
    }
    
    // LEGACY: Pattern-based cache clearing (deprecated but maintained for compatibility)
    if (serverCachePatterns && Array.isArray(serverCachePatterns) && serverCachePatterns.length > 0) {
      for (const pattern of serverCachePatterns) {
        // For security, only allow specific patterns
        if (pattern === 'team_submissions_' || 
            pattern === 'submissions_' || 
            pattern === 'milestones_' || 
            pattern === 'batch_') {
          const patternClearedCount = clearCacheByPattern(pattern);
          totalClearedEntries += patternClearedCount;
          if (patternClearedCount > 0) {
            clearedServerCaches.push(`${pattern} - ${patternClearedCount} entries`);
          }
        }
      }
    }
    
    if (clearedServerCaches.length > 0) {
      console.log(`Cleared server-side cache for: ${clearedServerCaches.join(', ')}`);
    }
    
    // Return success response
    // The actual client-side cache invalidation happens in the browser
    // This endpoint handles server-side cache clearing and returns which caches were cleared
    return res.status(200).json({
      success: true,
      invalidatedCaches: cacheKeys,
      clearedServerCaches,
      totalClearedEntries,
      message: `${cacheKeys.length} client cache(s) and ${totalClearedEntries} server cache entries invalidated`
    })
  } catch (error) {
    console.error('Error in cache invalidation:', error)
    return res.status(500).json({ error: 'Error invalidating cache' })
  }
}

export default async function apiHandler(req, res) {
  try {
    // Check for valid Auth0 session
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Call the original handler with the authenticated session
    return handler(req, res);
  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}