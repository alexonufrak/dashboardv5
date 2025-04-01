# Airtable Refactoring Testing Strategy

This document outlines the comprehensive testing strategy for validating the new domain-driven Airtable architecture. Effective testing is critical to ensure the refactored code maintains functionality while improving maintainability and performance.

## Testing Objectives

1. **Functional Equivalence**: Ensure the new implementation delivers the same functionality as the old one
2. **Performance Validation**: Verify the new implementation meets or exceeds performance expectations
3. **Error Handling**: Test robustness in handling error conditions and edge cases
4. **Field Resilience**: Verify the new implementation handles missing or renamed Airtable fields gracefully

## Testing Levels

### 1. Unit Testing

**Targets**: Individual entity modules and their functions

#### Testing Core Infrastructure
- **Client Module**: Test API interaction, request formatting, response parsing
- **Cache Module**: Test caching behaviors, expiration, invalidation
- **Throttle Module**: Test rate limiting functionality
- **Error Handler**: Test error transformation and context addition

#### Testing Entity Functions
- **Get Operations**: Test data retrieval with both valid and invalid parameters
- **Create Operations**: Test creation with complete and partial data
- **Update Operations**: Test modifications with valid and invalid field values
- **Normalizers**: Test field mapping and default value handling

**Tools**:
- Jest for unit testing
- Mock Service Worker for API simulation

**Example**:
```javascript
// Testing users entity
describe('users entity', () => {
  test('getUserByAuth0Id returns normalized user when found', async () => {
    // Arrange
    const mockResponse = {
      id: 'rec123',
      fields: {
        'Name': 'Test User',
        'Email': 'test@example.com',
        'Auth0 ID': 'auth0|123'
      }
    };
    mockAirtableFind.mockResolvedValue(mockResponse);
    
    // Act
    const result = await users.getUserByAuth0Id('auth0|123');
    
    // Assert
    expect(result).toEqual({
      id: 'rec123',
      name: 'Test User',
      email: 'test@example.com',
      auth0Id: 'auth0|123'
    });
  });
  
  test('getUserByAuth0Id handles missing fields', async () => {
    // Arrange
    const mockResponse = {
      id: 'rec123',
      fields: {
        'Auth0 ID': 'auth0|123'
        // Name and Email missing
      }
    };
    mockAirtableFind.mockResolvedValue(mockResponse);
    
    // Act
    const result = await users.getUserByAuth0Id('auth0|123');
    
    // Assert
    expect(result.name).toBe(''); // Default value
    expect(result.email).toBe(''); // Default value
  });
});
```

### 2. Integration Testing

**Targets**: Interactions between entities and hooks

