# App Router Migration: Next Steps and Implementation Plan

## Current Status

We've made significant progress in migrating from the Pages Router to the App Router:

1. **API Route Migration** ✅ COMPLETED
   - All API routes have been successfully migrated to the App Router format
   - Consistent patterns established for authentication and error handling

2. **React Query Hook Updates** 🟡 IN PROGRESS
   - Hook factory updated to support App Router endpoints
   - Several key hooks migrated: `useCohorts`, `useApplications`, `useContact`, `useEducation`, `useParticipation`, `useProfileComposite`, `usePrograms`, `useTeams`
   - Remaining hooks need to be updated following the same pattern

3. **Server Actions Implementation** ✅ STARTED
   - Profile update server actions implemented (`update-profile.js`, `update-profile-with-formstate.js`)
   - Example components created for demonstrating both approaches (useFormState, useOptimistic)
   - Documentation created in `SERVER_ACTIONS_IMPLEMENTATION.md`

4. **Server Components Examples** ✅ STARTED
   - Dashboard example Server Component created with streaming and Suspense
   - Profile Server Component implemented for user data
   - Proper loading states and error handling patterns established

5. **Core App Router Structure** ✅ IMPLEMENTED
   - Root layout.js with metadata and providers
   - Dashboard layout with authentication
   - Dashboard page with Suspense boundaries
   - Profile page with server component structure
   - Auth route handlers for login, logout, callback
   - Error and not-found pages
   - API route utility with authentication protection

## Priority Tasks

### 1. Complete React Query Hook Migration

This is our top priority as it's the foundation for all data fetching.

#### Tasks:
1. Update remaining hooks in `/lib/airtable/hooks/`:
   - `useEvents.js`
   - `useInstitutions.js`
   - `usePartnerships.js`
   - `usePoints.js`
   - `useSubmissions.js`
   - `useResources.js`

2. For each hook:
   - Add App Router compatible versions with `*ViaApi` suffix
   - Update the original hook implementations to use the new API-based versions
   - Maintain backward compatibility
   - Add to the composite export

3. Test all updated hooks to ensure they function correctly
4. Document the changes and update examples

### 2. Complete Implementation of Core Dashboard Pages

#### Tasks:
1. Complete Dashboard Home Page (`/app/dashboard/page.js`):
   - Add real data fetching for programs, teams, and events
   - Implement server-side data fetchers for each section

2. Complete Profile Page (`/app/dashboard/profile/page.js`):
   - Integrate with real education data
   - Add proper server actions for profile updates

3. Implement Program Detail Page (`/app/dashboard/program/[programId]/page.js`):
   - Create server component for program details
   - Add team and milestone data fetching
   - Implement proper loading states

4. Implement Programs List Page (`/app/dashboard/programs/page.js`):
   - Create server component for programs list
   - Add filtering and sorting options
   - Implement proper pagination

### 3. Finalize Auth0 Integration with App Router

#### Tasks:
1. Test Auth0 integration thoroughly:
   - Verify login/logout functionality
   - Test protected routes
   - Ensure session persistence

2. Optimize middleware for authentication:
   - Fine-tune route protection rules
   - Add performance optimizations
   - Create consistent error responses

3. Improve error handling for auth flows:
   - Create better error pages
   - Add clearer error messages
   - Implement redirect after authentication errors

### 4. Expand Server Actions Implementation

#### Tasks:
1. Create Server Actions for Teams:
   - `actions/teams/create-team.js`
   - `actions/teams/update-team.js`
   - `actions/teams/invite-member.js`
   - `actions/teams/leave-team.js`

2. Create Server Actions for Programs:
   - `actions/programs/apply.js`
   - `actions/programs/submit-milestone.js`

3. Create Server Actions for User Management:
   - `actions/profile/update-education.js`
   - `actions/profile/complete-onboarding.js`

4. Implement proper cache invalidation in all server actions:
   - Add revalidatePath and revalidateTag calls
   - Create consistent patterns for cache invalidation

### 5. Cache Optimization

#### Tasks:
1. Define standardized caching patterns:
   - Create documentation for cache durations
   - Define cache tag naming conventions

2. Implement cache optimizations in server components:
   - Add proper cache control directives
   - Implement conditional fetching where appropriate
   - Add stale-while-revalidate patterns

3. Create cache invalidation utilities:
   - Implement helpers for common invalidation patterns
   - Create cache tag management system

### 6. UI Components Optimization

#### Tasks:
1. Create loading state components:
   - Implement skeleton loaders for all major sections
   - Create loading.js files for key routes

2. Improve error handling components:
   - Create error boundaries for each section
   - Implement better error UI components

3. Optimize client component wrappers:
   - Minimize client-side JavaScript
   - Move state up the component tree where possible
   - Use server components for static parts of the UI

### 7. Testing and Performance Optimization

#### Tasks:
1. Test all App Router pages:
   - Verify functionality in development and production
   - Test with different authentication states
   - Ensure proper error handling

2. Optimize build and deployment:
   - Configure proper static/dynamic rendering settings
   - Optimize image loading and processing
   - Implement proper caching headers

3. Performance testing:
   - Measure TTI, LCP, and CLS metrics
   - Optimize for Core Web Vitals
   - Implement performance monitoring

## Implementation Strategy

We'll continue with the hybrid approach that allows us to:

1. Keep the Pages Router working for existing features
2. Move files to `app-next` directory during development
3. Implement components incrementally following the established patterns
4. Test both routers in parallel
5. Gradually switch to App Router once we have sufficient feature coverage

This approach allows us to maintain a working application while migrating, and to deploy incremental improvements without a complete rewrite.

## Next Immediate Steps

1. Move completed App Router files back from `app-next` to `app` after resolving conflicts:
   - Rename conflicting Pages Router files
   - Update import paths where needed
   - Use route segment config to control rendering

2. Complete React Query hook migration:
   - Focus on `useEvents.js`, `useInstitutions.js`, and `useSubmissions.js` first
   - Use the established patterns from the already migrated hooks

3. Implement real data fetching in server components:
   - Add proper data fetchers to dashboard pages
   - Implement streaming with Suspense
   - Create proper loading states

4. Continue implementing server actions:
   - Focus on profile updates first
   - Implement optimistic updates
   - Add proper form validation
   - Create consistent error handling