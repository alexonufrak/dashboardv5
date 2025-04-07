# App Router Implementation (Temporary Directory)

This directory contains the Next.js App Router implementation for the xFoundry Dashboard. It's currently in a temporary location to avoid conflicts with the existing Pages Router implementation.

## Directory Structure

```
app-next/
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

## Implementation Progress

The core App Router structure has been implemented, including:

- Root layout with providers and metadata
- Dashboard layout with authentication
- Dashboard page with suspense boundaries for data fetching
- Profile page with server components
- Auth route handlers for login, logout, and callback
- Error handling and 404 pages
- API utilities with authentication

## Usage

During the migration period, files in this directory will be moved to the main `/app` directory as we resolve conflicts with the Pages Router. This allows us to implement and test the App Router implementation while keeping the existing Pages Router functional.

## Next Steps

1. Continue implementing Server Components for core dashboard features
2. Add real data fetching to dashboard pages
3. Expand server actions for form handling
4. Add proper loading states and skeleton components
5. Test and optimize authentication flows

## Migration Plan

See `/docs/APP_ROUTER_MIGRATION_NEXT_STEPS.md` for the complete migration plan and strategy.