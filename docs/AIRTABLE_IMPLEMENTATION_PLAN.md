# Airtable Implementation Plan - Senior Developer Approach

## Project Overview

This document outlines a methodical, senior developer approach to completing the Airtable refactoring work. It builds upon our existing domain-driven architecture and focuses on creating maintainable, robust, and scalable code.

## Principles

As senior developers, we adhere to these principles:

1. **Modularity**: Each component should have a single responsibility and clear interfaces
2. **Consistency**: Patterns should be consistent across the codebase
3. **Robustness**: Error handling, validation, and edge cases should be comprehensive
4. **Performance**: Optimize for both speed and resource utilization
5. **Testability**: Code should be easily testable with clear dependency injection
6. **Documentation**: Self-documenting code with appropriate comments and documentation
7. **Progressive Refinement**: Improve systematically while maintaining compatibility

## Implementation Strategy

### Phase 1: Holistic API Layer Refactoring

Rather than migrating routes piecemeal, we'll implement a comprehensive API middleware pattern to standardize request handling.

```javascript
// lib/api/middleware.js
import { auth0 } from '@/lib/auth0';

/**
 * Creates a standardized API handler with authentication and error handling
 * 
 * @param {Object} handlers - Method handlers object (GET, POST, etc.)
 * @param {Object} options - Configuration options
 * @returns {Function} Next.js API route handler
 */
export function createApiHandler(handlers, options = {}) {
  const { 
    requireAuth = true,
    cors = false,
    rateLimiting = false
  } = options;
  
  return async function apiHandler(req, res) {
    // Start timing for performance monitoring
    const startTime = Date.now();
    
    // CORS handling if enabled
    if (cors) {
      res.setHeader('Access-Control-Allow-Credentials', true);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
      res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
      
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
    }
    
    try {
      // Apply rate limiting if enabled
      if (rateLimiting) {
        // Implementation of rate limiting logic
      }
      
      // Authentication
      let session = null;
      let user = null;
      
      if (requireAuth) {
        session = await auth0.getSession(req, res);
        if (!session?.user) {
          return res.status(401).json({ 
            error: "Not authenticated",
            message: "You must be logged in to access this resource"
          });
        }
        user = session.user;
      }
      
      // Method handling
      const handler = handlers[req.method];
      
      if (!handler) {
        return res.status(405).json({ 
          error: "Method not allowed",
          message: `The method ${req.method} is not allowed for this endpoint`,
          allowedMethods: Object.keys(handlers)
        });
      }
      
      // Execute the appropriate handler
      await handler(req, res, { user, session });
      
      // Log performance metrics
      const duration = Date.now() - startTime;
      console.log(`[API] ${req.method} ${req.url} - ${duration}ms`);
      
    } catch (error) {
      // Standardized error handling
      console.error(`[API Error] ${req.method} ${req.url}:`, error);
      
      // Determine appropriate status code
      const statusCode = error.status || error.statusCode || 500;
      
      // Create standardized error response
      const errorResponse = {
        error: error.code || "server_error",
        message: error.message || "An unexpected error occurred",
        requestId: `req_${Date.now().toString(36)}`,
        timestamp: new Date().toISOString()
      };
      
      // Include stack trace in development
      if (process.env.NODE_ENV !== 'production') {
        errorResponse.stack = error.stack;
      }
      
      return res.status(statusCode).json(errorResponse);
    }
  };
}
```

Using this pattern for API routes:

```javascript
// pages/api/user/profile.js
import { createApiHandler } from '@/lib/api/middleware';
import { getUserByEmail, updateUserProfile } from '@/lib/airtable/entities/users';

export default createApiHandler({
  GET: async (req, res, { user }) => {
    const profile = await getUserByEmail(user.email);
    return res.status(200).json({ profile });
  },
  
  PATCH: async (req, res, { user }) => {
    const { contactId, ...updates } = req.body;
    
    // Validate the contactId matches the authenticated user
    const existingProfile = await getUserByEmail(user.email);
    if (existingProfile.contactId !== contactId) {
      return res.status(403).json({ 
        error: 'forbidden',
        message: 'You cannot update another user\'s profile'
      });
    }
    
    const updated = await updateUserProfile(contactId, updates);
    return res.status(200).json({ profile: updated });
  }
}, {
  requireAuth: true
});
```

### Phase 2: Enhanced React Query Pattern

Create a factory function to standardize hook creation, ensuring consistent error handling, loading states, and caching policies:

