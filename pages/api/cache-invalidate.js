import { auth0 } from '@/lib/auth0'
import { invalidateAllData } from '@/lib/useDataFetching'
import { clearCacheByPattern } from '@/lib/airtable'

/**
 * API endpoint to invalidate client and server caches
 * This is used to trigger cache invalidation without a full page reload
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    // Check if the user is authenticated
    const session = await auth0.getSession(req)
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    
    // Get the cache keys to invalidate from the request body
    const { cacheKeys, serverCachePatterns } = req.body
    
    if (!cacheKeys || !Array.isArray(cacheKeys) || cacheKeys.length === 0) {
      return res.status(400).json({ error: 'cacheKeys must be a non-empty array' })
    }
    
    // Clear server-side cache if patterns are provided
    let clearedServerCaches = [];
    if (serverCachePatterns && Array.isArray(serverCachePatterns) && serverCachePatterns.length > 0) {
      for (const pattern of serverCachePatterns) {
        // For security, only allow specific patterns
        if (pattern === 'team_submissions_' || 
            pattern === 'submissions_' || 
            pattern === 'milestones_' || 
            pattern === 'batch_') {
          clearCacheByPattern(pattern);
          clearedServerCaches.push(pattern);
        }
      }
      console.log(`Cleared server-side cache for patterns: ${clearedServerCaches.join(', ')}`);
    }
    
    // Return success response
    // The actual client-side cache invalidation happens in the browser
    // This endpoint handles server-side cache clearing and returns which caches were cleared
    return res.status(200).json({
      success: true,
      invalidatedCaches: cacheKeys,
      clearedServerCaches,
      message: `${cacheKeys.length} client cache(s) and ${clearedServerCaches.length} server cache pattern(s) invalidated`
    })
  } catch (error) {
    console.error('Error in cache invalidation:', error)
    return res.status(500).json({ error: 'Error invalidating cache' })
  }
}