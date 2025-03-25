# xFoundry Dashboard Data Fetching & Caching Architecture

## Overview

This document outlines the comprehensive data fetching and caching architecture implemented in the xFoundry Dashboard application. The system integrates Next.js with Airtable as the primary data source, utilizing multiple caching layers to optimize performance, reduce API calls, and provide a responsive user experience.

## Architecture Layers

The data architecture consists of the following layers:

1. **Primary Data Source**: Airtable tables & records
2. **Server-Side Memory Cache**: Node.js in-memory Map for API responses
3. **Client-Side React Query Cache**: Browser-side data management
4. **HTTP Cache Layer**: Cache-Control headers for CDN and browser caching
5. **Component-Level State**: React state for UI rendering

```
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │     │                   │
│ React Components  │◄────┤  React Query      │◄────┤  Next.js API      │
│ (UI Layer)        │     │  (Client Cache)   │     │  (Server Layer)   │
│                   │     │                   │     │                   │
└───────────────────┘     └───────────────────┘     └──────────┬────────┘
                                                               │
                                                               ▼
                                                    ┌───────────────────┐
                                                    │                   │
                                                    │  Memory Cache     │
                                                    │  (Server Cache)   │
                                                    │                   │
                                                    └──────────┬────────┘
                                                               │
                                                               ▼
                                                    ┌───────────────────┐
                                                    │                   │
                                                    │     Airtable      │
                                                    │   (Data Source)   │
                                                    │                   │
                                                    └───────────────────┘
```

## Primary Data Source: Airtable

### Tables & Structure

- **Teams**: User team information and relationships
- **Milestones**: Program milestones and requirements
- **Submissions**: User-submitted work for milestone completion
- **Profiles**: User profile information
- **Programs**: Available programs and details
- **Cohorts**: Program cohort groupings

### Data Relationships

- Teams belong to Programs via Cohorts
- Users belong to Teams
- Submissions are linked to Teams and Milestones
- Programs contain Milestones
- Users have Profiles with related metadata

### Access Patterns

```javascript
// Key Airtable queries in /lib/airtable.js
// Table IDs are stored in environment variables
const teamsTable = base(process.env.AIRTABLE_TEAMS_TABLE_ID);
const submissionsTable = base(process.env.AIRTABLE_SUBMISSIONS_TABLE_ID);
const milestonesTable = base(process.env.AIRTABLE_MILESTONES_TABLE_ID);
```

## Server-Side Memory Cache

### Implementation

The server implements an in-memory caching system using a JavaScript Map:

```javascript
// In /lib/airtable.js
const memoryCache = new Map();

// Cache key registry for easier management and invalidation
export const CACHE_TYPES = {
  SUBMISSIONS: 'submissions',
  TEAMS: 'teams',
  MILESTONES: 'milestones',
  USER: 'user',
  GENERAL: 'general'
};
```

### Cache Key Structure

We use a structured cache key system for predictable cache management:

```javascript
// In /lib/airtable.js
export const createCacheKey = (type, id = null, params = null) => {
  // Start with the main type
  let key = type;
  
  // Add ID if provided
  if (id) {
    key += `:${id}`;
  }
  
  // Add params hash if provided
  if (params) {
    // Create a simple hash for the params
    const paramsStr = JSON.stringify(params);
    // Use a simple hash function for the params
    const hash = Array.from(paramsStr)
      .reduce((sum, char) => sum + char.charCodeAt(0), 0)
      .toString(16);
    
    key += `:${hash}`;
  }
  
  return key;
};
```

### Cache Operations

#### Get Cached or Fetch

```javascript
// In /lib/airtable.js
export const getCachedOrFetch = async (cacheKey, fetchFn, ttl = 300, retryCount = 0) => {
  // Check if data exists in cache and is not expired
  const cachedData = memoryCache.get(cacheKey);
  
  if (cachedData && cachedData.expiresAt > Date.now()) {
    return cachedData.data;
  }
  
  // If not in cache or expired, fetch fresh data
  try {
    const freshData = await fetchFn();
    
    // Cache the fresh data with expiration time
    memoryCache.set(cacheKey, {
      data: freshData,
      expiresAt: Date.now() + (ttl * 1000) // TTL in seconds
    });
    
    return freshData;
  } catch (error) {
    // Handle rate limiting with retries
    if (error.statusCode === 429 && retryCount < 3) {
      // Exponential backoff for retries
      const backoffMs = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      
      // Retry with incremented retry count
      return getCachedOrFetch(cacheKey, fetchFn, ttl, retryCount + 1);
    }
    
    throw error;
  }
};
```

