# Authentication and Data Fetching Refactoring Documentation

## Overview

This document describes the comprehensive refactoring of the xFoundry Dashboard's authentication and data fetching systems. The refactoring addresses profile update authentication issues after migrating from Auth0 v3 to v4 and introduces a new domain-driven design approach for Airtable data access.

## Authentication Refactoring

### Goals

1. Fix authentication failures during profile updates where cookies weren't being sent with PATCH requests
2. Implement a clean, modern approach following Auth0 v4 best practices
3. Simplify Auth0 configuration and middleware
4. Use Auth0 SDK for consistent API route protection

### Implementation

#### 1. Auth0 Configuration (lib/auth0.js)

The Auth0 client configuration was enhanced to provide more features:

```javascript
export const auth0 = new Auth0Client({
  // Session configuration for persistent sessions
  session: {
    rollingDuration: 24 * 60 * 60, // 24 hours
    absoluteDuration: 7 * 24 * 60 * 60, // 7 days
    
    // Cookie settings - only specify what differs from Auth0 defaults
    cookie: {
      // Only set domain in production to allow localhost in dev
      domain: process.env.NODE_ENV === 'production' ? '.xfoundry.org' : undefined
    },
    
    // Always store ID Token in session
    storeIDToken: true
  },
  
  // Default authorization parameters
  authorizationParameters: {
    scope: 'openid profile email'
  },
  
  // Standard routes - these match our existing routes
  routes: {
    callback: '/auth/callback',
    login: '/auth/login',
    logout: '/auth/logout'
  },
  
  // Custom session enhancement - adds user metadata to session
  async onSessionCreated({ session, user }) {
    // Add custom claims to session
    session.user.firstName = user.given_name || user.name?.split(' ')[0] || '';
    session.user.lastName = user.family_name || user.name?.split(' ').slice(1).join(' ') || '';
    
    // Add user metadata from Auth0 if available
    if (user.user_metadata) {
      // Copy specific metadata fields to the session
      const {
        contactId, airtableId, institutionId, institution,
        firstName, lastName, referralSource, onboarding,
        onboardingCompleted, selectedCohort
      } = user.user_metadata;
      
      // Add fields to session if they exist
      if (contactId) session.user.contactId = contactId;
      if (airtableId) session.user.airtableId = airtableId;
      if (institutionId) session.user.institutionId = institutionId;
      if (institution) session.user.institution = institution;
      if (firstName) session.user.firstName = firstName;
      if (lastName) session.user.lastName = lastName;
      if (referralSource) session.user.referralSource = referralSource;
      if (onboarding) session.user.onboarding = onboarding;
      if (typeof onboardingCompleted !== 'undefined') session.user.onboardingCompleted = onboardingCompleted;
      if (selectedCohort) session.user.selectedCohort = selectedCohort;
    }
    
    return session;
  }
});
```

#### 2. Middleware (middleware.js)

The middleware was simplified to focus solely on Auth0 authentication and route protection:

```javascript
export async function middleware(request) {
  // Process Auth0 authentication routes - handles login, callback, logout
  const authResponse = await auth0.middleware(request);
  if (authResponse) {
    return authResponse;
  }
  
  // Protected routes logic
  const { pathname, search } = request.nextUrl;
  const shouldProtect = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  if (shouldProtect) {
    // Session validation and redirect logic
    const session = await auth0.getSession(request);
    if (!session) {
      // Redirect to login with return URL
    }
  }

  return NextResponse.next();
}
```

#### 3. API Route Protection

API routes were refactored to use a consistent auth0.getSession pattern instead of the withApiAuthRequired wrapper:

```javascript
// Standard pattern for protected API routes
export default async function handler(req, res) {
  try {
    // Get Auth0 session and validate user is authenticated
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({
        error: 'Not authenticated'
      });
    }
    const { user } = session;
    
    // API handler logic
  } catch (error) {
    // Error handling
  }
}
```

#### 4. PATCH Request Workaround

A workaround was implemented for profile update PATCH requests to handle SameSite cookie issues in some browsers:

```javascript
// In API handler
switch (req.method) {
  case 'PATCH':
  case 'PUT':
    return handleUpdateRequest(req, res, user, startTime);
  
  case 'POST':
    // Special case for POST with _method override
    const method = req.body._method?.toUpperCase();
    if (method === 'PATCH') {
      return handleUpdateRequest(req, res, user, startTime);
    }
    // Handle normal POST...
}
```

