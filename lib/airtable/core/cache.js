import { throttleRequests, resetThrottling } from './throttle';

// In-memory cache for server-side
const memoryCache = new Map();

// Cache types for organization
export const CACHE_TYPES = {
  PROFILE: 'profile',
  TEAMS: 'teams',
  PARTICIPATION: 'participation',
  COHORTS: 'cohorts',
  INSTITUTIONS: 'institutions',
  PROGRAMS: 'programs',
  EDUCATION: 'education',
  MAJORS: 'majors',
  SUBMISSIONS: 'submissions',
  MILESTONES: 'milestones',
  // Add more types as needed
};

/**
 * Creates a structured, predictable cache key
 * @param {string} type The entity type (from CACHE_TYPES)
 * @param {string} id The entity ID or identifier
 * @param {Object} params Additional parameters
 * @returns {string} A structured cache key
 */
export function createCacheKey(type, id = null, params = null) {
  // Start with the main type
  let key = type;
  
  // Add ID if provided
  if (id) {
    // Normalize IDs by converting to lowercase and removing special chars
    const normalizedId = typeof id === 'string'
      ? id.toLowerCase().replace(/[^a-z0-9]/g, '_')
      : id;
    
    key += `:${normalizedId}`;
  }
  
  // Add params hash if provided
  if (params) {
    // Create a simple hash for the params
    const paramsStr = JSON.stringify(params);
    const hash = Array.from(paramsStr)
      .reduce((sum, char) => sum + char.charCodeAt(0), 0)
      .toString(16);
    
    key += `:${hash}`;
  }
  
  return key;
}

/**
 * Get cached data or fetch from source
 * @param {string} cacheKey Unique identifier for this query
 * @param {Function} fetchFn Function to execute if cache miss
 * @param {number} ttl Time to live in seconds
 * @param {number} retryCount Number of retry attempts
 * @returns {Promise<any>} The cached or fetched data
 */
export async function getCachedOrFetch(cacheKey, fetchFn, ttl = 300, retryCount = 0) {
  // Check cache first
  const cached = memoryCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    console.log(`Cache hit for key: ${cacheKey}`);
    return cached.data;
  }
  
  // Apply throttling
  await throttleRequests();
  
  // Fetch fresh data
  console.log(`Cache miss for key: ${cacheKey}, fetching from source`);
  
  try {
    const data = await fetchFn();
    
    // Store in cache with metadata
    memoryCache.set(cacheKey, {
      data,
      expiry: Date.now() + (ttl * 1000),
      timestamp: new Date().toISOString(),
      key: cacheKey
    });
    
    return data;
  } catch (error) {
    // Handle rate limit errors with exponential backoff
    if (error.statusCode === 429) {
      // Max 5 retries
      if (retryCount >= 5) {
        console.error('Rate limit (429) retry attempts exhausted');
        throw error;
      }
      
      // Calculate exponential backoff with jitter
      const baseDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, 8s, 16s
      const jitter = Math.random() * 1000; // Add up to 1s of random jitter
      const retryDelay = baseDelay + jitter;
      
      console.warn(`Rate limit hit (429). Retry ${retryCount+1}/5 after ${Math.round(retryDelay/1000)}s delay`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      // Reset throttling timestamps to ensure we don't batch up multiple requests
      resetThrottling();
      
      // Try again with incremented retry count
      return getCachedOrFetch(cacheKey, fetchFn, ttl, retryCount + 1);
    }
    
    // Return stale data if available rather than failing
    if (cached) {
      console.warn(`Returning stale data for ${cacheKey} due to error: ${error.message}`);
      return cached.data;
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Clear cache entries by type and optional ID
 * @param {string} type Cache type from CACHE_TYPES
 * @param {string} id Optional entity ID
 * @returns {number} Number of entries cleared
 */
export function clearCacheByType(type, id = null) {
  console.log(`Clearing cache entries of type: ${type}${id ? ` for ID: ${id}` : ''}`);
  
  const prefix = id ? `${type}:${id}` : type;
  let clearedCount = 0;
  let clearedKeys = [];
  
  // Get all cache keys first to avoid modification during iteration
  const allKeys = [...memoryCache.keys()];
  
  // Find keys that match our prefix
  for (const key of allKeys) {
    if (key.startsWith(prefix)) {
      clearedKeys.push(key);
      memoryCache.delete(key);
      clearedCount++;
    }
  }
  
  console.log(`Cleared ${clearedCount} cache entries of type: ${type}${id ? ` for ID: ${id}` : ''}`);
  return clearedCount;
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
  const now = Date.now();
  let totalEntries = 0;
  let validEntries = 0;
  let expiredEntries = 0;
  let avgTtl = 0;
  let totalSize = 0;
  
  // Count entries by type
  const entriesByType = {};
  
  for (const [key, entry] of memoryCache.entries()) {
    totalEntries++;
    
    // Get the type from the key
    const type = key.split(':')[0];
    entriesByType[type] = (entriesByType[type] || 0) + 1;
    
    // Check if entry is valid
    if (entry.expiry > now) {
      validEntries++;
      avgTtl += (entry.expiry - now) / 1000; // Convert to seconds
    } else {
      expiredEntries++;
    }
    
    // Estimate size (rough approximation)
    totalSize += JSON.stringify(entry.data).length;
  }
  
  // Calculate average TTL
  avgTtl = validEntries > 0 ? avgTtl / validEntries : 0;
  
  return {
    totalEntries,
    validEntries,
    expiredEntries,
    avgTtlSeconds: Math.round(avgTtl),
    sizeBytes: totalSize,
    sizeMb: (totalSize / (1024 * 1024)).toFixed(2),
    entriesByType,
    timestamp: new Date().toISOString()
  };
}

// Export all functions
export default {
  createCacheKey,
  getCachedOrFetch,
  clearCacheByType,
  getCacheStats,
  CACHE_TYPES
};