# Authentication & Data Fetching Refactoring Plan

## Goals

1. Implement reliable authentication through Auth0
2. Create efficient, cached data fetching from Airtable
3. Minimize unnecessary API calls (only refresh on user action, data updates, and initial load)
4. Ensure user data isolation (no data sharing between users)
5. Reduce complexity and increase reliability

## Dependencies & Versions

### Core Dependencies
- Next.js: 14.2.25
- React: 18.3.1
- Auth0 SDK: @auth0/nextjs-auth0 v4.3.0 
- TanStack Query: @tanstack/react-query v5.67.1
- Airtable: 0.12.2

### Breaking Changes & Compatibility Notes

#### Auth0 SDK v4
- v4 is a major rewrite from v3 with significant API changes
- Node.js vs Edge runtime: Auth0 SDK v4 has compatibility issues with Edge Runtime
- `withApiAuthRequired` and `getSession` are preferred for API routes
- `withPageAuthRequired` is preferred for page-level protection
- `useUser()` hook for client-side user data access

#### Next.js 14
- App Router is the recommended router, but project still uses Pages Router
- API Routes work differently between the two routers
- Pages Router remains supported but with fewer optimizations

#### TanStack Query v5 
- Changed from v4 - completely new API
- `cacheTime` is now `gcTime`
- New approach to mutations
- Handles stale data and refetching automatically

## Current Issues

1. **Authentication Failures**: 
   - Cookie-based auth breaks during client-side PATCH requests
   - appSession cookie not being sent with certain request types
   - Inconsistent authentication between page loads

2. **Caching Problems**:
   - Excessive Airtable API calls
   - Cache invalidation not properly scoped to specific users
   - Stale data persisting between users or sessions

3. **Architectural Concerns**:
   - Mixing server-side and client-side authentication approaches
   - Complex workarounds for cookie/session management
   - Inconsistent API route patterns

## Refactoring Approach

### 1. Authentication Layer

#### Auth0 Configuration Simplification
```javascript
// lib/auth0.js - Simplified configuration
import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  // Required properties only
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.AUTH0_BASE_URL || 'https://hub.xfoundry.org',
  
  // Simple cookie settings, rely on defaults where possible
  session: {
    rollingDuration: 24 * 60 * 60, // 24 hours
    absoluteDuration: 7 * 24 * 60 * 60, // 7 days
  },
  
  // Routes for client-side navigation
  routes: {
    callback: '/auth/callback',
    login: '/auth/login',
    logout: '/auth/logout'
  }
});

export default auth0;
```

#### Middleware Simplification
```javascript
// middleware.js - Remove custom auth logic
import { NextResponse } from 'next/server';
import { auth0 } from './lib/auth0';

export async function middleware(request) {
  // Process Auth0 authentication routes
  const authResponse = await auth0.middleware(request);
  if (authResponse) {
    return authResponse;
  }
  
  // Simple redirect handling for legacy routes
  const { pathname } = request.nextUrl;
  
  // Handle redirects only, no authentication logic
  // Auth will be handled at the page/API level
  
  // Continue the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
```

#### Protected Pages
```javascript
// pages/dashboard/index.js
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useUser } from '@auth0/nextjs-auth0';

function Dashboard() {
  const { user, isLoading } = useUser();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Welcome {user.name}</h1>
      {/* Dashboard content */}
    </div>
  );
}

// Server-side protection - redirects to login if not authenticated
export default withPageAuthRequired(Dashboard);
```

### 2. API Layer

#### Protected API Routes
```javascript
// pages/api/user/profile.js
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { getUserProfile, updateUserProfile } from '../../../lib/airtable';

export default withApiAuthRequired(async function handler(req, res) {
  // Force Node.js runtime for Auth0 compatibility
  // Edge Runtime has issues with Auth0 SDK
  export const runtime = 'nodejs';
  
  try {
    // Get Auth0 session
    const { user } = await getSession(req, res);
    
    // Simple method check
    if (req.method === 'GET') {
      const profile = await getUserProfile(user.email);
      return res.status(200).json({ profile });
    } 
    
    if (req.method === 'PATCH') {
      const updates = req.body;
      const updated = await updateUserProfile(user.email, updates);
      return res.status(200).json({ 
        success: true, 
        profile: updated
      });
    }
    
    // Method not allowed
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowedMethods: ['GET', 'PATCH']
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: error.message || 'An unexpected error occurred'
    });
  }
});
```

