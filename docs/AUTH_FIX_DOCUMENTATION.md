# Authentication and Data Fetching Refactoring Documentation

## Overview

This document describes the comprehensive refactoring of the xFoundry Dashboard's authentication and data fetching systems. The refactoring addresses profile update authentication issues after migrating from Auth0 v3 to v4 and introduces a new domain-driven design approach for Airtable data access.

## Authentication Refactoring

### Goals

1. Fix authentication failures during profile updates where cookies weren't being sent with PATCH requests
2. Implement a clean, modern approach following Auth0 v4 best practices
3. Simplify Auth0 configuration and middleware
4. Use withApiAuthRequired for consistent API route protection

### Implementation

#### 1. Auth0 Configuration (lib/auth0.js)

The Auth0 client configuration was simplified to rely on environment variables with minimal customization:

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

All API routes were refactored to use withApiAuthRequired:

```javascript
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

export default withApiAuthRequired(async function handler(req, res) {
  try {
    const { user } = await getSession(req, res);
    // API handler logic
  } catch (error) {
    // Error handling
  }
});
```

#### 4. PATCH Request Workaround

A workaround was implemented for profile update PATCH requests to handle SameSite cookie issues in some browsers:

```javascript
// In useUpdateProfile hook
const method = "POST";
const modifiedData = {
  ...dataToSend,
  _method: "PATCH" // Signal to server this should be treated as PATCH
};

// In API handler
if (req.method === 'POST' && req.body._method?.toUpperCase() === 'PATCH') {
  return handleUpdateRequest(req, res, user, startTime);
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

**Client (client.js)**: Handles Airtable client initialization and provides query execution with error handling:

```javascript
export function executeQuery(queryFn) {
  try {
    return await queryFn();
  } catch (error) {
    // Enhanced error handling with request ID, timestamps, etc.
    throw enhancedError;
  }
}
```

**Cache (cache.js)**: Provides a consistent caching mechanism:

```javascript
export function getCachedOrFetch(cacheKey, fetchFn, ttl = 300, retryCount = 0) {
  // Cache check logic
  // Fetch and cache logic with retry capabilities
  // Stale data handling
}
```

**Throttle (throttle.js)**: Prevents rate limiting issues:

```javascript
export async function throttleRequests() {
  // Rate limit calculation
  // Request timing and tracking
  // Delay calculation when needed
}
```

**Errors (errors.js)**: Standardized error handling:

```javascript
export class AirtableError extends Error {
  // Enhanced error type with context
}

export function handleAirtableError(error, operation, context = {}) {
  // User-friendly error messages based on error type
}
```

#### 2. Table Definitions

Table definitions provide abstracted access to Airtable tables:

```javascript
export function getTable(tableId) {
  // Table caching and access logic
}

export function getContactsTable() {
  return getTable('CONTACTS');
}
```

#### 3. Entity Operations

Entity modules provide domain-specific operations:

**Users (users.js)**:
```javascript
export async function getUserByAuth0Id(auth0Id, options = {}) {
  // Cached fetching with consistent patterns
}

export async function updateUserProfile(contactId, data) {
  // Update logic with proper error handling
}
```

**Education (education.js)**:
```javascript
export async function getEducation(educationId, options = {}) {
  // Education record fetching
}

export async function updateEducation(data) {
  // Education update logic
}
```

#### 4. React Query Hooks

These hooks provide React components with access to the data layer:

```javascript
export function useProfileData() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      // API call logic
    },
    // Query configuration
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: async (updatedData) => {
      // Update API call
    },
    // Optimistic updates, error handling, cache invalidation
  });
}
```

### Benefits of Domain-Driven Design

1. **Modularity**: Each module has a single responsibility, making the code easier to understand and maintain
2. **Consistency**: Standardized patterns for data fetching, caching, and error handling
3. **Performance**: Optimized caching and data loading improves responsiveness
4. **Maintainability**: Smaller, focused modules are easier to update and debug
5. **Testability**: Isolated modules are easier to test
6. **Error Handling**: Consistent error handling improves user experience

## Example API Implementation

The `/api/user/profile.js` endpoint showcases the integration of Auth0 v4 best practices with the new domain-driven design:

```javascript
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { 
  getUserByAuth0Id,
  updateUserProfile 
} from "../../../lib/airtable/entities/users";
import { 
  getEducation, 
  updateEducation 
} from "../../../lib/airtable/entities/education";

export default withApiAuthRequired(async function handler(req, res) {
  // Get session using Auth0 v4 withApiAuthRequired + getSession pattern
  const { user } = await getSession(req, res);
  
  // Method handling with support for _method override
  switch (req.method) {
    case 'GET':
      return handleGetRequest(req, res, user);
    case 'PATCH':
    case 'PUT':
      return handleUpdateRequest(req, res, user);
    case 'POST':
      // Special case for POST with _method override
      if (req.body._method?.toUpperCase() === 'PATCH') {
        return handleUpdateRequest(req, res, user);
      }
      // ...
  }
});

async function handleGetRequest(req, res, user) {
  // Get the user profile from our entity layer
  const baseProfile = await getUserByAuth0Id(user.sub);
  
  // Fetch education and institution data if available
  const educationData = await getEducation(educationId);
  
  // Build complete profile with related data
  // Return response
}

async function handleUpdateRequest(req, res, user) {
  // Extract update data
  const { contactId, ...updateData } = req.body;
  
  // Update user profile
  await updateUserProfile(contactId, enhancedUpdateData);
  
  // Update education data if needed
  await updateEducation(educationData);
  
  // Return success response
}
```

## Testing and Verification

A new debug endpoint was created at `/api/debug/auth-status.js` to help diagnose authentication issues:

```javascript
export default withApiAuthRequired(async function handler(req, res) {
  // Get session information
  const session = await getSession(req, res);
  
  // Fetch Airtable user data
  const profileData = await getUserByAuth0Id(session.user.sub);
  
  // Return sanitized debug information
  return res.status(200).json({
    status: 'authenticated',
    session: sanitizedSession,
    profile: profileData ? {
      // Sanitized profile data
    } : null,
    request: {
      // Request information for debugging
    },
    // Environment information
  });
});
```

## Next Steps

1. **Complete Entity Modules**: Implement remaining entity modules (participation, teams, etc.)
2. **React Query Hooks**: Develop the complete set of React Query hooks
3. **API Updates**: Refactor remaining API endpoints to use the new architecture
4. **Component Updates**: Update React components to use the new hooks
5. **Legacy Code Removal**: Remove the monolithic airtable.js file after all functionality is migrated
6. **Testing and Validation**: Comprehensive testing of all refactored functionality

## Conclusion

This refactoring addresses the authentication issues while simultaneously improving the overall architecture through domain-driven design. The new approach is more maintainable, better organized, and follows modern best practices for both Auth0 integration and data access.