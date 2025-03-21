# Auth0 v4 SDK Migration Guide

This document outlines the changes made to migrate from Auth0 NextJS SDK v3 to v4.

## Key Changes in Auth0 v4

1. **Routes** - Auth0 v4 mounts routes automatically under `/auth` instead of `/api/auth`:
   - `/auth/login` (previously `/api/auth/login`)
   - `/auth/logout` (previously `/api/auth/logout`) 
   - `/auth/callback` (previously `/api/auth/callback`)
   - `/auth/profile` (new)
   - `/auth/access-token` (new)
   - `/auth/backchannel-logout` (new)

2. **Import Paths** - Import paths have changed:
   - Client-side: `import { useUser } from "@auth0/nextjs-auth0"` (previously `@auth0/nextjs-auth0/client`)
   - Server-side: Auth0Client is now imported from `@auth0/nextjs-auth0/server`

3. **Session Handling** - API for getting and checking sessions:
   - Use `auth0.getSession(req)` in Pages Router (replaces withPageAuthRequired)
   - Use `auth0.getSession()` in App Router

4. **Middleware-based Architecture** - Auth0 now uses Next.js middleware:
   - Call `auth0.middleware(request)` in your middleware.js
   - Handles session cookie management automatically

5. **Environment Variables** - Different environment variables:
   - `AUTH0_ISSUER_BASE_URL` → `AUTH0_DOMAIN` (without scheme)
   - `AUTH0_BASE_URL` → `APP_BASE_URL` 
   - `AUTH0_COOKIE_SECRET` → `AUTH0_SECRET`

## Migration Examples

### 1. Client-side Imports

Before:
```javascript
import { useUser } from "@auth0/nextjs-auth0/client"
```

After:
```javascript
import { useUser } from "@auth0/nextjs-auth0"
```

### 2. Auth0 Client Initialization

```javascript
import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Map domain from old to new format
const oldDomain = process.env.AUTH0_ISSUER_BASE_URL;
const domain = oldDomain ? oldDomain.replace(/^https?:\/\//, '') : process.env.AUTH0_DOMAIN;

// Map base URL from old to new format
const appBaseUrl = process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL || 'http://localhost:3000';

// Get secret for cookie encryption
const secret = process.env.AUTH0_SECRET || process.env.AUTH0_COOKIE_SECRET;

// Create Auth0 client instance with v4 API
export const auth0 = new Auth0Client({
  domain,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret,
  appBaseUrl,
  
  // Authorization parameters
  authorizationParameters: {
    scope: 'openid profile email',
    ...(process.env.AUTH0_AUDIENCE ? { audience: process.env.AUTH0_AUDIENCE } : {}),
  },
  
  // Session configuration
  session: {
    rollingDuration: 24 * 60 * 60, // 24 hours
    absoluteDuration: 7 * 24 * 60 * 60, // 7 days
  },
});
```

### 3. Middleware Implementation

```javascript
import { NextResponse } from 'next/server';
import { auth0 } from './lib/auth0';

export async function middleware(request) {
  // Get Auth0 middleware response
  const authResponse = await auth0.middleware(request);
  
  // If path starts with /auth, let the auth middleware handle it
  if (request.nextUrl.pathname.startsWith('/auth')) {
    return authResponse;
  }
  
  // Your other middleware logic here...
  
  // Always return the auth response for other routes to ensure cookies are handled correctly
  return authResponse;
}
```

### 4. Protected Pages with Pages Router

Before:
```javascript
import { withPageAuthRequired } from "@auth0/nextjs-auth0"

function ProtectedPage() {
  // Component logic
}

export default withPageAuthRequired(ProtectedPage)
```

After:
```javascript
export async function getServerSideProps(context) {
  const { auth0 } = await import('@/lib/auth0');
  const session = await auth0.getSession(context.req);
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/login?returnTo=/protected-page',
        permanent: false,
      },
    };
  }
  
  return {
    props: {
      user: session.user || null,
    },
  };
}

export default function ProtectedPage() {
  // Component logic
}
```

### 5. API Route Protection

Before:
```javascript
import { withApiAuthRequired, getSession } from "@auth0/nextjs-auth0"

async function handler(req, res) {
  const session = await getSession(req, res)
  // API logic
}

export default withApiAuthRequired(handler)
```

After:
```javascript
import { auth0 } from "@/lib/auth0"

async function handler(req, res) {
  const session = await auth0.getSession(req)
  
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" })
  }
  
  // API logic
}

export default handler
```

## Additional Notes

1. **User Provider** - The provider name has changed but we can keep using `UserProvider` for compatibility.

2. **URLs in Templates** - Update any hardcoded URLs:
   - Update login URLs from `/api/auth/login` to `/auth/login`
   - Update logout URLs from `/api/auth/logout` to `/auth/logout`

3. **Auth0 Dashboard** - Update your Auth0 Dashboard settings:
   - Callback URLs should now point to `/auth/callback` instead of `/api/auth/callback`
   - Logout URLs may need to be updated similarly

4. **Session Implementation** - Auth0 v4 uses cookies for session storage by default. Options for database sessions are available.

5. **Environment Variables** - Be sure to set:
   - `AUTH0_DOMAIN` - Your Auth0 domain (without https://)
   - `AUTH0_CLIENT_ID` - Your Auth0 client ID
   - `AUTH0_CLIENT_SECRET` - Your Auth0 client secret
   - `AUTH0_SECRET` - Secret for cookie encryption (should be at least 32 characters)
   - `APP_BASE_URL` - The base URL of your application

## Testing

After migration, test the following flows:
1. Login
2. Logout
3. Protected page access
4. API route access
5. Refresh token behavior (if applicable)
6. Session persistence across page reloads

## References

- [Auth0 NextJS SDK v4 Documentation](https://github.com/auth0/nextjs-auth0#readme)
- [Auth0 NextJS SDK v4 API Reference](https://auth0.github.io/nextjs-auth0/functions/_auth0_nextjs_auth0_server.Auth0Client.html)