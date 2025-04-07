# App Router Implementation

This directory contains the Next.js App Router implementation for the xFoundry Dashboard.

## Usage

During the migration period, you can enable the App Router by:

1. Adding `?useAppRouter=true` to any URL in development mode
2. Clicking the toggle in the bottom-right corner of the screen in development mode

## Directory Structure

```
app/
├── actions/                  # Server actions for form handling
├── api/                      # API route handlers
├── auth/                     # Auth0 authentication routes
├── dashboard/                # Dashboard pages and layouts
├── error.js                  # Global error page
├── globals.css               # Global styles
├── layout.js                 # Root layout
├── lib/                      # Server-side utilities
├── loading.js                # Global loading state
├── not-found.js              # 404 page
├── page.js                   # Home page
└── providers.js              # Client-side providers
```

## Implementation Strategy

The App Router implementation follows a hybrid approach that allows incremental migration from Pages Router to App Router. Key aspects of this strategy include:

1. **Feature flagging**: Users can toggle between Pages Router and App Router using a feature flag
2. **Coexistence**: Both routers can work side by side, with middleware routing requests appropriately
3. **Incremental implementation**: Start with core pages (dashboard, profile) and gradually add more
4. **Server Components**: Use React Server Components for improved performance and SEO

## Server Components Best Practices

1. **Data Fetching**: Use React's native `fetch` or server-side data functions with proper caching
2. **Suspense Boundaries**: Wrap components that fetch data in Suspense for progressive loading
3. **Error Handling**: Use error.js files for graceful error recovery
4. **Authentication**: Check authentication early in the component

## Server Actions Best Practices

1. **Form Validation**: Validate all input data on the server
2. **Cache Invalidation**: Use `revalidatePath` and `revalidateTag` for cache busting
3. **Optimistic Updates**: Use `useOptimistic` for immediate UI feedback
4. **Error Handling**: Provide proper error handling and user feedback

## References

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [React Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
