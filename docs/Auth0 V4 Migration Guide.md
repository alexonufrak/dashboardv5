# Next.js Auth0 V4 Migration Guide

This document describes the migration process from Auth0 NextJS SDK v3.5.0 to v4.1.0 for the xFoundry Dashboard.

## Key Changes

### 1. Import Path Changes

- **Old (v3)**: Import from `@auth0/nextjs-auth0/client` for client components
- **New (v4)**: Import directly from `@auth0/nextjs-auth0` (no `/client` suffix needed)

Example:
```diff
- import { useUser } from '@auth0/nextjs-auth0/client'
+ import { useUser } from '@auth0/nextjs-auth0'
```

### 2. Auth0Client Usage

- **Old (v3)**: Import from `@auth0/nextjs-auth0`
- **New (v4)**: Import from `@auth0/nextjs-auth0/server`

Example:
```diff
- import { getSession } from '@auth0/nextjs-auth0'
+ import { auth0 } from '@/lib/auth0'
// Then use auth0.getSession(req)
```

### 3. Session Handling

- **Old (v3)**: `getSession(req, res)`
- **New (v4)**: `auth0.getSession(req)` (no res parameter needed)

Example:
```diff
- const session = await getSession(req, res)
+ const session = await auth0.getSession(req)
```

### 4. Authentication Routes

- **Old (v3)**: Routes at `/api/auth/login`, `/api/auth/logout`, etc.
- **New (v4)**: Routes at `/auth/login`, `/auth/logout`, etc. (no `/api` prefix)

### 5. Protected Pages and API Routes

- **Old (v3)**: Use HOCs like `withPageAuthRequired` and `withApiAuthRequired`
- **New (v4)**: Direct session checks with `auth0.getSession(req)`

Example for protected pages:
```javascript
// Old (v3)
export const getServerSideProps = withPageAuthRequired()

// New (v4)
export async function getServerSideProps(context) {
  // Get the session using Auth0 v4 client
  const session = await auth0.getSession(context.req);
  
  // Redirect to login if no session
  if (!session) {
    return {
      redirect: {
        destination: '/auth/login?returnTo=' + encodeURIComponent(context.resolvedUrl),
        permanent: false,
      },
    };
  }
  
  // Return the user prop to maintain compatibility with existing code
  return {
    props: {
      user: session.user || null,
    },
  };
}
```

Example for protected API routes:
```javascript
// Old (v3)
export default withApiAuthRequired(async function handler(req, res) {
  const session = await getSession(req, res)
  // API logic
})

// New (v4)
export default async function handler(req, res) {
  const session = await auth0.getSession(req)
  if (!session || !session.user) {
    return res.status(401).json({ error: "Not authenticated" })
  }
  // API logic
}
```

### 6. UserProvider Component

- **Old (v3)**: `UserProvider` from `@auth0/nextjs-auth0/client`
- **New (v4)**: `Auth0Provider` from `@auth0/nextjs-auth0`

```diff
- import { UserProvider } from '@auth0/nextjs-auth0/client'
+ import { Auth0Provider } from '@auth0/nextjs-auth0'

// In _app.js
- <UserProvider>
+ <Auth0Provider>
    {/* Your app */}
- </UserProvider>
+ </Auth0Provider>
```

### 7. Middleware Configuration

In v4, Auth0 handling is done via middleware:

```javascript
// middleware.js
export async function middleware(request) {
  // First, get the Auth0 response to handle auth routes and session management
  const authResponse = await auth0.middleware(request);
  
  const { pathname } = request.nextUrl;
  
  // If path starts with /auth, let the auth middleware handle it
  if (pathname.startsWith('/auth')) {
    return authResponse;
  }
  
  // Handle other middleware logic...
  
  // Return the auth response to ensure cookies are handled correctly
  return authResponse;
}
```

### 8. AfterCallback Functionality

The old `afterCallback` functionality in `[...auth0].js` is now implemented in the Auth0Client configuration in `lib/auth0.js` using hooks:

```javascript
export const auth0 = new Auth0Client({
  // Other config...
  
  // Handler to process the login callback
  hooks: {
    afterLogin: async (req, session) => {
      // Add metadata, process invitations, etc.
      return session;
    },
  },
});
```

## Migration Status

- [x] Update import paths in components 
- [x] Configure Auth0Client with v4 patterns
- [x] Update middleware.js to handle Auth0 v4
- [x] Update Auth0Provider in _app.js
- [x] Migrate afterCallback functionality to Auth0 hooks
- [x] Update protected pages to use direct session checks
- [x] Handle API endpoint for invitation processing
- [ ] Update all API routes (about 31 files) to use direct session checks

## Remaining Tasks

1. Update all remaining API routes that use `withApiAuthRequired` and `getSession`
2. Update all components to use new auth routes (e.g., `/auth/login` instead of `/api/auth/login`)
3. Test all auth flows thoroughly:
   - Login/Logout
   - Protected pages
   - API access
   - Invitation handling
   - Metadata synchronization

## References

- [Auth0 NextJS SDK v4 Documentation](https://auth0.github.io/nextjs-auth0/index.html)
- [Auth0 v4 Migration Guide](https://github.com/auth0/nextjs-auth0/blob/main/MIGRATION_GUIDE.md)