## Domain-Driven Design for Airtable Integration

### Goals

1. Replace the monolithic 3,000+ line airtable.js file with a modular, maintainable structure
2. Separate concerns for caching, data fetching, error handling, and business logic
3. Create consistent patterns for data access
4. Optimize API calls with better caching and throttling
5. Improve code organization and maintainability

### Folder Structure

The refactored code follows this domain-driven design structure:

```
lib/
  airtable/
    core/           # Core utilities
      client.js     # Airtable client configuration
      cache.js      # Caching mechanisms
      throttle.js   # Rate limiting logic
      errors.js     # Error handling utilities
      index.js      # Re-exports
    
    tables/         # Table definitions
      definitions.js # Table access functions
      index.js      # Re-exports
    
    entities/       # Entity-specific operations
      users.js      # User profile operations
      education.js  # Education operations
      institutions.js # Institution operations
      [other entities]
      index.js      # Re-exports
    
    hooks/          # React Query hooks
      useProfile.js # Hooks for profile data
      [other hooks]
      index.js      # Re-exports
    
    index.js        # Main entry point
```

### Key Components

#### 1. Core Utilities

**Client (client.js)**: Handles Airtable client initialization and provides query execution with error handling.

**Cache (cache.js)**: Provides a consistent caching mechanism with TTL support.

**Throttle (throttle.js)**: Prevents rate limiting issues with request spacing.

**Errors (errors.js)**: Standardized error handling with useful context.

#### 2. Table Definitions

Table definitions provide abstracted access to Airtable tables with cleaner internal naming.

#### 3. Entity Operations

Entity modules provide domain-specific operations for different business entities:

- **Users (users.js)**: User profile management
- **Education (education.js)**: Education data operations
- **Institutions (institutions.js)**: Institution data operations

#### 4. React Query Hooks

These hooks provide React components with access to the data layer using React Query.

### Benefits of Domain-Driven Design

1. **Modularity**: Each module has a single responsibility, making the code easier to understand and maintain
2. **Consistency**: Standardized patterns for data fetching, caching, and error handling
3. **Performance**: Optimized caching and data loading improves responsiveness
4. **Maintainability**: Smaller, focused modules are easier to update and debug
5. **Testability**: Isolated modules are easier to test
6. **Error Handling**: Consistent error handling improves user experience

## Auth0 API Route Protection Enhancement

The codebase previously used the Auth0 v4 `withApiAuthRequired` helper function to protect API routes. However, this led to compatibility issues in production builds. We've made the following changes:

1. Identified that the `withApiAuthRequired` function was causing build errors in the production environment
2. Changed all API routes to use direct `auth0.getSession()` verification instead, following this pattern:

```javascript
export default async function handler(req, res) {
  try {
    // Get Auth0 session and validate user is authenticated
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({
        error: 'Not authenticated'
      });
    }
    const { user } = session;
    
    // API handler logic
  } catch (error) {
    // Error handling
  }
}
```

3. Used direct path imports instead of aliases to improve build reliability:
```javascript
// Instead of this:
import { auth0 } from "@/lib/auth0";

// Use this:
import { auth0 } from "../../../lib/auth0";
```

4. Removed remaining imports of `withApiAuthRequired` to prevent potential build issues
5. Added optional chaining for better error handling (e.g., `req.body?._method?.toUpperCase()`)
6. Added detailed comments about the auth approach in each file

These changes maintain the same security model while fixing compatibility issues with production builds.

## Implementation Progress

The refactoring now includes:

1. Complete authentication system overhaul using Auth0 v4 direct session validation
2. Setting up the new folder structure for domain-driven design
3. Implementing core utilities (client, cache, throttle, errors)
4. Creating table definitions for centralized Airtable access
5. Implementing initial entity modules (users, education, institutions) 
6. Creating debug endpoints for authentication testing
7. Refactoring the profile API endpoint to use the new design patterns
8. Fixing build-time errors related to Auth0 authentication in API routes

## Next Steps

1. **Complete Entity Modules**: Implement remaining entity modules (participation, teams, etc.)
2. **Develop React Query Hooks**: Create the complete set of React Query hooks
3. **Refactor API Endpoints**: Update remaining API endpoints to use the new pattern
4. **Update Components**: Modify React components to use the new hooks
5. **Remove Legacy Code**: Gradually replace the monolithic airtable.js file
6. **Test Edge Cases**: Thoroughly test authentication in various browsers and environments