#### Clear Cache by Type

```javascript
// In /lib/airtable.js
export const clearCacheByType = (type, id = null) => {
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
};
```

#### Legacy Pattern-Based Cache Clearing

```javascript
// In /lib/airtable.js - maintained for backward compatibility
export const clearCacheByPattern = (keyPattern, details = null) => {
  console.log(`[DEPRECATED] Using pattern-based cache clearing: ${keyPattern}`);
  let clearedCount = 0;
  
  // Get all cache keys first to avoid modification during iteration
  const allKeys = [...memoryCache.keys()];
  
  // Handle team-specific clearing if details provided
  if (details && details.teamId) {
    for (const key of allKeys) {
      if (key.includes(keyPattern) && key.includes(details.teamId)) {
        memoryCache.delete(key);
        clearedCount++;
      }
    }
  } else {
    for (const key of allKeys) {
      if (key.includes(keyPattern)) {
        memoryCache.delete(key);
        clearedCount++;
      }
    }
  }
  
  console.log(`Cleared ${clearedCount} cache entries matching pattern: ${keyPattern}`);
  return clearedCount;
};
```

### Batch Record Fetching

The system includes a batch fetching mechanism with built-in caching, pagination, and rate limiting:

```javascript
// In /lib/airtable.js
export const batchFetchRecords = async (tableId, options, cacheTypeOverride = null, entityIdOverride = null, forceRefresh = false) => {
  // Determine cache type and entity ID
  let cacheType = cacheTypeOverride || CACHE_TYPES.GENERAL;
  
  // Generate cache key
  const cacheKey = createCacheKey(cacheType, entityIdOverride, options);
  
  // Check cache or fetch with pagination
  if (!forceRefresh) {
    const cachedRecords = memoryCache.get(cacheKey);
    if (cachedRecords && cachedRecords.expiresAt > Date.now()) {
      return cachedRecords.data;
    }
  }
  
  // Implement rate limiting
  await throttleRequest();
  
  // Initialize table and fetch with pagination
  const records = [];
  const table = base(tableId);
  
  try {
    await table.select(options).eachPage((pageRecords, fetchNextPage) => {
      records.push(...pageRecords);
      fetchNextPage();
    });
    
    // Cache the results
    memoryCache.set(cacheKey, {
      data: records,
      expiresAt: Date.now() + (300 * 1000) // 5 minute TTL
    });
    
    return records;
  } catch (error) {
    console.error(`Error batch fetching records from ${tableId}:`, error);
    throw error;
  }
};
```

### Rate Limiting Management

The system implements rate limiting to adhere to Airtable's API constraints:

```javascript
// In /lib/airtable.js
let requestTimestamps = [];
const MAX_REQUESTS_PER_SECOND = 5;

// Throttle requests to stay within Airtable's rate limits
const throttleRequest = async () => {
  const now = Date.now();
  
  // Remove timestamps older than 1 second
  requestTimestamps = requestTimestamps.filter(time => now - time < 1000);
  
  // If we've hit the rate limit, wait
  if (requestTimestamps.length >= MAX_REQUESTS_PER_SECOND) {
    const oldestRequest = Math.min(...requestTimestamps);
    const timeToWait = 1000 - (now - oldestRequest);
    
    if (timeToWait > 0) {
      await new Promise(resolve => setTimeout(resolve, timeToWait));
    }
  }
  
  // Add current request timestamp
  requestTimestamps.push(Date.now());
};
```

## Client-Side React Query Cache

### Custom Hooks

The application uses React Query for client-side data management through custom hooks:

