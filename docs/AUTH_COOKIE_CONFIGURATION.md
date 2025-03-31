# Auth Cookie Configuration

This document explains the secure cookie configuration for authentication in our Next.js app with Auth0.

## Background

Our application experienced authentication issues with certain HTTP methods, specifically `PATCH` requests during profile updates. These requests would fail with `401 Unauthorized` errors, despite having valid Auth0 sessions for regular `GET` requests.

## Root Cause

The root cause was identified as incompatible cookie configuration with modern browser security policies:

1. **SameSite Setting**: Using `sameSite: 'none'` without `secure: true` is not allowed in modern browsers. This caused the browser to not send the authentication cookie with certain requests, particularly non-simple requests like `PATCH`.

2. **Development vs. Production**: The application was using different cookie settings in development (`secure: false`) and production (`secure: true`), causing inconsistent behavior.

3. **HTTP vs. HTTPS**: Secure cookies require HTTPS, even in development. The development server was running on HTTP, preventing secure cookies from working properly.

## Solution Implemented

We've made the following changes to fix the issue:

1. **Cookie Configuration**: Updated `lib/auth0.js` to:
   - Always use `secure: true` (both in development and production)
   - Changed `sameSite` from `'none'` to `'lax'` for better browser compatibility

2. **HTTPS in Development**: Modified development environment to support HTTPS:
   - Updated `next.config.mjs` to use HTTPS URLs in development
   - Added `--experimental-https` flag to the dev script in `package.json`
   - Kept legacy HTTP dev script as `dev-legacy` for compatibility

3. **Documentation**: Updated README and added this document to explain the changes

## How This Fixes the Issue

- Secure cookies are now properly sent with all request types, including `PATCH` requests
- Authentication state is maintained consistently across different API calls
- Both GET and PATCH requests now successfully authenticate with the server

## Testing the Fix

To verify the fix is working:

1. Run the application with the new HTTPS development server: `npm run dev`
2. Log in to the application
3. Edit your profile and save changes
4. Verify that the profile updates without any 401 errors
5. Check the network tab in browser developer tools to confirm authentication cookies are being sent with PATCH requests

## Potential Issues

- **Self-Signed Certificate**: The development server uses a self-signed certificate, which may trigger browser warnings. You'll need to accept these to access the site.
- **Existing Sessions**: Users with existing sessions may need to log out and log back in after these changes are deployed.
- **Legacy Code**: Some older code may assume HTTP URLs or non-secure cookies. Watch for any unexpected behavior.

## References

- [MDN Web Docs: Set-Cookie SameSite](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [Auth0 Cookie Settings Documentation](https://auth0.com/docs/sessions/cookies)
- [Next.js HTTPS in Development](https://nextjs.org/docs/pages/building-your-application/configuring/https)
