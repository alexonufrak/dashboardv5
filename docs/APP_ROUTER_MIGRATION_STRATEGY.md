# App Router Migration Strategy

This document outlines our pragmatic strategy for migrating the xFoundry Dashboard from the Pages Router to the App Router. Instead of rewriting everything from scratch, we're taking an incremental, hybrid approach that maximizes component reuse.

## Migration Philosophy

1. **Maximize Reuse**: Reuse existing components and utilities whenever possible
2. **Incremental Adoption**: Migrate one section at a time, keeping both routers functional
3. **Focus on Structure**: Start with auth, layouts, and navigation, then move to individual pages

## Implementation Approach

### Phase 1: Foundation (Completed)

1. ✅ **Basic App Structure**
   - Created app directory with essential files
   - Set up app/layout.js with proper metadata and providers
   - Created error.js and not-found.js special files

2. ✅ **Auth System**
   - Created lib/app-router-auth.js with Next.js 14 compatible auth functions
   - Implemented auth middleware for route protection
   - Created login, logout, and callback route handlers

3. ✅ **Core Pages**
   - Implemented dashboard, profile, programs, and program detail pages
   - Created client components that wrap existing pages

### Phase 2: Server Components (In Progress)

1. 🟡 **Profile Page Server Components**
   - Implemented server components for user profile data
   - Created server actions for profile updates
   - Added loading state with Suspense boundaries

2. ⚪ **Dashboard Home Server Components**
   - Create server components for dashboard sections (programs, teams, events)
   - Implement proper loading states with Suspense
   - Add streaming for improved performance

3. ⚪ **Programs and Events Server Components**
   - Implement server components for programs and events sections
   - Create server actions for program applications and events management
   - Add proper caching strategies

### Phase 3: Complete Migration (Planned)

1. ⚪ **Remaining Pages and Forms**
   - Migrate all remaining pages and forms
   - Implement server actions for all mutations
   - Ensure all routes work with App Router

2. ⚪ **Client Component Upgrades**
   - Refactor client components to use React Server Components properly
   - Add optimistic updates with useOptimistic
   - Improve form handling with useFormState

3. ⚪ **Switch to App Router Only**
   - Switch config to app-router-next.config.mjs
   - Remove pages directory
   - Clean up unused code

## Key Files and Patterns

### Authentication and Session Handling

- **app-router-auth.js**: Central auth utilities for App Router
- **app/auth/**: Login, logout, and callback route handlers
- **middleware.js**: Route protection middleware

### Server Component Patterns

- **Server Data Fetching**:
  ```jsx
  // In a Server Component
  const data = await fetchData();
  return <ClientComponent data={data} />;
  ```

- **Suspense Boundaries**:
  ```jsx
  <Suspense fallback={<Loading />}>
    <ServerComponent />
  </Suspense>
  ```

- **Server Actions**:
  ```jsx
  // actions/profile/update-profile.js
  'use server'
  
  export async function updateProfile(formData) {
    // Auth, validation, update logic
    revalidatePath('/dashboard/profile');
    return { success: true };
  }
  ```

### Client Component Patterns

- **Using Server Actions**:
  ```jsx
  'use client'
  
  import { updateProfile } from '@/app/actions/profile/update-profile';
  
  export function ProfileForm() {
    const [isPending, startTransition] = useTransition();
    
    function handleSubmit(e) {
      e.preventDefault();
      const formData = new FormData(e.target);
      startTransition(async () => {
        await updateProfile(formData);
      });
    }
    
    return <form onSubmit={handleSubmit}>...</form>;
  }
  ```

- **Optimistic Updates**:
  ```jsx
  'use client'
  
  import { useOptimistic } from 'react';
  
  export function ProfileForm({ initialData }) {
    const [optimisticData, updateOptimisticData] = useOptimistic(
      initialData,
      (state, newData) => ({ ...state, ...newData })
    );
    
    function handleSubmit(formData) {
      // Show optimistic update immediately
      updateOptimisticData({
        name: formData.get('name')
      });
      
      // Perform actual update
      startTransition(async () => {
        await updateProfile(formData);
      });
    }
  }
  ```

## Navigation Between Pages

- Use `useRouter` from 'next/navigation' in client components
- Use `redirect` from 'next/navigation' in server components
- Use `<Link>` from 'next/link' for client-side navigation links

## Caching Strategy

- Use `revalidatePath` in server actions to invalidate page caches
- Use `revalidateTag` for more specific cache invalidation
- Set `next: { revalidate: seconds }` for time-based revalidation

## Progressive Enhancement

As we migrate more pages, we'll increasingly leverage the App Router's advanced features:

1. **Streaming**: For improved user experience with progressive loading
2. **Server-Side Rendering**: For better performance and SEO
3. **Parallel Routes**: For more complex layouts with independent loading
4. **Intercepted Routes**: For modal dialogs and slideouts

## Migration Testing

For each migrated page:

1. Test authentication flows
2. Verify data fetching works correctly
3. Test form submissions and mutations
4. Check loading and error states
5. Verify client-side navigation