#### Airtable Services
```javascript
// lib/airtable.js
import Airtable from 'airtable';

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

// Simple server-side cache with TTL
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get user profile by email with caching
 */
export async function getUserProfile(email) {
  const cacheKey = `profile:${email}`;
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  // Not in cache or expired, fetch from Airtable
  try {
    const records = await base('Users').select({
      filterByFormula: `{Email} = '${email}'`,
      maxRecords: 1
    }).firstPage();
    
    if (records.length === 0) {
      throw new Error('User not found');
    }
    
    const profile = {
      id: records[0].id,
      ...records[0].fields,
      // Transform any fields as needed
    };
    
    // Store in cache
    cache.set(cacheKey, {
      data: profile,
      timestamp: Date.now()
    });
    
    return profile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Update user profile by email
 */
export async function updateUserProfile(email, updates) {
  try {
    // First get the record ID by email
    const records = await base('Users').select({
      filterByFormula: `{Email} = '${email}'`,
      maxRecords: 1
    }).firstPage();
    
    if (records.length === 0) {
      throw new Error('User not found');
    }
    
    const recordId = records[0].id;
    
    // Update the record
    const updated = await base('Users').update(recordId, updates);
    
    // Clear cache
    const cacheKey = `profile:${email}`;
    cache.delete(cacheKey);
    
    return {
      id: updated.id,
      ...updated.fields
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}
```

### 3. Client Layer

#### React Query Setup
```javascript
// lib/react-query.js
import { QueryClient } from '@tanstack/react-query';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity, // Don't automatically refetch
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
    },
  });
}
```

#### Data Hooks
```javascript
// hooks/use-profile.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useProfile() {
  const queryClient = useQueryClient();
  
  // Query for fetching profile
  const query = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('/api/user/profile');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch profile');
      }
      
      const data = await response.json();
      return data.profile;
    },
    // Only load once per session unless explicitly refreshed
    staleTime: Infinity,
  });
  
  // Mutation for updating profile
  const mutation = useMutation({
    mutationFn: async (updates) => {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
      
      const data = await response.json();
      return data.profile;
    },
    onSuccess: (updatedProfile) => {
      // Update cache with new data
      queryClient.setQueryData(['profile'], updatedProfile);
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
  
  // Function to refresh profile data
  const refreshProfile = () => {
    return queryClient.invalidateQueries({ queryKey: ['profile'] });
  };
  
  return {
    profile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    updateProfile: mutation.mutate,
    isUpdating: mutation.isPending,
    refreshProfile,
  };
}
```

#### Usage in Components
```jsx
// components/profile/ProfileForm.jsx
import { useProfile } from '../../hooks/use-profile';

export function ProfileForm() {
  const { profile, isLoading, updateProfile, isUpdating, refreshProfile } = useProfile();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    // other fields
  });
  
  // Initialize form with profile data once loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        // other fields
      });
    }
  }, [profile]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(formData);
  };
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={isUpdating}>
        {isUpdating ? 'Saving...' : 'Save Changes'}
      </button>
      
      <button type="button" onClick={refreshProfile}>
        Refresh Data
      </button>
    </form>
  );
}
```

### 4. Application Integration

#### _app.js Setup
```jsx
// pages/_app.js
import { Auth0Provider } from '@auth0/nextjs-auth0';
import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { createQueryClient } from '../lib/react-query';

function MyApp({ Component, pageProps }) {
  const [queryClient] = useState(() => createQueryClient());
  
  return (
    <Auth0Provider>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </Auth0Provider>
  );
}

export default MyApp;
```

## Transition Plan

1. **Authentication First**: Simplify Auth0 configuration before touching data layer
2. **API Routes Next**: Refactor API routes to use withApiAuthRequired consistently
3. **Client Hooks**: Create new data hooks with proper caching strategy
4. **Component Updates**: Update components to use new hooks
5. **Testing**: Thoroughly test all user scenarios

## Benefits of This Approach

1. **Simplified Auth**: Uses Auth0's recommended patterns for Next.js
2. **Clear Responsibilities**: 
   - Auth0 handles authentication
   - API routes handle data access
   - React Query handles client-side caching
3. **Proper Caching**: Data only refreshes when needed
4. **User Isolation**: Session-based authentication ensures user data separation
5. **Performance**: Reduced API calls to Airtable
6. **Maintainability**: Clean, consistent patterns throughout the codebase

## Implementation Notes

- Remove all custom cookie/token handling
- Eliminate workarounds for CORS/cookie issues
- Rely on Auth0's built-in session management
- Use explicit Node.js runtime for Auth0 API routes
- Set up proper TanStack Query invalidation patterns
- Keep API response formats consistent