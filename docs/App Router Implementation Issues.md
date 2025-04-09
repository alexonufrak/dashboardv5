# App Router Implementation Issues

This document outlines the current issues with our App Router implementation and provides detailed explanations for why these issues matter and how they should be addressed.

## Migration Progress Issues

### Incomplete server component implementations with placeholder data fetching
- **Issue**: Many server components in `/app` directory contain placeholder data or setTimeout mocks rather than real data fetching.
- **Why it matters**: This prevents us from utilizing the full benefits of server components such as reduced client-side JavaScript, better SEO, and improved performance.
- **Impact**: Users are seeing placeholder content or manually implementing client-side fetching, negating the App Router benefits.

### Limited use of Suspense and streaming for progressive loading
- **Issue**: Most components don't properly implement `<Suspense>` boundaries or leverage streaming capabilities of App Router.
- **Why it matters**: Without proper Suspense and streaming, users experience "all-or-nothing" loading instead of a progressive experience where UI elements appear as data becomes available.
- **Impact**: Slower perceived performance and poorer user experience, especially on slower connections or complex pages.

### Insufficient server actions beyond profile updates
- **Issue**: Server actions (`'use server'`) are only implemented for profile updates, not for other data mutations.
- **Why it matters**: Server actions provide direct server access for mutations without needing API routes, improving security and reducing client-server round trips.
- **Impact**: Still relying on API routes for most data mutations, duplicating code and maintaining legacy patterns.

### Incomplete caching strategy for data mutations
- **Issue**: No consistent approach to cache invalidation after data changes.
- **Why it matters**: Without proper cache invalidation, users may see stale data after performing actions or navigating between pages.
- **Impact**: Inconsistent UI state, manual cache invalidation handled client-side, and potential data inconsistencies.

## Next.js 14 Standards Issues

### Over-reliance on client-side React Query instead of server component data fetching
- **Issue**: Still using React Query for data fetching in client components instead of moving data fetching to server components.
- **Why it matters**: Server component fetching happens on the server, reducing client JavaScript bundle size and eliminating client-server waterfalls.
- **Impact**: Larger JavaScript bundles, more client-side computation, and slower initial page loads.

### Missing implementation of parallel data fetching to prevent waterfalls
- **Issue**: Not using patterns like `Promise.all` to fetch multiple data sources in parallel in server components.
- **Why it matters**: Sequential data fetching creates "waterfalls" where each request must complete before the next begins, significantly increasing load times.
- **Impact**: Slower page loading, especially on pages that require multiple data sources (dashboard, program details, etc.).

### No usage of generateMetadata for dynamic metadata
- **Issue**: Not implementing the `generateMetadata` function for dynamic SEO metadata based on page data.
- **Why it matters**: Dynamic metadata improves SEO and social sharing capabilities by providing context-specific titles, descriptions, and images.
- **Impact**: Suboptimal SEO performance and generic metadata for all pages regardless of content.

### Limited use of cache invalidation strategies (revalidatePath, revalidateTag)
- **Issue**: No consistent usage of `revalidatePath` or `revalidateTag` in server actions to invalidate cached data.
- **Why it matters**: Proper cache invalidation ensures users see fresh data after mutations while maintaining performance benefits of caching.
- **Impact**: Either overcaching (stale data) or undercaching (poor performance), with no consistent strategy.

### No implementation of intercepted routes for modal patterns
- **Issue**: Not using App Router's intercepted routes (`(..)` convention) for modal patterns.
- **Why it matters**: Intercepted routes allow for modal dialogs with dedicated URLs that can be shared/bookmarked while preserving context.
- **Impact**: Using client-side modal state or falling back to separate pages, losing context and breaking the user flow.

## Dependency Integration Issues

### Auth0: Missing error handling for authentication failures
- **Issue**: Limited error handling in Auth0 integration, especially for token expiration and refresh scenarios.
- **Why it matters**: Without proper error handling, authentication failures can create poor user experiences or security issues.
- **Impact**: Users being unexpectedly logged out, seeing generic error pages, or encountering silent failures.