#### Entity Interaction Tests
- Test flows that involve multiple entities (e.g., getting a user's teams)
- Verify correct propagation of data between related entities

#### Hook Tests
- Test React Query hooks with mocked responses
- Verify loading states, success states, and error states
- Test cache invalidation and refetching behavior

**Tools**:
- React Testing Library
- MSW for API mocking
- React Query test utilities

**Example**:
```javascript
// Testing useTeam hook
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTeam } from '@/lib/airtable/hooks';

describe('useTeam hook', () => {
  let queryClient;
  let wrapper;
  
  beforeEach(() => {
    queryClient = new QueryClient();
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  });
  
  test('returns team data when successful', async () => {
    // Mock API response
    server.use(
      rest.get('/api/mock-airtable-endpoint', (req, res, ctx) => {
        return res(ctx.json({
          id: 'team123',
          fields: {
            'Team Name': 'Test Team',
            'Description': 'A test team'
          }
        }));
      })
    );
    
    // Render the hook
    const { result } = renderHook(() => useTeam('team123'), { wrapper });
    
    // Wait for the query to resolve
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    // Assert the result
    expect(result.current.data).toEqual({
      id: 'team123',
      name: 'Test Team',
      description: 'A test team'
    });
  });
});
```

### 3. API Endpoint Testing

**Targets**: Refactored API routes using the new entities

#### API Response Validation
- Compare responses from old and new implementations
- Test error responses and status codes
- Verify authentication and authorization behavior

**Tools**:
- Supertest for API testing
- Next.js API route testing utilities

**Example**:
```javascript
// Testing API routes
import { createMocks } from 'node-mocks-http';
import teamMembersHandler from '@/pages/api/teams/members/[teamId]';

jest.mock('@/lib/airtable/entities', () => ({
  teams: {
    getTeamMembers: jest.fn()
  }
}));

describe('Team Members API', () => {
  test('returns 401 when not authenticated', async () => {
    // Mock Auth0 to return no session
    require('@/lib/auth0').auth0.getSession.mockResolvedValue(null);
    
    const { req, res } = createMocks({
      method: 'GET',
      query: { teamId: 'team123' }
    });
    
    await teamMembersHandler(req, res);
    
    expect(res.statusCode).toBe(401);
  });
  
  test('returns team members when authenticated', async () => {
    // Mock Auth0 to return a session
    require('@/lib/auth0').auth0.getSession.mockResolvedValue({ 
      user: { sub: 'auth0|123' } 
    });
    
    // Mock team members
    require('@/lib/airtable/entities').teams.getTeamMembers.mockResolvedValue([
      { id: 'mem1', name: 'Member 1' },
      { id: 'mem2', name: 'Member 2' }
    ]);
    
    const { req, res } = createMocks({
      method: 'GET',
      query: { teamId: 'team123' }
    });
    
    await teamMembersHandler(req, res);
    
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      members: [
        { id: 'mem1', name: 'Member 1' },
        { id: 'mem2', name: 'Member 2' }
      ]
    });
  });
});
```

### 4. Component Testing

**Targets**: Refactored React components using the new hooks

#### Component Behavior Tests
- Test rendering, interactions, and prop handling
- Verify loading states, error states, and data display
- Test user interactions and their effects

**Tools**:
- React Testing Library
- Jest for assertions
- MSW for API mocking

**Example**:
```javascript
// Testing refactored components
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TeamMembers from '@/components/teams/TeamMembers.refactored';

// Mock the hook
jest.mock('@/lib/airtable/hooks', () => ({
  useTeamMembers: jest.fn()
}));

describe('TeamMembers component', () => {
  let queryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient();
  });
  
  test('displays loading state initially', () => {
    // Mock loading state
    require('@/lib/airtable/hooks').useTeamMembers.mockReturnValue({
      isLoading: true,
      data: null,
      error: null
    });
    
    render(
      <QueryClientProvider client={queryClient}>
        <TeamMembers teamId="team123" />
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
  
  test('displays team members when loaded', async () => {
    // Mock success state
    require('@/lib/airtable/hooks').useTeamMembers.mockReturnValue({
      isLoading: false,
      data: [
        { id: 'mem1', name: 'Member 1', email: 'mem1@example.com' },
        { id: 'mem2', name: 'Member 2', email: 'mem2@example.com' }
      ],
      error: null
    });
    
    render(
      <QueryClientProvider client={queryClient}>
        <TeamMembers teamId="team123" />
      </QueryClientProvider>
    );
    
    expect(screen.getByText('Member 1')).toBeInTheDocument();
    expect(screen.getByText('Member 2')).toBeInTheDocument();
  });
});
```

### 5. End-to-End Testing

**Targets**: Critical user flows involving the refactored code

#### User Flow Tests
- Test complete user journeys and important flows
- Verify interactions across multiple components and API calls
- Test real-world scenarios with minimal mocking

**Tools**:
- Cypress or Playwright for E2E testing
- Test environments with controlled data

**Focus Areas**:
- Program enrollment and participation
- Team creation and management
- Submission workflows
- Points and rewards system

## Specialized Testing Approaches

### Performance Testing

**Metrics to Measure**:
- API response times
- Component render times
- Cache hit rates
- Memory usage

**Tools**:
- React Query devtools for cache monitoring
- Chrome DevTools Performance tab
- Custom timing instrumentation

**Example Performance Test**:
```javascript
// Measuring API response time
async function measurePerformance() {
  console.time('Old Implementation');
  await oldImplementation.getUserById('123');
  console.timeEnd('Old Implementation');
  
  console.time('New Implementation');
  await users.getUserByAuth0Id('auth0|123');
  console.timeEnd('New Implementation');
}
```

### Field Resilience Testing

**Approach**:
1. Create simulated Airtable responses with missing or modified fields
2. Verify the new implementation handles these gracefully
3. Compare with old implementation to ensure improved resilience

**Example**:
```javascript
// Test field resilience
test('handles missing nested field', async () => {
  // Mock response with missing nested field
  const mockResponse = {
    id: 'rec123',
    fields: {
      'Team Record ID': 'team123',
      // Missing 'Team Name' field
    }
  };
  
  mockAirtableSelect.mockResolvedValue([mockResponse]);
  
  // Act
  const result = await participation.getParticipationRecords('auth0|123');
  
  // Assert
  expect(result[0].teamName).toBe(null); // Should use fallback
  expect(result[0].teamId).toBe('team123'); // Should be present
});
```

## Testing Schedule

### Phase 1: Core Infrastructure Testing
- Unit tests for client, cache, throttle, and error modules
- Integration tests for module interactions
- Field resilience tests for normalization functions

### Phase 2: Entity Module Testing
- Unit tests for all entity functions
- Integration tests for entity interactions
- Field mapping and resilience tests

### Phase 3: Hook Testing
- Tests for React Query hooks
- Loading state, error state, and success state tests
- Caching and invalidation tests

### Phase 4: API and Component Testing
- Tests for refactored API routes
- Tests for refactored components
- Before/after performance comparisons

### Phase 5: End-to-End Testing
- Tests for critical user flows
- Integration with production-like environments
- Final validation before full rollout

## Test Documentation

For each test file, include:

1. **Purpose**: What the test is validating
2. **Coverage**: What aspects of the module are being tested
3. **Mock Strategy**: How external dependencies are mocked
4. **Edge Cases**: What boundary conditions are tested

**Example Documentation**:
```javascript
/**
 * Tests for the users entity module
 * 
 * COVERAGE:
 * - getUserByAuth0Id: full coverage
 * - getUserByEmail: full coverage
 * - updateUserProfile: partial coverage (success cases only)
 * 
 * MOCK STRATEGY:
 * - Airtable API calls are mocked at the executeQuery level
 * - Auth0 responses are simulated with predefined fixtures
 * 
 * EDGE CASES:
 * - Missing fields in Airtable responses
 * - Rate limiting errors
 * - Authentication failures
 */
```

## Conclusion

This testing strategy provides comprehensive coverage for the Airtable refactoring project. By implementing tests at all levels, we can ensure that the new domain-driven architecture maintains full functionality while improving maintainability, performance, and resilience.