# Final Airtable Access Pattern Migration Plan

## Current Architecture Review

After comprehensive analysis of the xFoundry Dashboard's data architecture, we have identified these key components:

1. **Domain-Driven Architecture**:
  - **Entities Layer** (`/lib/airtable/entities/`): Server-side domain models with direct Airtable access
  - **Hooks Layer** (`/lib/airtable/hooks/`): React Query hooks with inconsistent implementation patterns
  - **API Routes** (`/pages/api/`): Server-side endpoints that mostly use entity operations correctly
  - **Utility Factories** (`/lib/utils/hook-factory.js`): Reusable hook patterns including `createDataHook`

2. **Current Access Patterns**:
  - **✅ Pattern A (API-First)**: Several hooks already use API endpoints correctly
    - Example: `useContactViaApi`, `useProfileData`
  - **❌ Pattern B (Direct Entity)**: Many hooks try to use Airtable entities directly on client 
    - Example: `useMyContactByEmail`
  - **Factory Utilities**: The codebase already has a `createDataHook` factory that creates API-based hooks

3. **Key Problems**:
  - **Security Risks**: Direct entity access exposes Airtable API keys to client
  - **Failed Client Requests**: Entity-direct hooks fail in browser due to CORS/auth issues
  - **Inconsistent Implementation**: Different patterns create maintenance challenges
  - **Unreliable Server Cache**: Vercel's serverless environment has memory cache limitations

4. **Existing Solutions**:
  - **Email-First Lookup**: `/api/contacts/me` already implements proper user lookup
  - **Composite Data Endpoints**: `/api/user/profile-v3` provides complete profile data
  - **Hook Factory Pattern**: `createDataHook` already standardizes API-based hooks
  - **React Query Cache**: Client-side cache provides performance benefits

## Final Plan: API-First Standardization

Based on our comprehensive review and your preference for a single consistent approach, our final plan focuses on standardizing the API-first pattern while leveraging existing tools.

### 1. API-First Standardization

**Goal**: Convert all client-side data access to use API endpoints exclusively

**Details**:
- Use the existing `createDataHook` factory for all hooks to ensure consistency
- Leverage React Query's cache capabilities for performance and UX benefits
- Maintain the domain-driven structure with proper separation of concerns
- Use existing API endpoints where available, create new ones where needed

### 2. API Route Optimization

**Goal**: Ensure all API routes follow best practices for reliability and performance

**Details**:
- Document all existing API endpoints and their purposes
- Standardize error response format across all endpoints
- Implement proper cache headers for optimal performance
- Use proper status codes and consistent response structures

### 3. Documentation and Testing

**Goal**: Ensure consistent implementation across the codebase

**Details**:
- Create a comprehensive hook migration guide
- Document the standard hook implementation patterns
- Add automated tests for critical data flows
- Implement linting rules to prevent direct entity access

## Migration Strategy

### Phase 1: Immediate Fixes (1-2 weeks)

1. **Convert Critical Hooks**:
   - Refactor `useMyContactByEmail` to use `/api/contacts/me` API endpoint
   - Use the existing `createDataHook` factory to ensure consistency
   - Example implementation:
   ```javascript
   export const useMyContactByEmail = createDataHook({
     queryKey: ['contact', 'current', 'email'],
     endpoint: '/api/contacts/me',
     staleTime: 5 * 60 * 1000, // 5 minutes
     cacheTime: 10 * 60 * 1000, // 10 minutes
     errorMessage: 'Failed to load your contact information',
     refetchOnFocus: true
   });
   ```

2. **Create API Client Utility**:
   - Implement a centralized API client for consistent error handling
   - Support response caching and retry logic
   - Example:
   ```javascript
   // Basic implementation to standardize API access
   export const apiClient = {
     async get(endpoint, params = {}) {
       const queryString = new URLSearchParams(params).toString();
       const url = queryString ? `${endpoint}?${queryString}` : endpoint;
       
       const response = await fetch(url, {
         credentials: 'include',
         headers: { 'Accept': 'application/json' }
       });
       
       if (!response.ok) {
         const error = await response.json().catch(() => ({}));
         throw new Error(error.message || `API error: ${response.status}`);
       }
       
       return response.json();
     },
     
     // Additional methods for POST, PUT, etc.
   };
   ```

3. **Document Existing API Endpoints**:
   - Create an API endpoints registry with purposes and parameters
   - Identify gaps where new endpoints are needed

### Phase 2: Systematic Migration (2-4 weeks)