```javascript
// In /lib/useDataFetching.js
export function useTeamSubmissions(teamId, milestoneId) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['submissions', teamId, milestoneId],
    queryFn: async ({ signal }) => {
      // Skip if missing required teamId
      if (!teamId) {
        return { submissions: [] };
      }
      
      // Create URL with milestone filter if provided
      const url = `/api/teams/${teamId}/submissions${milestoneId ? `?milestoneId=${milestoneId}` : ''}`;
      
      try {
        // Make API call with AbortController signal
        const response = await fetch(url, { signal });
        
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || 10;
          console.warn(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
          
          // Return cached data if available
          const cachedData = queryClient.getQueryData(['submissions', teamId, milestoneId]);
          if (cachedData) {
            return cachedData;
          }
          
          throw new Error('Rate limit (429) exceeded');
        }
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        
        // Optimize cache population for milestone-specific queries
        if (!milestoneId && data.submissions && data.submissions.length > 0) {
          // Group submissions by milestone
          const submissionsByMilestone = {};
          
          data.submissions.forEach(submission => {
            if (submission.milestoneId) {
              if (!submissionsByMilestone[submission.milestoneId]) {
                submissionsByMilestone[submission.milestoneId] = [];
              }
              submissionsByMilestone[submission.milestoneId].push(submission);
            }
          });
          
          // Update cache for each milestone's submissions
          Object.entries(submissionsByMilestone).forEach(([mId, submissions]) => {
            queryClient.setQueryData(['submissions', teamId, mId], {
              submissions,
              meta: {
                ...data.meta,
                count: submissions.length,
                filters: {
                  teamId,
                  milestoneId: mId
                }
              }
            });
          });
        }
        
        return data;
      } catch (error) {
        // Handle errors and provide fallbacks
        if (error.name === 'AbortError') {
          throw error;
        }
        
        console.error('Error fetching submissions:', error);
        
        // Return cached data on error if available
        const cachedData = queryClient.getQueryData(['submissions', teamId, milestoneId]);
        if (cachedData) {
          return {
            ...cachedData,
            meta: {
              ...(cachedData.meta || {}),
              stale: true,
              error: true
            }
          };
        }
        
        return { submissions: [] };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes before background refresh
    gcTime: 60 * 60 * 1000, // 1 hour garbage collection time
    enabled: !!teamId,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      if (error?.message?.includes('429')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
}
```

### Other Data Fetching Hooks

```javascript
// Additional hooks in /lib/useDataFetching.js
export function useProfileData() {...}
export function useTeamsData() {...}
export function useProgramData() {...}
export function useMilestoneData(cohortId) {...}
export function useTeamCohorts(teamId) {...}
export function useMajors() {...}
```

### Cache Invalidation

```javascript
// Global cache invalidation function
export function invalidateAllData(queryClient) {
  queryClient.invalidateQueries({ queryKey: ['profile'] });
  queryClient.invalidateQueries({ queryKey: ['teams'] });
  queryClient.invalidateQueries({ queryKey: ['applications'] });
  queryClient.invalidateQueries({ queryKey: ['participation'] });
  queryClient.invalidateQueries({ queryKey: ['milestones'] });
  queryClient.invalidateQueries({ queryKey: ['submissions'] });
  queryClient.invalidateQueries({ queryKey: ['teamCohorts'] });
  queryClient.invalidateQueries({ queryKey: ['majors'] });
  queryClient.invalidateQueries({ queryKey: ['userMetadata'] });
  queryClient.invalidateQueries({ queryKey: ['pointTransactions'] });
  queryClient.invalidateQueries({ queryKey: ['achievements'] });
  queryClient.invalidateQueries({ queryKey: ['rewards'] });
  queryClient.invalidateQueries({ queryKey: ['claimedRewards'] });
}
```

## API Routes & Endpoints

### Submissions API

```javascript
// In /pages/api/teams/[teamId]/submissions.js
export default async function handler(req, res) {
  try {
    // Get team ID and milestone ID from the query
    const { teamId, milestoneId } = req.query;
    
    // Validate and construct query formula
    let formula;
    if (milestoneId) {
      formula = `AND(
        FIND("${teamId}", {teamId}),
        FIND("${milestoneId}", {milestoneId})
      )`;
    } else {
      formula = `FIND("${teamId}", {teamId})`;
    }
    
    // Use structured cache key system
    const records = await batchFetchRecords(
      submissionsTableId, 
      {
        filterByFormula: formula,
        fields: [
          'teamId', 'milestoneId', 'Team', 'Milestone', 
          'Comments', 'Link', 'Attachment', 'Created Time', 
          'Name (from Milestone)'
        ],
        sort: [{ field: "Created Time", direction: "desc" }]
      },
      // Pass cache type and ID for structured caching
      CACHE_TYPES.SUBMISSIONS,
      milestoneId ? `${teamId}-${milestoneId}` : teamId
    );
    
    // Map and transform records
    const submissions = records.map(record => ({
      id: record.id,
      teamId: teamId,
      teamIds: record.fields.Team || [teamId],
      milestoneId: record.fields.Milestone?.[0] || null,
      milestoneName: record.fields["Name (from Milestone)"]?.[0] || null,
      createdTime: record.fields["Created Time"] || new Date().toISOString(),
      attachments: record.fields.Attachment?.map(file => ({
        id: file.id,
        url: file.url,
        filename: file.filename,
        size: file.size,
        type: file.type,
        thumbnails: file.thumbnails
      })) || [],
      comments: record.fields.Comments,
      link: record.fields.Link
    }));
    
    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=1800');
    
    // Return the submissions with metadata
    return res.status(200).json({
      submissions,
      meta: {
        count: submissions.length,
        filters: {
          teamId,
          milestoneId: milestoneId || null
        },
        timestamp: new Date().toISOString(),
        cached: true
      }
    });
  } catch (error) {
    console.error("Error in submissions endpoint:", error);
    
    // Add Retry-After header for rate limit errors
    if (error.statusCode === 429) {
      res.setHeader('Retry-After', '10');
    }
    
    // Return empty array rather than an error to prevent UI issues
    return res.status(200).json({ 
      submissions: [],
      meta: {
        error: true,
        message: "An error occurred retrieving submissions",
        timestamp: new Date().toISOString()
      }
    });
  }
}
```

