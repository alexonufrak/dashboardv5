# Authentication Fixes for Profile Updates

## Issue Overview

We fixed a persistent issue where profile updates were failing with `401 Unauthorized` errors despite the user being properly authenticated. The core problem was that the browser wasn't sending authentication cookies with PATCH requests due to security policies around secure cookies.

**UPDATE (March 31, 2025)**: Additional debugging revealed that in some cases the `appSession` cookie is completely missing from PATCH requests, causing authentication failures. Enhanced logging shows `hasCookies: false` and empty `cookieNames` array in these cases (or only the `sidebar_state` cookie is present). We've added explicit runtime configuration for the API endpoint to ensure compatibility.

**UPDATE #2 (March 31, 2025)**: We've discovered that Auth0 allows configuring cookie settings through environment variables instead of hardcoding them in the auth0.js file. This is the recommended approach for changing the SameSite cookie policy. The key environment variable is `AUTH0_COOKIE_SAME_SITE` which can be set to 'lax', 'strict', or 'none' to control cross-origin cookie behavior.

## Key Insights

1. **Secure Cookies and HTTPS**: Modern browsers require cookies marked as `secure` to be sent over HTTPS. This is especially enforced for "non-simple" HTTP methods like PATCH.

2. **SameSite Cookie Policies**: Using `sameSite: 'lax'` ensures better browser compatibility than `none`, while still allowing authentication cookies to work across different request types.

3. **Cross-Origin Resource Sharing (CORS)**: PATCH requests trigger preflight OPTIONS requests, which need proper CORS headers to maintain authentication state.

## Changes Made

### 1. Middleware.js Update

**What Changed**: Updated the `getBaseUrl` function to always use HTTPS instead of conditionally using HTTP for localhost.

**Why**: This ensures consistent protocol usage across the application, which is essential for secure cookies to be properly sent with all request types.

```javascript
// Before
const protocol = host.includes('localhost') ? 'http' : 'https';

// After
return `https://${host}`;
```

### 2. Auth0 Cookie Configuration

**What Changed**: Modified to use environment variables for cookie settings, particularly sameSite.

**Why**: Using environment variables allows for configuration without code changes and is the recommended approach by Auth0.

```javascript
// Before
cookie: {
  httpOnly: true,
  secure: true,
  sameSite: 'lax', // Hardcoded value
  domain: process.env.NODE_ENV === 'production' ? '.xfoundry.org' : undefined
}

// After
cookie: {
  httpOnly: true,
  secure: true,
  // No sameSite value specified, uses AUTH0_COOKIE_SAME_SITE env variable
  domain: process.env.NODE_ENV === 'production' ? '.xfoundry.org' : undefined
}
```

Added to .env.local:
```
AUTH0_COOKIE_SAME_SITE="none"
```

This environment variable approach is recommended by Auth0 and ensures the appSession cookie will be included with cross-origin PATCH requests.

### 3. API Route CORS Handling

**What Changed**: Added proper CORS handlers for OPTIONS requests, improved debugging, and set explicit Node.js runtime.

**Why**: PATCH requests trigger preflight OPTIONS requests that need correct CORS headers to maintain authentication. Edge Runtime has compatibility issues with Auth0.

```javascript
// Force Node.js runtime for Auth0 compatibility
export const runtime = 'nodejs';

// Extract cookie names for debugging
const cookieNames = req.headers.cookie 
  ? req.headers.cookie.split(';')
      .map(c => c.trim())
      .map(c => c.split('=')[0]) 
  : [];

// Enhanced OPTIONS handler
if (req.method === 'OPTIONS') {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, PATCH, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  return res.status(200).end();
}
```

### 4. Fetch Request Configuration

**What Changed**: Simplified the fetch configuration in the useUpdateProfile mutation hook.

**Why**: Minimized code while keeping only the essential `credentials: 'include'` setting that ensures cookies are sent with requests.

```javascript
// Before
const response = await fetch(`/api/user/profile`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    "X-Transaction-ID": transactionId
  },
  credentials: 'include',
  body: JSON.stringify(dataToSend),
  signal: AbortSignal.timeout(10000)
});

// After
const response = await fetch(`/api/user/profile`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json"
  },
  credentials: 'include',
  body: JSON.stringify(dataToSend)
});
```

### 5. Next.js Configuration

**What Changed**: Updated next.config.mjs to ensure consistent HTTPS usage.

**Why**: This ensures that all URLs in the application use HTTPS, which is required for secure cookies to function properly.

## Codebase Design Principles

As requested, our approach to this project focuses on:

1. **Simplicity and Streamlined Implementation**: Using the simplest code necessary to achieve functionality. If a feature can be implemented with defaults, we prefer that over custom configurations.

2. **Avoid Explicit Settings When Unnecessary**: Only explicitly specifying parameters when they're different from defaults or when absolutely necessary for functionality.

3. **Following Official Patterns**: Adhering to the recommended implementation patterns from Auth0 and other libraries rather than creating custom solutions.

4. **Clean, Minimal Code**: Removing extraneous code, comments, and configurations that don't directly contribute to functionality.

5. **Using Default Handling Where Possible**: Leveraging default behaviors of libraries and frameworks when they meet our needs.

## Comprehensive Solution

After thorough investigation, we implemented a three-part solution:

1. **Environment Variable Configuration**: Auth0 provides environment variables for cookie settings. We added `AUTH0_COOKIE_SAME_SITE="none"` to our .env.local file, which is more maintainable than hardcoding in the auth0.js file.

2. **Force Node.js Runtime**: Added `export const runtime = 'nodejs'` to API routes that use Auth0, avoiding Edge Runtime compatibility issues with Auth0's dependencies.

3. **Better Client-Side Cookie Handling**: Enhanced debugging to verify cookies are properly included with PATCH requests, with complete client-side logging.

4. **Centralized Authentication Logic**: Consolidated profile update code to use the central mutation function, eliminating inconsistent implementations.

## Future Considerations

1. **Environment Consistency**: Ensure the development environment consistently uses HTTPS via the `--experimental-https` flag in package.json.

2. **Dependency Versions**: Keep Auth0 and NextJS packages updated to benefit from the latest security improvements.

3. **Browser Compatibility**: The current solution works across modern browsers, but if supporting older browsers becomes necessary, additional configuration might be needed.

4. **Monitoring**: Keep an eye on authentication errors in logs to identify any regressions or new issues that might emerge.

5. **Edge Runtime Compatibility**: Consider alternatives to using Auth0 in Edge Runtime contexts, as it relies on Node.js APIs that aren't supported in Edge environments.

6. **Centralized API Authentication**: We identified multiple code paths handling profile updates inconsistently. Consider further consolidating authentication logic through a centralized client-side fetch utility that always ensures proper credentials are included.

7. **Consider NextAuth.js**: If Auth0 integration continues to be problematic, consider migrating to NextAuth.js which has deeper integration with Next.js and may provide better support for its unique features and environments.