```javascript
// lib/hooks/createDataHook.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Creates a standardized data fetching hook with consistent patterns
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} Custom hook with data fetching capabilities
 */
export function createDataHook(options) {
  const {
    queryKey,
    endpoint,
    fetchFn,
    updateFn,
    refetchOnFocus = false,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 0,
    errorMessage = 'An error occurred',
    successMessage = 'Successfully updated',
    normalizeData = data => data,
    transformError = error => error?.message || errorMessage,
  } = options;
  
  // Return the custom hook
  return function useData(params = {}) {
    const queryClient = useQueryClient();
    
    // Default fetch function using the endpoint
    const defaultFetchFn = async () => {
      let url = endpoint;
      
      // Add query parameters if provided
      if (Object.keys(params).length > 0) {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value);
          }
        });
        url = `${endpoint}?${queryParams.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch data');
      }
      
      const data = await response.json();
      return normalizeData(data);
    };
    
    // Use the provided fetch function or the default one
    const queryFn = fetchFn || defaultFetchFn;
    
    // Create the query with consistent configuration
    const query = useQuery({
      queryKey: Array.isArray(queryKey) ? queryKey : [queryKey, params],
      queryFn,
      staleTime,
      gcTime: cacheTime,
      refetchOnWindowFocus: refetchOnFocus,
      retry: (failureCount, error) => {
        // Don't retry authentication errors or bad requests
        if (error?.status === 401 || error?.status === 400) {
          return false;
        }
        // Retry other errors up to 2 times
        return failureCount < 2;
      }
    });
    
    // Default update function
    const defaultUpdateFn = async (data) => {
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update data');
      }
      
      return normalizeData(await response.json());
    };
    
    // Create mutation if an update function is provided or using the default
    const mutation = updateFn || defaultUpdateFn ? useMutation({
      mutationFn: updateFn || defaultUpdateFn,
      onSuccess: (data) => {
        // Invalidate the query cache
        queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
        
        // Show success message
        if (successMessage) {
          toast.success(successMessage);
        }
        
        return data;
      },
      onError: (error) => {
        // Show error message
        toast.error(transformError(error));
        
        return error;
      }
    }) : null;
    
    // Return a consistent interface
    return {
      data: query.data,
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
      refetch: query.refetch,
      update: mutation?.mutate,
      isUpdating: mutation?.isPending,
      updateAsync: mutation?.mutateAsync,
    };
  };
}
```

Example usage:

```javascript
// hooks/useProfile.js
import { createDataHook } from '@/lib/hooks/createDataHook';

export const useProfile = createDataHook({
  queryKey: 'profile',
  endpoint: '/api/user/profile',
  staleTime: 10 * 60 * 1000, // 10 minutes
  errorMessage: 'Failed to load profile',
  successMessage: 'Profile updated successfully',
  normalizeData: (data) => data.profile || data,
});
```

### Phase 3: Component Architecture Enhancements

Create a standardized pattern for components that need to fetch and display data:

```jsx
// components/common/DataDisplay.js
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

/**
 * A reusable component for displaying data with consistent loading and error states
 */