### Cache Invalidation API

```javascript
// In /pages/api/cache-invalidate.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Check authentication
    const session = await auth0.getSession(req);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get cache invalidation parameters
    const { 
      cacheKeys, 
      serverCachePatterns, 
      cacheTypes, 
      clearSubmissions, 
      teamId, 
      milestoneId 
    } = req.body;
    
    if (!cacheKeys || !Array.isArray(cacheKeys) || cacheKeys.length === 0) {
      return res.status(400).json({ error: 'cacheKeys must be a non-empty array' });
    }
    
    // Clear server-side cache based on request
    let clearedServerCaches = [];
    let totalClearedEntries = 0;
    
    // Type-based cache clearing (preferred method)
    if (cacheTypes && Array.isArray(cacheTypes) && cacheTypes.length > 0) {
      for (const type of cacheTypes) {
        if (Object.values(CACHE_TYPES).includes(type)) {
          const clearedCount = clearCacheByType(type);
          totalClearedEntries += clearedCount;
          clearedServerCaches.push(`${type} (${clearedCount} entries)`);
        }
      }
    }
    
    // Special handling for submissions cache
    if (clearSubmissions === true) {
      const specificId = teamId && milestoneId ? `${teamId}-${milestoneId}` : (teamId || null);
      const clearedCount = clearCacheByType(CACHE_TYPES.SUBMISSIONS, specificId);
      
      if (clearedCount > 0) {
        totalClearedEntries += clearedCount;
        clearedServerCaches.push(`${CACHE_TYPES.SUBMISSIONS} type ${specificId ? `for ID ${specificId}` : '(all)'} (${clearedCount} entries)`);
      } else {
        // Fallback to pattern-based clearing
        // [Legacy code here - omitted for brevity]
      }
    }
    
    // Legacy pattern-based cache clearing
    if (serverCachePatterns && Array.isArray(serverCachePatterns)) {
      // [Legacy code here - omitted for brevity]
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      invalidatedCaches: cacheKeys,
      clearedServerCaches,
      totalClearedEntries,
      message: `${cacheKeys.length} client cache(s) and ${totalClearedEntries} server cache entries invalidated`
    });
  } catch (error) {
    console.error('Error in cache invalidation:', error);
    return res.status(500).json({ error: 'Error invalidating cache' });
  }
}
```

## Component Integration

### Milestone Submission Handling

This example shows how the MilestoneSubmissionDialog component integrates with the caching system:

