# Airtable API Optimization - Second Phase (Batch Processing)

## Issue Analysis

After implementing general caching and rate limiting improvements, we're still experiencing rate limit issues (429 errors) with two key endpoints:

1. `/api/user/participation`
   - Makes 6+ Airtable calls per request
   - Called too frequently by client code
   - Not using our optimized throttling and caching

2. `/api/cohorts/[cohortId]/milestones`
   - Uses direct base() calls instead of our optimized utilities
   - Also called frequently by client code
   - Used for milestone prefetching which creates many additional API calls

3. **Submission Prefetching**
   - DashboardContext is aggressively prefetching submission data for all milestones
   - Each prefetch creates a separate API call to `/api/teams/[teamId]/submissions`
   - This generates a cascade of API calls that quickly exceeds rate limits

## Optimization Approach

### 1. API Endpoint Optimizations

#### A. `/api/user/participation`
- Replace direct Airtable calls with `batchFetchRecords` utility
- Implement server-side results caching with longer TTL (10 minutes)
- Add robust error handling with fallback to stale data

#### B. `/api/cohorts/[cohortId]/milestones`
- Replace direct base() calls with `batchFetchRecords` utility
- Update formula filtering for better Airtable performance
- Implement more aggressive caching (15 minute TTL)
- Add conditional fetching to reduce redundant calls

### 2. Batch API Endpoint

Create a new API endpoint that combines frequently requested data:

```
/api/batch-data?programId=${programId}&teamId=${teamId}
```

This endpoint will:
- Fetch participation, milestones, and basic submission data in one request
- Use Promise.all with our optimized utilities to parallelize safely
- Apply robust server-side caching (10+ minutes)
- Return a combined response format that includes all data for the program page

### 3. Client-Side Optimization

#### A. Better React Query Configuration
- Update stale time to 10 minutes for less frequent refetching
- Add proper deduplication using `keepPreviousData`
- Implement `suspense` mode to eliminate loading states that trigger additional renders

#### B. Smarter Prefetching Strategy
- Replace the current milestone-by-milestone prefetching with a single batch request
- Implement an intelligent prefetch controller that limits concurrent requests
- Add a prioritization system that loads critical path data first

#### C. Caching Enhancement
- Implement better cache-key normalization to improve hit rates
- Add cache persistence across page navigations
- Incorporate cache time-to-live based on data type (longer for static data)

## Implementation Steps

1. **Modify DashboardContext.js**
   - Reduce aggressive prefetching
   - Implement intelligent batching
   - Better synchronize data dependencies

2. **Update Airtable API Endpoints**
   - Apply optimized utilities to participation and milestones endpoints
   - Create new batch endpoint for consolidated data fetching

3. **Client-Side React Query Improvements**
   - Optimize query configuration for less frequent refetching
   - Better deduplication and result stabilization
   - Implement cache persistence

4. **Add Monitoring**
   - Implement better telemetry for API calls
   - Add performance timing to identify bottlenecks

This approach will significantly reduce the number of Airtable API calls, properly utilize our throttling and caching mechanisms, and provide a more efficient data loading strategy for the program page.