1. **Audit & Prioritize**:
   - Complete audit of all hooks using direct entity access
   - Prioritize based on usage and importance
   - Group by domain (teams, programs, etc.) for efficient migration

2. **Batch Migration**:
   - Convert hooks in batches by domain
   - Ensure each converted hook:
     - Uses `createDataHook` or the API client utility
     - Maintains the same interface and behavior
     - Includes proper error handling

3. **Testing & Verification**:
   - Implement integration tests for key data flows
   - Test both happy paths and error scenarios
   - Verify performance with React Query DevTools

### Phase 3: Optimization & Enforcement (2-4 weeks)

1. **Optimize API Response Caching**:
   - Implement consistent cache-control headers
   - Configure staleTime and gcTime appropriately in React Query
   - Consider edge caching for frequently accessed endpoints

2. **Linting & Code Quality**:
   - Add ESLint rules to prevent direct entity access
   - Create PR templates with migration checklist
   - Automate detection of non-compliant patterns

3. **Documentation & Training**:
   - Create comprehensive developer guides
   - Document the architecture and design decisions
   - Implement examples for common patterns

## Implementation Details

### Pattern A: Basic Data Fetching

```javascript
// Using the createDataHook factory (recommended approach)
export const useTeam = createDataHook({
  queryKey: 'team',
  endpoint: '/api/teams',
  staleTime: 5 * 60 * 1000,
  errorMessage: 'Failed to load team data'
});

// Standard implementation without factory
export function useProgramDetails(programId) {
  return useQuery({
    queryKey: ['program', programId],
    queryFn: async () => {
      if (!programId) throw new Error('Program ID is required');
      const response = await fetch(`/api/programs/${programId}/details-v2`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to load program details');
      }
      return response.json();
    },
    enabled: !!programId,
    staleTime: 5 * 60 * 1000
  });
}
```

### Pattern B: Data Mutations

```javascript
// Using the createActionHook factory (recommended approach)
export const useUpdateTeam = createActionHook({
  actionKey: 'updateTeam',
  endpoint: '/api/teams/[teamId]',
  method: 'PATCH',
  successMessage: 'Team updated successfully',
  errorMessage: 'Failed to update team',
  invalidateKeys: ['team', 'teams']
});

// Standard implementation without factory
export function useSubmitApplication() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (applicationData) => {
      const response = await fetch('/api/applications/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData)
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to submit application');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application submitted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit application');
    }
  });
}
```

## Linear Issues (Final)

**ENG-43**: Epic - Standardize Airtable access with API-first pattern

This remains the main umbrella issue tracking the overall migration.

### Priority 1: Core Infrastructure

**ENG-44**: Convert useMyContactByEmail to use API-first pattern

- Use createDataHook factory with /api/contacts/me endpoint
- Ensure compatibility with existing code
- Include proper error handling and retry logic

**ENG-51**: Create enhanced API client utility

- Implement standardized request/response handling
- Add retry logic and error normalization
- Document usage patterns and examples

**ENG-45**: Document existing API endpoints

- Create a registry of all current API endpoints
- Document purpose, parameters, and response format
- Identify gaps where new endpoints are needed

### Priority 2: Systematic Migration

**ENG-46**: Audit and schedule hook migrations by domain

- Identify all hooks using direct entity access
- Group by domain (teams, programs, profiles, etc.)
- Create migration schedule with deadlines

**ENG-52**: Batch migration: Profile & Education hooks

- Convert all hooks in profile/education domain
- Update related components as needed
- Add tests to validate migration

**ENG-53**: Batch migration: Teams & Programs hooks

- Convert all hooks in teams/programs domain
- Update related components as needed
- Add tests to validate migration

### Priority 3: Quality & Optimization

**ENG-47**: Optimize API response caching

- Implement standard cache-control headers
- Configure optimal React Query cache settings
- Document caching strategies by data type

**ENG-54**: Add linting rules for API-first enforcement

- Create ESLint plugin to detect direct entity access
- Add to CI/CD pipeline
- Document rules and enforcement policy

**ENG-48**: Create comprehensive API-first documentation

- Create developer guides for hook implementation
- Document architecture decisions and patterns
- Provide examples for common scenarios

## Success Criteria

- ✅ All client-side hooks use API endpoints exclusively
- ✅ No direct Airtable entity access occurs on the client
- ✅ Hooks follow consistent implementation patterns
- ✅ API routes have standardized error handling
- ✅ Application performance is maintained or improved
- ✅ Developer experience is clear and well-documented