export function DataDisplay({
  data,
  isLoading,
  isError,
  error,
  refetch,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  showRefresh = true,
}) {
  // Custom loading component or fallback to skeleton
  const LoadingState = loadingComponent || (
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
  
  // Custom error component or fallback to alert
  const ErrorState = errorComponent || (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error?.message || 'Failed to load data'}
        {showRefresh && (
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2" 
            onClick={() => refetch()}
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
  
  // Custom empty state or fallback to message
  const EmptyState = emptyComponent || (
    <div className="text-center p-4 text-muted-foreground">
      No data found
    </div>
  );
  
  // Handle loading state
  if (isLoading) {
    return LoadingState;
  }
  
  // Handle error state
  if (isError) {
    return ErrorState;
  }
  
  // Handle empty state
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return EmptyState;
  }
  
  // Render the actual content
  return children(data);
}
```

Example usage:

```jsx
// components/profile/ProfileCard.js
import { useProfile } from '@/hooks/useProfile';
import { DataDisplay } from '@/components/common/DataDisplay';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function ProfileCard() {
  const { data: profile, isLoading, isError, error, refetch } = useProfile();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <DataDisplay
          data={profile}
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
          emptyComponent={
            <div className="text-center p-4">
              Profile not found. Please complete onboarding.
            </div>
          }
        >
          {(data) => (
            <div className="space-y-2">
              <h3 className="text-lg font-medium">{data.firstName} {data.lastName}</h3>
              <p className="text-muted-foreground">{data.email}</p>
              {/* Additional profile information */}
            </div>
          )}
        </DataDisplay>
      </CardContent>
    </Card>
  );
}
```

### Phase 4: Testing Strategy

Implement a comprehensive testing approach for the refactored code:

```javascript
// __tests__/hooks/useProfile.test.js
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '../testUtils';
import { useProfile } from '@/hooks/useProfile';

// Mock fetch responses
global.fetch = jest.fn();

describe('useProfile hook', () => {
  beforeEach(() => {
    fetch.mockClear();
  });
  
  it('should fetch profile data successfully', async () => {
    // Mock successful response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: { firstName: 'John', lastName: 'Doe' } }),
    });
    
    // Render the hook with a QueryClientProvider wrapper
    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });
    
    // Initially loading
    expect(result.current.isLoading).toBe(true);
    
    // Wait for the query to resolve
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    // Check the result
    expect(result.current.data).toEqual({ firstName: 'John', lastName: 'Doe' });
    expect(result.current.isError).toBe(false);
    
    // Verify the fetch call
    expect(fetch).toHaveBeenCalledWith('/api/user/profile');
  });
  
  it('should handle fetch errors correctly', async () => {
    // Mock error response
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Failed to load profile' }),
    });
    
    // Render the hook
    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });
    
    // Wait for the query to resolve
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    // Check the error state
    expect(result.current.isError).toBe(true);
    expect(result.current.error.message).toBe('Failed to load profile');
  });
});
```

## Execution Plan

### Week 1: Enhanced Infrastructure

1. **API Middleware Pattern**
   - Create the API handler factory
   - Implement standardized error handling
   - Add performance monitoring
   - Set up CORS handling and rate limiting where needed

2. **React Query Patterns**
   - Create the data hook factory
   - Standardize error handling and loading states
   - Implement consistent caching policies
   - Create enhanced testing utilities

### Week 2: Shared Components & API Routes

1. **Common Components**
   - Create reusable loading and error state components
   - Implement the DataDisplay component
   - Ensure accessibility compliance

2. **API Routes Migration**
   - Refactor user-related API routes
   - Refactor team-related API routes
   - Add comprehensive error handling
   - Implement validation using zod or joi

### Week 3-4: Domain Component Refactoring

1. **Dashboard Components**
   - Refactor main dashboard components
   - Ensure consistent data loading patterns
   - Implement optimistic updates
   - Add appropriate error boundaries

2. **Program & Team Components**
   - Refactor program-related components
   - Ensure proper loading states
   - Implement lazy loading of secondary data
   - Add appropriate fallbacks for missing data

### Week 5: Testing & Optimization

1. **Testing Suite**
   - Create comprehensive tests for core hooks
   - Test API routes with various scenarios
   - Implement integration tests for key user flows
   - Set up CI pipeline for automated testing

2. **Performance Optimization**
   - Analyze React Query caching effectiveness
   - Optimize data fetching patterns
   - Implement request batching where appropriate
   - Add proper SWR strategies

### Week 6: Final Integration & Legacy Removal

1. **Integration & Cleanup**
   - Remove the old airtable.js file
   - Update documentation
   - Create developer guides for the new patterns
   - Clean up any remaining technical debt

2. **Performance Monitoring**
   - Implement telemetry for API performance
   - Add monitoring for error rates
   - Set up alerts for anomalies
   - Create a dashboard for system health

## Best Practices for Implementation

1. **Code Organization**
   - Group related files by domain, not by type
   - Keep components and their hooks close together
   - Use index files for clean exports
   - Follow consistent naming conventions

2. **Error Handling**
   - Use typed errors for different scenarios
   - Provide helpful user-facing error messages
   - Log detailed errors for developers
   - Implement graceful degradation

3. **Performance**
   - Minimize API calls through proper caching
   - Use React.memo and useMemo appropriately
   - Implement virtualization for long lists
   - Monitor bundle sizes

4. **Documentation**
   - Document complex business logic
   - Add JSDoc comments to functions
   - Create usage examples for shared components
   - Document edge cases and error scenarios

## Conclusion

By taking this senior developer approach, we'll create a robust, maintainable codebase that follows best practices and modern patterns. The focus on modularity, standardization, and testability will ensure the system is resilient to changes and easy to extend in the future.