```javascript
// In /components/milestones/MilestoneSubmissionDialog.js
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Submission logic...
  
  // After successful submission:
  setTimeout(async () => {
    try {
      // Get the React Query queryClient to invalidate caches
      const queryClient = window._queryClient;
      
      if (queryClient) {
        // The CORRECT way: completely reset and refetch from server
        queryClient.resetQueries({ 
          queryKey: ['submissions', teamData.id, milestone.id],
          exact: true // Only this exact query
        });
        
        // Also reset the general team submissions query
        queryClient.resetQueries({ 
          queryKey: ['submissions', teamData.id, null],
          exact: true
        });
        
        // Now force a refetch with fresh data
        queryClient.refetchQueries({ 
          queryKey: ['submissions', teamData.id],
          exact: false, // Include milestone-specific queries
          type: 'all' // Important: refetch ALL queries even if inactive
        });
        
        // Clear any server-side cache for submissions
        try {
          fetch('/api/cache-invalidate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              cacheKeys: ['submissions'],
              clearSubmissions: true,
              teamId: teamData.id,
              milestoneId: milestone.id,
              cacheTypes: ['submissions']
            }),
          }).then(/* response handling */);
        } catch (cacheError) {
          console.warn('Error clearing server cache:', cacheError);
        }
      }
      
      // Fire events for component coordination
      if (milestone?.onSubmissionUpdated) {
        milestone.onSubmissionUpdated(refreshData);
      }
      
      // Dispatch a custom event for parent components
      const submissionEvent = new CustomEvent('milestoneSubmissionUpdated', {
        detail: {
          milestoneId: milestone.id,
          teamId: teamData.id,
          submissions: refreshData
        }
      });
      window.dispatchEvent(submissionEvent);
    } catch (refreshError) {
      console.error("Error refreshing submission data:", refreshError);
    }
  }, 1000);
};
```

### Milestone Table Event Handling

```javascript
// In /components/milestones/MilestoneTable.js
// Listen for submission updates
useEffect(() => {
  let isMounted = true;
  
  // Event handler for the custom submission updated event
  const handleSubmissionUpdate = (event) => {
    if (!isMounted) return;
    
    const { milestoneId } = event.detail;
    
    // Check if the updated milestone is in our list
    const milestoneIndex = enhancedMilestones.findIndex(m => m.id === milestoneId);
    
    if (milestoneIndex >= 0) {
      console.log(`IMPORTANT: Detected submission update for milestone ${milestoneId}`);
      
      // Force a COMPLETE reset of the milestone state
      setEnhancedMilestones(prev => {
        const newMilestones = [...prev];
        
        if (newMilestones[milestoneIndex]) {
          // Keep basic data but reset submission-specific fields
          newMilestones[milestoneIndex] = {
            ...newMilestones[milestoneIndex],
            hasSubmission: false,
            submissions: [],
            submissionDate: null,
            submissionLink: null,
            hasAttachments: false,
            attachmentCount: 0,
            _forceRefresh: Date.now() // Force React to see this as different
          };
        }
        return newMilestones;
      });
      
      // Update the refresh trigger to force milestone reprocessing
      setRefreshTrigger(prev => prev + 1);
    }
  };
  
  // Add event listener
  window.addEventListener('milestoneSubmissionUpdated', handleSubmissionUpdate);
  
  // Cleanup
  return () => {
    isMounted = false;
    window.removeEventListener('milestoneSubmissionUpdated', handleSubmissionUpdate);
  };
}, [enhancedMilestones]);
```

### RefreshButton Component

```javascript
// In /components/common/RefreshButton.js
const handleRefresh = async () => {
  if (isRefreshing) return;
  
  setIsRefreshing(true);
  const toastId = toast.loading("Refreshing data...");
  
  try {
    // Use global queryClient if available
    if (typeof window !== 'undefined' && window._queryClient) {
      console.log(`Refreshing data for queries: ${queryKeys.join(', ')}`);
      
      // Make API call to invalidate both client and server caches
      const response = await fetch('/api/cache-invalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cacheKeys: queryKeys,
          cacheTypes: cacheTypes, // Use the new type-based cache clearing
          clearSubmissions: true
        }),
      });
      
      if (response.ok) {
        // Invalidate client-side query cache
        queryKeys.forEach(key => {
          window._queryClient.invalidateQueries([key]);
          
          // For submissions, do targeted refresh by team
          if (key === 'submissions') {
            const teamId = window._activeTeamId || 
              (window._queryClient.getQueryData(['teams']) && 
              window._queryClient.getQueryData(['teams'])[0]?.id);
            
            if (teamId) {
              window._queryClient.refetchQueries({
                queryKey: [key, teamId],
                exact: false
              });
            } else {
              window._queryClient.refetchQueries({
                queryKey: [key],
                exact: false
              });
            }
          }
        });
      }
      
      toast.success("Data refreshed", { id: toastId });
    } else {
      if (onRefresh) {
        await onRefresh();
        toast.success("Data refreshed", { id: toastId });
      } else {
        toast.error("Refresh failed - no refresh method available", { id: toastId });
      }
    }
  } catch (error) {
    console.error("Error refreshing data:", error);
    toast.error("Failed to refresh data", { id: toastId });
  } finally {
    setIsRefreshing(false);
  }
};
```

