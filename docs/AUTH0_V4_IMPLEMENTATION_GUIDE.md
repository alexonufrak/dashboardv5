# Auth0 v4 Implementation Guide for xFoundry Dashboard

## Overview
This document outlines our plan to implement Auth0 v4 from scratch in the xFoundry Dashboard project. We aim to create a clean, proper implementation that follows Auth0's best practices while ensuring compatibility with our existing Pages Router in Next.js.

## Prompting Guidelines
When working with Claude on this implementation:

1. **Start Fresh**: Create a clean new version of Auth0 v4 integration. Don't hesitate to edit or delete existing Auth0-related files to avoid conflicts.

2. **Web Research**: Consistently use web fetching to get the latest information on Auth0 v4 implementation, especially focusing on Pages Router compatibility.

3. **Be Thorough**: Consider all dependencies, Vercel deployment specifics, and proper implementation for our specific Next.js version.

4. **Test Early**: After each implementation phase, test authentication flows to ensure they work as expected.

5. **Document Changes**: Document significant changes for future reference.

## Implementation Plan

### Phase 1: Preparation
1. **Remove current Auth0 implementation**
   - Remove or disable Auth0 v3 routes and configurations
   - Clean up any Auth0-related handlers and middleware
   - Document current authentication workflows to preserve

2. **Set up environment variables**
   - Rename `AUTH0_BASE_URL` to `APP_BASE_URL` 
   - Ensure `AUTH0_DOMAIN` is set (from previous `AUTH0_ISSUER_BASE_URL` without protocol)
   - Keep `AUTH0_CLIENT_ID` and `AUTH0_CLIENT_SECRET`
   - Add `AUTH0_SECRET` for cookie encryption

### Phase 2: Core Implementation
1. **Create Auth0 client initialization**
   - Create `lib/auth0.js` with the new Auth0Client
   - Add proper configuration with hooks for session management
   - Implement Management API access for user metadata operations

2. **Set up authentication middleware**
   - Update `middleware.js` to mount Auth0 middleware
   - Configure route matchers for Auth0 routes
   - Add proper error handling

3. **Update route structure**
   - Adjust to new auth paths: `/auth/*` instead of `/api/auth/*`
   - Handle any custom logic from previous implementation

### Phase 3: Component Updates
1. **Update client-side components**
   - Change imports to use `@auth0/nextjs-auth0/client`
   - Update components using `withPageAuthRequired` to use `getSession()` or `useUser()` hook

2. **Update server-side logic**
   - Update API routes using `withApiAuthRequired` to use direct session checks
   - Implement proper error handling for authentication failures

### Phase 4: Custom Features
1. **Implement session enhancement**
   - Add hooks to enhance user session with custom data (institution, profile info)
   - Configure session update mechanisms

2. **Handle user metadata**
   - Implement functions to update and retrieve user metadata
   - Set up API endpoints for metadata management

### Phase 5: Testing & Deployment
1. **Local testing**
   - Test all authentication flows: login, logout, session persistence
   - Test all protected routes and components
   - Test error handling scenarios

2. **Deployment testing**
   - Test deployment to ensure environment variables are correctly set
   - Verify authentication works in production environment

## Key Differences from Auth0 v3
- Middleware-based authentication rather than API routes
- Different configuration structure and environment variables
- Authentication routes mounted at `/auth/*` not `/api/auth/*`
- Session access via `auth0.getSession()` instead of `getSession()`
- No `withPageAuthRequired` or `withApiAuthRequired` helpers
- Direct management of authorization parameters
- More flexibility in session handling

## References
- [Auth0 Next.js SDK Repository](https://github.com/auth0/nextjs-auth0)
- [V4 Migration Guide](https://github.com/auth0/nextjs-auth0/blob/main/V4_MIGRATION_GUIDE.md)
- [Auth0 Examples](https://github.com/auth0/nextjs-auth0/blob/main/EXAMPLES.md)

## Implementation Notes
Add implementation details, challenges, and solutions here as we proceed.

---

*Last updated: March 29, 2025*