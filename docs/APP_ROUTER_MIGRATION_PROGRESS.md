# App Router Migration Progress & Plan

## Overview

This document outlines our progress migrating the xFoundry Dashboard from Next.js Pages Router to App Router (Next.js 14) and provides a comprehensive plan for remaining tasks to complete the migration for production deployment.

## Progress Made

### Initial Setup and API Route Migration ✅ COMPLETED

We have successfully completed the initial phase of migration:

1. **Project Configuration**
   - Set up app directory structure
   - Configured tailwind.config.mjs to include app directory
   - Created initial app/layout.js with basic structure

2. **API Routes Migration**
   - Migrated all API routes from Pages Router to App Router format
   - Implemented consistent patterns for API route handlers
   - Added proper authentication middleware and error handling
   - Divided routes by domain (users, teams, programs, etc.)
   - Thoroughly tested all migrated API routes

3. **Auth Integration with App Router**
   - Created lib/app-router-auth.js for App Router authentication
   - Set up proper cookie configuration for development/production
   - Implemented middleware for route protection

### Server Actions Implementation

We have successfully implemented the Server Actions pattern to replace React Query mutations:

1. **Server Action Creation**
   - Created `/app/actions/profile/update-profile.js` - Profile update action with authentication, validation, and proper error handling
   - Created `/app/actions/profile/update-profile-with-formstate.js` - Alternative implementation designed for use with the useFormState hook

2. **Client Component Forms**
   - Created `/app/dashboard/profile/components/ProfileEditForm.js` - Uses useTransition and useOptimistic for optimistic UI updates
   - Created `/app/dashboard/profile/components/ProfileDialogButton.js` - Modal dialog component that uses the form
   - Created `/app/dashboard/server-actions-example/components/ProfileFormStateExample.js` - Alternative implementation using useFormState

3. **Server Component Integration**
   - Created `/app/dashboard/profile/components/ProfileServerPage.js` - Server component that integrates the client forms
   - Updated `/app/dashboard/profile/server-page.js` to use the new server component

4. **Example & Documentation**
   - Created `/app/dashboard/server-actions-example/page.js` - Demonstrates both implementations with tabs
   - Created `/docs/SERVER_ACTIONS_IMPLEMENTATION.md` - Comprehensive guide for Server Actions implementation

### React Query to App Router Hooks Migration 🟡 IN PROGRESS

We've started updating React Query hooks to support App Router:

1. **Hook Factory Pattern**
   - Updated `/lib/utils/hook-factory.js` to support App Router pattern
   - Added appRouter option to createDataHook function

2. **Entity-Specific Hooks (PARTIAL COMPLETION)**
   - Updated the following hooks to support App Router endpoints:
     - `/lib/airtable/hooks/useCohorts.js`
     - `/lib/airtable/hooks/useApplications.js`
     - `/lib/airtable/hooks/useContact.js`
     - `/lib/airtable/hooks/useEducation.js`
     - `/lib/airtable/hooks/useParticipation.js`
     - `/lib/airtable/hooks/useProfileComposite.js`
     - `/lib/airtable/hooks/usePrograms.js`
     - `/lib/airtable/hooks/useTeams.js`

3. **Hook Integration**
   - Maintained backward compatibility with existing hooks
   - Added new `*ViaApi` pattern for App Router specific hooks

### Server Component Examples

We've created examples of Server Components:

1. **Dashboard Example**
   - Created `/app/dashboard/example/page.js` - Server Component with streaming and Suspense
   - Created `/app/dashboard/example/components/programs-section.js` - Server Component for data fetching
   - Created `/app/dashboard/example/components/client-program-list.js` - Client Component that receives data
   - Created `/app/dashboard/example/components/client-dashboard-header.js` - Client Component for user interaction

2. **Profile Server Component**
   - Implemented `/app/dashboard/server-components/UserProfileData.js` - Server Component for user data
   - Integrated with profile page 

## Remaining Tasks for Production Deployment

### 1. Complete React Query to App Router Hooks Migration

- Update remaining hooks in `/lib/airtable/hooks/` to support App Router:
  - useEvents.js
  - useInstitutions.js
  - useSubmissions.js
  - useResources.js
  - usePoints.js
  - usePartnerships.js
- Ensure all hooks use the hook-factory pattern consistently
- Update all components to use the new hooks
- Add comprehensive tests for the updated hooks
- Document the new hook patterns for developer reference

### 2. Implement Server Components for All Dashboard Pages

- Convert remaining pages to use Server Components:
  - /dashboard/page.js
  - /dashboard/profile/page.js
  - /dashboard/program/[programId]/page.js
  - /dashboard/programs/page.js
- Implement proper data fetching in Server Components
- Use suspense boundaries and streaming for progressive loading
- Separate client components for interactive elements
- Add optimized skeleton loading states

### 3. Implement Server Actions for All Form Mutations

- Create Server Actions for all form submissions:
  - Team creation/editing
  - Program applications
  - Submissions
  - Team member management
  - Invitations
- Update client components to use Server Actions
- Implement optimistic updates and error handling
- Use useFormState for simpler forms
- Add form validation and feedback

### 4. Cache Optimization and Performance

- Implement revalidateTags for all data fetching:
  - User profile data with 'user-profile' tag
  - Program data with 'program-data' tag
  - Team data with 'team-data' tag
- Create a centralized cache invalidation strategy
- Configure proper caching headers for static assets
- Implement incremental static regeneration for applicable pages
- Optimize streaming and Suspense for key pages
- Configure parallel data fetching to prevent waterfalls

### 5. Tailwind UI and shadcn Integration