## HTTP Cache Control

The application uses HTTP Cache-Control headers to leverage browser and CDN caching:

```javascript
// Example from /pages/api/teams/[teamId]/submissions.js
// Enhanced caching strategy
// - Client-side cache for 5 minutes (300 seconds)
// - Edge/CDN cache for 10 minutes (600 seconds)
// - Stale-while-revalidate for 30 minutes (1800 seconds)
res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=1800');
```

## Challenges & Limitations

### Vercel Serverless Environment Challenges

In the Vercel serverless environment, the in-memory cache (`memoryCache` Map) has several critical limitations:

1. **Instance Isolation**: Each serverless function instance has its own isolated memory cache.
2. **No Persistence**: When a function execution completes, the cache is lost.
3. **No Shared State**: Concurrent requests might hit different instances with different cache states.
4. **Cold Starts**: New serverless instances start with empty caches.

These limitations make the current in-memory cache approach unreliable in production, potentially leading to:

- Inconsistent cache behavior
- Ineffective cache invalidation
- Higher than expected API call volume
- Unpredictable performance

### Rate Limiting Considerations

Airtable enforces API rate limits:

- 5 requests per second
- 429 responses when exceeded
- Required throttling and backoff strategies

Our implementation includes:
- Request throttling to prevent rate limit errors
- Exponential backoff for retries
- Fallback to cached data when rate limited

## User-Specific Cache Isolation

To prevent cache conflicts between different users, the system now incorporates user-specific cache isolation:

### Client-Side User Identification

```javascript
// In AppContent component (_app.js)
useEffect(() => {
  if (user?.sub) {
    // Associate the user ID with the query client to ensure user-specific cache
    if (typeof window !== 'undefined') {
      window._userId = user.sub;
      
      // Clear all queries when user changes
      if (window._lastUserId && window._lastUserId !== user.sub) {
        console.log("User changed, clearing all cached data");
        queryClient.clear();
      }
      
      // Store the current user ID for future comparisons
      window._lastUserId = user.sub;
    }
  }
}, [user, queryClient]);
```

### User-Specific Query Keys

All data fetching hooks now incorporate the user ID in their query keys:

```javascript
// Helper function to create user-specific query keys
const getUserQueryKey = (baseKey) => {
  const userId = typeof window !== 'undefined' ? window._userId : null;
  // If we have a user ID, include it in the query key for cache isolation
  return userId ? [baseKey, userId] : [baseKey];
};

// Example usage in a data fetching hook
export function useProfileData() {
  return useQuery({
    queryKey: getUserQueryKey('profile'),
    // ... rest of the hook implementation
  });
}
```

### Handling User Switching

When a different user logs in, the system detects the change and clears the cache:

```javascript
// Clear all queries when user changes
if (window._lastUserId && window._lastUserId !== user.sub) {
  console.log("User changed, clearing all cached data");
  queryClient.clear();
}
```

This ensures that each user sees only their own data, even when multiple users access the app from the same browser.

## Future Improvements

### Persistent Caching Solution

The current in-memory cache is not suitable for serverless environments. Better alternatives include:

1. **Vercel KV Storage**:
   - Persistent key-value store designed for Vercel
   - Globally consistent across function instances
   - Better for high-volume applications

2. **Supabase Integration**:
   - PostgreSQL database as a persistent cache layer
   - Support for JSON storage and querying
   - Real-time subscription capabilities

3. **Redis/Upstash**:
   - Fast in-memory data store with persistence
   - Cross-instance data sharing
   - Support for complex data structures and TTL

### Architecture Optimizations

1. **Edge Middleware Cache Control**:
   - Move cache header logic to middleware
   - Apply consistent caching strategies across endpoints
   - Better control over CDN caching

2. **Incremental Static Regeneration**:
   - For slow-changing data like program information
   - Reduced API calls and faster page loads
   - Background revalidation for updated content

3. **Cache Tag-Based Invalidation**:
   - Associate cache entries with specific tags
   - More precise invalidation targeting
   - Reduced cache churn

## Conclusion

The xFoundry Dashboard implements a multi-layered caching architecture that combines server-side memory caching, client-side React Query caching, and HTTP caching. While the current implementation has limitations in the serverless environment, it provides a foundation for future enhancements.

The type-based cache key system introduced recently improves cache organization and invalidation, but the fundamental limitations of server-memory caching in a serverless environment remain. Moving to a persistent cache solution would significantly improve reliability and performance in production.