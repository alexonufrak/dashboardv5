import { auth0 } from '@/lib/auth0'
import { invalidateAllData } from '@/lib/useDataFetching'

/**
 * API endpoint to invalidate client caches
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
    const { cacheKeys } = req.body
    
    if (!cacheKeys || !Array.isArray(cacheKeys) || cacheKeys.length === 0) {
      return res.status(400).json({ error: 'cacheKeys must be a non-empty array' })
    }
    
    // Return success response
    // The actual cache invalidation happens client-side
    // This endpoint just returns which caches should be invalidated
    return res.status(200).json({
      success: true,
      invalidatedCaches: cacheKeys,
      message: `${cacheKeys.length} cache(s) marked for invalidation`
    })
  } catch (error) {
    console.error('Error in cache invalidation:', error)
    return res.status(500).json({ error: 'Error invalidating cache' })
  }
}