### Airtable: Still fetching data client-side instead of in server components
- **Issue**: Airtable data is still primarily fetched client-side rather than in server components.
- **Why it matters**: Client-side Airtable fetching exposes rate limiting issues directly to users and increases client JavaScript bundle size.
- **Impact**: Potential rate limiting issues, larger client bundles, and slower initial page loads.

### No dedicated server component data fetchers for Airtable entities
- **Issue**: Missing organized pattern for server-side Airtable data fetching (equivalent to client-side hooks).
- **Why it matters**: Without a structured approach to server-side data fetching, developers implement inconsistent patterns.
- **Impact**: Inconsistent caching behavior, duplicate code, and harder maintenance across the codebase.

### React Query: Using client-side patterns instead of leveraging server components
- **Issue**: React Query is used extensively when server components could handle data fetching more efficiently.
- **Why it matters**: React Query adds client-side code complexity that's unnecessary when server components can handle fetching.
- **Impact**: Larger JavaScript bundles, more complex client code, and split data fetching logic.

## Server vs Client Component Issues

### Unclear boundaries between server and client components
- **Issue**: No clear pattern for when to use server vs. client components or how to compose them.
- **Why it matters**: Without clear boundaries, developers may create server components with client dependencies or vice versa.
- **Impact**: "use client" directives added inconsistently, component tree serialization errors, and inefficient component composition.

### Still using client-side data fetching where server components would be better
- **Issue**: Many components fetch data client-side even when they don't need interactivity.
- **Why it matters**: Client-side data fetching increases JavaScript bundle size and creates client-server request waterfalls.
- **Impact**: Slower initial page loads, larger bundles, and unnecessary client-server round trips.

### Missing streaming implementation for progressive page loading
- **Issue**: Not using streaming responses to progressively render complex pages.
- **Why it matters**: Streaming allows the server to send parts of the page as they're ready, improving perceived performance.
- **Impact**: Users wait for the entire page to be ready instead of seeing a progressively rendered UI.

### Limited implementation of server actions for data mutations
- **Issue**: Most data mutations still use API routes instead of server actions.
- **Why it matters**: Server actions provide a more direct, secure way to mutate data without exposing API routes.
- **Impact**: Duplicated logic between API routes and server actions, inconsistent mutation patterns.

## Performance and Architecture Issues

### No parallel data fetching to prevent request waterfalls
- **Issue**: Sequential data fetching in server components creates request waterfalls.
- **Why it matters**: Sequential requests significantly increase page load times, especially with multiple data dependencies.
- **Impact**: Slower page loads, especially for complex pages with multiple data requirements.

### Missing patterns for optimistic updates with useOptimistic
- **Issue**: Not implementing optimistic UI updates using React's `useOptimistic` hook.
- **Why it matters**: Optimistic updates provide immediate feedback to users while mutations are processing server-side.
- **Impact**: Perceived slowness in the interface, as users must wait for server responses to see their changes.

### No implementation of form state handling with useFormState
- **Issue**: Not using React's `useFormState` for managing form state with server actions.
- **Why it matters**: `useFormState` provides a clean way to handle form state and validation with server actions.
- **Impact**: More complex client-side form state management or relying on traditional form submissions.

### Limited use of proper loading states with skeleton components
- **Issue**: Inconsistent implementation of loading states for async operations.
- **Why it matters**: Loading states provide visual feedback during data fetching and mutations, improving perceived performance.
- **Impact**: Seemingly frozen UI during operations, poor feedback for users, and inconsistent loading experience.

## Recommended Next Steps

1. **Create a server component data fetching pattern** for all Airtable entities to replace client-side React Query hooks
2. **Implement proper Suspense boundaries** with meaningful loading states throughout the application
3. **Refactor data mutations** to use server actions instead of API routes
4. **Establish a caching strategy** with appropriate invalidation using revalidatePath/revalidateTag
5. **Update component composition patterns** to clearly separate server and client responsibilities