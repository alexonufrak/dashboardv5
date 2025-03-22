# Airtable API Request Optimization Plan

## Current State Analysis

The xFoundry dashboard is experiencing rate limiting issues (429 errors) with Airtable, particularly with the `/api/teams/[teamId]/submissions` endpoint. The main issues are:

1. **Rate Limiting**: Airtable has a 5 requests per second limit, which we're exceeding
2. **No Throttling**: Current implementation doesn't throttle or queue requests
3. **Limited Caching**: Only HTTP cache headers are used for caching, no server-side caching
4. **Inefficient Pagination**: Using `.firstPage()` may miss some results if there are many submissions
5. **No 429 Error Handling**: No specific handling for rate limit errors

## Solution Requirements

Our solution must:

1. Stay within Airtable's 5 requests/second limit
2. Keep submissions data as fresh as possible
3. Preserve all current functionality
4. Implement Airtable's more efficient batching techniques
5. Provide graceful degradation when rate limits are hit

## Implementation Plan

### 1. Server-Side Caching & Throttling

#### A. In-Memory Cache

Add an in-memory cache system in `lib/airtable.js` that:
- Caches API responses with configurable TTL
- Uses a key based on endpoint parameters (tableId, formula, etc.)
- Handles cache invalidation for data mutations

```javascript
// Simple in-memory cache with TTL
const memoryCache = new Map();

/**
 * Get cached data or fetch fresh
 * @param {string} cacheKey - Unique key for this request
 * @param {Function} fetchFn - Function to execute if cache miss
 * @param {number} ttl - Time to live in seconds
 */
export const getCachedOrFetch = async (cacheKey, fetchFn, ttl = 300) => {
  const cached = memoryCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    console.log(`Cache hit for key: ${cacheKey}`);
    return cached.data;
  }
  
  console.log(`Cache miss for key: ${cacheKey}`);
  const data = await fetchFn();
  
  memoryCache.set(cacheKey, {
    data,
    expiry: Date.now() + (ttl * 1000)
  });
  
  return data;
};
```

#### B. Request Throttling

Implement a throttling mechanism that:
- Limits requests to 5 per second
- Queues and delays requests when limit is reached
- Implements exponential backoff for 429 errors

```javascript
// Track API request timestamps for rate limiting
let requestTimestamps = [];
const MAX_REQUESTS_PER_SECOND = 5;

/**
 * Throttle requests to avoid rate limiting
 */
export const throttleRequests = async () => {
  const now = Date.now();
  
  // Remove timestamps older than 1 second
  requestTimestamps = requestTimestamps.filter(time => now - time <= 1000);
  
  // If at capacity, wait before proceeding
  if (requestTimestamps.length >= MAX_REQUESTS_PER_SECOND) {
    const delay = 1000 - (now - requestTimestamps[0]) + 50; // Add 50ms buffer
    await new Promise(resolve => setTimeout(resolve, delay));
    return throttleRequests(); // Recursive check after waiting
  }
  
  // Track this request
  requestTimestamps.push(now);
};
```

### 2. Optimized Record Fetching

#### A. Batch Fetching

Use Airtable's `.all()` method to handle pagination automatically:

```javascript
export const batchFetchRecords = async (tableId, options) => {
  return getCachedOrFetch(
    `batch_${tableId}_${JSON.stringify(options)}`,
    async () => {
      await throttleRequests();
      const table = base(tableId);
      return table.select(options).all();
    }
  );
};
```

#### B. Optimized Filtering

Ensure formulas are optimized for indexed fields:
- Use FIND for exact matches
- Use dedicated ID fields when available
- Limit AND/OR complexity

### 3. Client-Side Optimizations

#### A. Enhanced React Query Configuration

Update React Query configuration for submissions:
- Increase `staleTime` to reduce frequency of background refreshes
- Implement `onError` callback with retry logic
- Add query deduplication via "keepPreviousData"

#### B. Optimistic UI Updates

For submission actions:
- Implement optimistic updates for better UX
- Update client cache immediately
- Reconcile with server data when available

### 4. API Endpoint Improvements

#### A. Enhanced Error Handling

Improve error handling for rate limit issues:
- Detect 429 responses
- Add Retry-After headers
- Provide meaningful error information to client
- Implement request failure queuing

#### B. Response Optimization

Optimize API responses:
- Only return necessary fields
- Implement ETag support for conditional requests
- Use compression for responses

### 5. Monitoring and Logging

Add instrumentation to track:
- Cache hit/miss rates
- Rate limit encounters
- Request latency
- Error rates by error type

## Implementation Priorities

1. Server-side caching and throttling (highest impact)
2. API endpoint improvements
3. Optimized record fetching
4. Client-side optimizations
5. Monitoring and logging

## Deployment Strategy

1. Implement and test in development environment
2. Deploy server-side changes first
3. Monitor effectiveness before client-side changes
4. Incrementally deploy client-side optimizations
5. Continue monitoring for further optimization opportunities