- Audit existing shadcn components for App Router compatibility
- Configure shadcn components to work with Server Components
- Update theme provider implementation for App Router
- Create reusable layout components for App Router pages
- Set up proper client/server component boundaries
- Implement skeleton loading states for UI components
- Document component usage patterns for App Router

### 6. Testing and Validation

- Create test fixtures for Server Components
- Implement integration tests for Server Actions
- Test all authentication flows
- Validate performance with Lighthouse
- Ensure accessibility compliance
- Test across different browsers and devices

### 7. Build Configuration

- Update next.config.mjs for production settings
- Configure output options (standalone vs. static)
- Set up proper environment variables for production
- Configure build caching and optimization
- Set up error monitoring and logging

### 8. Deployment Pipeline

- Set up CI/CD pipeline with Vercel
- Configure deployment environments (preview, staging, production)
- Set up monitoring and error reporting
- Implement automated testing before deployment
- Create rollback procedures
- Document deployment process

## Next Priority: Server Components Data Fetching with Next.js 14

The next priority is to implement Next.js 14 native data fetching with Server Components instead of continuing with React Query hook migration. This shift in strategy is based on newer Next.js best practices and will deliver better performance and developer experience. This approach:

1. Leverages server-side data fetching for faster page loads
2. Takes advantage of Next.js 14's built-in caching
3. Reduces client-side JavaScript bundle size
4. Enables progressive rendering with Suspense streaming 
5. Creates a more maintainable and performance-optimized codebase

### Updated Migration Strategy for Data Fetching

1. **Server Component Data Fetchers**
   - Create domain-specific data fetching utilities in `app/lib/`
   - Implement proper caching with `fetch` API's `next.revalidate` and cache tags
   - Use `cache()` function for request memoization in server components
   - Follow the examples in `docs/SERVER_COMPONENTS_EVENTS_INSTITUTIONS.md`

2. **Server Actions for Mutations**
   - Replace React Query mutations with Server Actions
   - Implement proper validation, authentication, and error handling
   - Add optimistic updates with `useOptimistic` for better UX
   - Handle form state properly with `useFormState`

3. **Data Fetching API Routes**
   - Create API routes for data that needs to be accessible from the client
   - Set appropriate cache headers for performance
   - Implement consistent error handling and response formats

4. **Client-Side Integration**
   - Provide a minimal set of client hooks using the `use` hook when needed
   - Minimize client-side data fetching to essential interactive components
   - Pass data from server to client components via props when possible

### Implementation Plan

We have created a detailed implementation guide for the first set of hooks to migrate:

1. **Events Data Fetching**
   - See implementation plan in `docs/SERVER_COMPONENTS_EVENTS_INSTITUTIONS.md`
   - Create server component data fetchers in `app/lib/events.js`
   - Create server actions in `app/actions/events.js`
   - Implement cache strategies for different event data types

2. **Institutions Data Fetching**
   - Create server component data fetchers in `app/lib/institutions.js` 
   - Create server actions in `app/actions/institutions.js` (if needed)
   - Implement appropriate caching for institution data

3. **Example Components**
   - We've provided example server components for both domains
   - Follow the patterns for separation of client/server concerns
   - Use Suspense boundaries for progressive loading

## Technical Implementation Patterns

### Server Component Pattern

```jsx
// app/dashboard/example/page.js
export default async function ExamplePage() {
  // Server-side data fetching with proper caching
  const data = await fetchData({ next: { revalidate: 60 } });

  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<LoadingSkeleton />}>
        <ServerDataComponent />
      </Suspense>
      <ClientInteractiveComponent initialData={data} />
    </div>
  );
}
```

### Server Action Pattern

```javascript
// app/actions/example.js
'use server'

export async function updateData(formData) {
  // Authentication
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // Validation
  const data = validateFormData(formData);
  if (!data.valid) return { success: false, fieldErrors: data.errors };

  // Perform update
  try {
    await performUpdate(data);
    
    // Invalidate cache
    revalidateTag('related-data');
    revalidatePath('/related-path');
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Client Component with Server Action

```jsx
// app/components/example-form.js
'use client'

import { useFormState, useFormStatus } from 'react-dom';
import { updateData } from '@/app/actions/example';

// Submit button with pending state
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save'}
    </button>
  );
}

// Initial state
const initialState = { success: false, message: null, fieldErrors: {} };

export default function ExampleForm() {
  // Form state with server action
  const [state, formAction] = useFormState(updateData, initialState);
  
  return (
    <form action={formAction}>
      {state.message && <p>{state.message}</p>}
      
      <div>
        <label htmlFor="name">Name</label>
        <input 
          id="name" 
          name="name" 
          className={state.fieldErrors.name ? "error" : ""}
        />
        {state.fieldErrors.name && (
          <p className="error">{state.fieldErrors.name}</p>
        )}
      </div>
      
      <SubmitButton />
    </form>
  );
}
```

## Timeline Estimate

Based on our current progress and the remaining tasks, here's a revised timeline:

- **Complete React Query Hook Migration**: 1 week
- **Implement Server Components for Dashboard Pages**: 2 weeks
- **Implement Server Actions for Forms**: 2 weeks
- **Cache Optimization and Performance**: 1 week
- **Tailwind UI and shadcn Integration**: 1 week
- **Testing and Validation**: 1 week
- **Build Configuration and Deployment**: 1 week

**Total Estimated Time**: 9 weeks for full production-ready migration.

## Resources

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Server Actions Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [Server Components](https://nextjs.org/docs/getting-started/react-essentials#server-components)
- [Data Fetching and Caching](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating)
- [Authentication with Auth0](https://auth0.com/docs/quickstart/webapp/nextjs/01-login)