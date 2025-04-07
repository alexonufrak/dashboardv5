# App Router Hook Migration Templates

This document provides templates and examples for migrating React Query hooks to use App Router endpoints while maintaining backward compatibility.

## Table of Contents

1. [Base Template Pattern](#base-template-pattern)
2. [useEvents.js Migration Template](#useeventsjs-migration-template)
3. [useInstitutions.js Migration Template](#useinstitutionsjs-migration-template)
4. [Implementation Notes](#implementation-notes)
5. [Required API Route Implementation](#required-api-route-implementation)

## Base Template Pattern

This template demonstrates how to update React Query hooks to support App Router endpoints following our established pattern.

```javascript
/**
 * [Domain] Hooks
 * 
 * Domain-specific hooks for accessing [domain] data.
 * Updated to support App Router API endpoints.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createDataHook, createActionHook } from '@/lib/utils/hook-factory';
import { [domain] } from '../entities';

/**
 * App Router compatible hook for fetching [resource]
 */
export const use[Resource]ViaApi = createDataHook({
  queryKey: '[resource]',
  endpoint: '/api/[domain]/[resource]',
  staleTime: 5 * 60 * 1000, // 5 minutes
  errorMessage: 'Failed to load [resource]',
  appRouter: true, // Use App Router endpoint
  normalizeData: (data) => data.[resource] || []
});

/**
 * App Router compatible hook for fetching [resource] by ID
 */
export const use[Resource]ByIdViaApi = createDataHook({
  queryKey: (id) => ['[resource]', id],
  endpoint: (id) => `/api/[domain]/${id}`,
  staleTime: 10 * 60 * 1000, // 10 minutes
  errorMessage: 'Failed to load [resource]',
  appRouter: true, // Use App Router endpoint
  normalizeData: (data) => data.[resource],
  enabled: (id) => !!id
});

/**
 * App Router compatible hook for creating/updating [resource]
 */
export const use[Action][Resource]ViaApi = createActionHook({
  actionKey: '[action][Resource]',
  endpoint: '/api/[domain]/[action]',
  method: 'POST',
  successMessage: '[Resource] [action]ed successfully',
  errorMessage: 'Failed to [action] [resource]',
  invalidateKeys: ['[resource]', ['[domain]']],
  appRouter: true // Use App Router endpoint
});

/**
 * Hook to fetch [resource]
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function use[Resource](options = {}) {
  // Use the App Router compatible hook 
  return use[Resource]ViaApi(options);

  /* Original implementation preserved for reference:
  return useQuery({
    queryKey: ['[resource]'],
    queryFn: () => [domain].get[Resource](),
    ...options
  });
  */
}

/**
 * Hook to fetch [resource] by ID
 * @param {string} id - The ID of the [resource] to fetch
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function use[Resource]ById(id, options = {}) {
  // Use the App Router compatible hook
  return use[Resource]ByIdViaApi(id, options);

  /* Original implementation preserved for reference:
  return useQuery({
    queryKey: ['[resource]', id],
    queryFn: () => [domain].get[Resource]ById(id),
    enabled: !!id,
    ...options
  });
  */
}

/**
 * Legacy hook implementations still not migrated to API endpoints
 * These will be migrated in the future
 */
export function use[AnotherResource](options = {}) {
  return useQuery({
    queryKey: ['[anotherResource]'],
    queryFn: () => [domain].get[AnotherResource](),
    ...options
  });
  // TODO: Create API endpoint and migrate this hook
}

/**
 * Hook for [action] a [resource]
 * @returns {Object} Mutation result
 */
export function use[Action][Resource]() {
  // Use the App Router compatible hook
  return use[Action][Resource]ViaApi();

  /* Original implementation preserved for reference:
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      return [domain].[action][Resource](data);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['[resource]'] });
    }
  });
  */
}

// Export all hooks
export default {
  // Modern API-first hooks
  use[Resource]ViaApi,
  use[Resource]ByIdViaApi,
  use[Action][Resource]ViaApi,
  
  // Legacy hooks (now using App Router endpoints internally)
  use[Resource],
  use[Resource]ById,
  use[Action][Resource],
  
  // Hooks not yet migrated
  use[AnotherResource]
};
```

## useEvents.js Migration Template

Here's a complete migration template for `useEvents.js` that provides comprehensive coverage of all existing hooks:

```javascript
/**
 * Events Hooks
 * 
 * Domain-specific hooks for accessing event data.
 * Updated to support App Router API endpoints.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { events } from '../entities';
import { createDataHook, createActionHook } from '@/lib/utils/hook-factory';

/**
 * App Router compatible hook for fetching a single event by ID
 */
export const useEventViaApi = createDataHook({
  queryKey: (eventId) => ['event', eventId],
  endpoint: (eventId) => `/api/events/${eventId}`,
  staleTime: 10 * 60 * 1000, // 10 minutes
  errorMessage: 'Failed to load event information',
  appRouter: true, // Use App Router endpoint
  normalizeData: (data) => data.event,
  enabled: (eventId) => !!eventId
});

/**
 * App Router compatible hook for fetching upcoming events
 */
export const useUpcomingEventsViaApi = createDataHook({
  queryKey: (limit) => ['events', 'upcoming', limit],
  endpoint: (limit = 10) => `/api/events/upcoming?limit=${limit}`,
  staleTime: 5 * 60 * 1000, // 5 minutes (events change more frequently)
  errorMessage: 'Failed to load upcoming events',
  appRouter: true, // Use App Router endpoint
  normalizeData: (data) => data.events || []
});

/**
 * App Router compatible hook for fetching program events
 */
export const useProgramEventsViaApi = createDataHook({
  queryKey: (programId) => ['events', 'program', programId],
  endpoint: (programId) => `/api/programs/${programId}/events`,
  staleTime: 5 * 60 * 1000, // 5 minutes
  errorMessage: 'Failed to load program events',
  appRouter: true, // Use App Router endpoint
  normalizeData: (data) => data.events || [],
  enabled: (programId) => !!programId
});

/**
 * App Router compatible hook for fetching cohort events
 */
export const useCohortEventsViaApi = createDataHook({
  queryKey: (cohortId) => ['events', 'cohort', cohortId],
  endpoint: (cohortId) => `/api/cohorts/${cohortId}/events`,
  staleTime: 5 * 60 * 1000, // 5 minutes
  errorMessage: 'Failed to load cohort events',
  appRouter: true, // Use App Router endpoint
  normalizeData: (data) => data.events || [],
  enabled: (cohortId) => !!cohortId
});

/**
 * App Router compatible hook for fetching user events
 */
export const useUserEventsViaApi = createDataHook({
  queryKey: (userId) => ['events', 'user', userId],
  endpoint: (userId) => `/api/user/events?userId=${userId}`,
  staleTime: 5 * 60 * 1000, // 5 minutes
  errorMessage: 'Failed to load user events',
  appRouter: true, // Use App Router endpoint
  normalizeData: (data) => data.events || [],
  enabled: (userId) => !!userId
});

/**
 * App Router compatible hook for creating events
 */
export const useCreateEventViaApi = createActionHook({
  actionKey: 'create-event',
  endpoint: '/api/events/create',
  method: 'POST',
  successMessage: 'Event created successfully',
  errorMessage: 'Failed to create event',
  invalidateKeys: [
    ['events', 'upcoming'],
    (data) => data.programId ? ['events', 'program', data.programId] : null,
    (data) => data.cohortId ? ['events', 'cohort', data.cohortId] : null,
  ].filter(Boolean),
  appRouter: true, // Use App Router endpoint
});

/**
 * App Router compatible hook for updating events
 */
export const useUpdateEventViaApi = createActionHook({
  actionKey: 'update-event',
  endpoint: (data) => `/api/events/${data.eventId}/update`,
  method: 'PATCH',
  successMessage: 'Event updated successfully',
  errorMessage: 'Failed to update event',
  invalidateKeys: [
    ['events', 'upcoming'],
    (data) => data.programId ? ['events', 'program', data.programId] : null,
    (data) => data.cohortId ? ['events', 'cohort', data.cohortId] : null,
    (data) => ['event', data.eventId]
  ].filter(Boolean),
  appRouter: true, // Use App Router endpoint
});

/**
 * App Router compatible hook for deleting events
 */
export const useDeleteEventViaApi = createActionHook({
  actionKey: 'delete-event',
  endpoint: (eventId) => `/api/events/${eventId}/delete`,
  method: 'DELETE',
  successMessage: 'Event deleted successfully',
  errorMessage: 'Failed to delete event',
  invalidateKeys: [
    ['events', 'upcoming'],
    (data) => data.programId ? ['events', 'program', data.programId] : null,
    (data) => data.cohortId ? ['events', 'cohort', data.cohortId] : null,
  ].filter(Boolean),
  appRouter: true, // Use App Router endpoint
});

/**
 * Hook to fetch a single event by ID (updated for App Router compatibility)
 */
export function useEvent(eventId, options = {}) {
  // Use the App Router compatible hook
  return useEventViaApi(eventId, options);
}

/**
 * Hook to fetch upcoming events (updated for App Router compatibility)
 */
export function useUpcomingEvents(limit = 10, options = {}) {
  // Use the App Router compatible hook
  return useUpcomingEventsViaApi(limit, options);
}

/**
 * Hook to fetch events for a specific program/initiative (updated for App Router compatibility)
 */
export function useProgramEvents(programId, options = {}) {
  // Use the App Router compatible hook
  return useProgramEventsViaApi(programId, options);
}

/**
 * Hook to fetch events for a specific cohort (updated for App Router compatibility)
 */
export function useCohortEvents(cohortId, options = {}) {
  // Use the App Router compatible hook
  return useCohortEventsViaApi(cohortId, options);
}

/**
 * Hook to fetch events relevant to a specific user (updated for App Router compatibility)
 */
export function useUserEvents(userId, options = {}) {
  // Use the App Router compatible hook
  return useUserEventsViaApi(userId, options);
}

/**
 * Hook that combines all events available for a user in a specific program/cohort context
 * (Updated to use App Router compatible hooks)
 */
export function useAllRelevantEvents(userId, programId, cohortId, options = {}) {
  const upcomingEventsQuery = useUpcomingEventsViaApi(5, {
    ...options,
    enabled: options.enabled !== false
  });
  
  const userEventsQuery = useUserEventsViaApi(userId, {
    ...options,
    enabled: !!userId && (options.enabled !== false)
  });
  
  const programEventsQuery = useProgramEventsViaApi(programId, {
    ...options,
    enabled: !!programId && (options.enabled !== false)
  });
  
  const cohortEventsQuery = useCohortEventsViaApi(cohortId, {
    ...options,
    enabled: !!cohortId && (options.enabled !== false)
  });

  // Combine the results
  const allEvents = [
    ...(upcomingEventsQuery.data || []),
    ...(userEventsQuery.data || []),
    ...(programEventsQuery.data || []),
    ...(cohortEventsQuery.data || [])
  ];

  // Deduplicate by ID
  const uniqueEvents = allEvents.reduce((acc, event) => {
    if (!acc[event.id]) {
      acc[event.id] = event;
    }
    return acc;
  }, {});

  // Sort events by start date/time
  const sortedEvents = Object.values(uniqueEvents).sort((a, b) => {
    return new Date(a.startDateTime) - new Date(b.startDateTime);
  });

  return {
    data: sortedEvents,
    isLoading: upcomingEventsQuery.isLoading || 
               (userId && userEventsQuery.isLoading) || 
               (programId && programEventsQuery.isLoading) || 
               (cohortId && cohortEventsQuery.isLoading),
    error: upcomingEventsQuery.error || 
           userEventsQuery.error || 
           programEventsQuery.error || 
           cohortEventsQuery.error,
    queries: {
      upcoming: upcomingEventsQuery,
      user: userEventsQuery,
      program: programEventsQuery,
      cohort: cohortEventsQuery
    }
  };
}

/**
 * Hook to create a new event (updated for App Router compatibility)
 */
export function useCreateEvent() {
  return useCreateEventViaApi();
}

/**
 * Hook to update an existing event (updated for App Router compatibility)
 */
export function useUpdateEvent() {
  return useUpdateEventViaApi();
}

/**
 * Hook to delete an event (updated for App Router compatibility)
 */
export function useDeleteEvent() {
  return useDeleteEventViaApi();
}

// Composite export for both modern and legacy hooks
export default {
  // Modern API-first hooks
  useEventViaApi,
  useUpcomingEventsViaApi,
  useProgramEventsViaApi,
  useCohortEventsViaApi,
  useUserEventsViaApi,
  useCreateEventViaApi,
  useUpdateEventViaApi,
  useDeleteEventViaApi,
  
  // Legacy hooks (now using App Router endpoints internally)
  useEvent,
  useUpcomingEvents,
  useProgramEvents,
  useCohortEvents,
  useUserEvents,
  useAllRelevantEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent
};
```

## useInstitutions.js Migration Template

Here's a complete migration template for `useInstitutions.js` that provides comprehensive coverage of all existing hooks:

```javascript
/**
 * Institutions Hooks
 * 
 * Domain-specific hooks for accessing institution data.
 * Updated to support App Router API endpoints.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createDataHook, createActionHook } from '@/lib/utils/hook-factory';

/**
 * App Router compatible hook for fetching a single institution by ID
 */
export const useInstitutionViaApi = createDataHook({
  queryKey: (institutionId) => ['institution', institutionId],
  endpoint: (institutionId) => `/api/institutions/${institutionId}`,
  staleTime: 24 * 60 * 60 * 1000, // 24 hours (institution data rarely changes)
  errorMessage: 'Failed to load institution information',
  appRouter: true, // Use App Router endpoint
  normalizeData: (data) => data.institution,
  enabled: (institutionId) => !!institutionId
});

/**
 * App Router compatible hook for searching institutions by name
 */
export const useInstitutionSearchViaApi = createDataHook({
  queryKey: (query, limit = 10) => ['institutions', 'search', query, limit],
  endpoint: (query, limit = 10) => `/api/institutions?q=${encodeURIComponent(query)}&limit=${limit}`,
  staleTime: 60 * 60 * 1000, // 1 hour
  errorMessage: 'Failed to search institutions',
  appRouter: true, // Use App Router endpoint
  enabled: (query, limit) => !!query && query.length >= 2,
  normalizeData: (data) => ({
    institutions: data.institutions || [],
    count: data.count || 0
  })
});

/**
 * App Router compatible hook for fetching institution partnerships
 */
export const useInstitutionPartnershipsViaApi = createDataHook({
  queryKey: (institutionId) => ['partnerships', 'institution', institutionId],
  endpoint: (institutionId) => `/api/institutions/${institutionId}/partnerships`,
  staleTime: 10 * 60 * 1000, // 10 minutes
  errorMessage: 'Failed to load institution partnerships',
  appRouter: true, // Use App Router endpoint
  normalizeData: (data) => data.partnerships || [],
  enabled: (institutionId) => !!institutionId
});

/**
 * Custom hook for fetching institution data (updated for App Router compatibility)
 */
export function useInstitution(institutionId) {
  // Use the App Router compatible hook
  return useInstitutionViaApi(institutionId);
}

/**
 * Custom hook for searching institutions by name (updated for App Router compatibility)
 */
export function useInstitutionSearch(query, options = {}) {
  const { limit = 10, enabled = true } = options;
  
  // Use the App Router compatible hook
  return useInstitutionSearchViaApi(query, limit, {
    ...options,
    enabled: enabled && !!query && query.length >= 2
  });
}

/**
 * Factory-based hook for institution partnerships (updated for App Router compatibility)
 */
export const useInstitutionPartnerships = (institutionId, options = {}) => {
  // Use the App Router compatible hook
  return useInstitutionPartnershipsViaApi(institutionId, options);
};

// Composite export for both modern and legacy hooks
export default {
  // Modern API-first hooks
  useInstitutionViaApi,
  useInstitutionSearchViaApi,
  useInstitutionPartnershipsViaApi,
  
  // Legacy hooks (now using App Router endpoints)
  useInstitution,
  useInstitutionSearch,
  useInstitutionPartnerships
};
```

## Implementation Notes

1. **Factory Functions**: Always use the `createDataHook` and `createActionHook` factory functions from `hook-factory.js`
2. **App Router Configuration**: Set `appRouter: true` to force App Router endpoint format
3. **Backwards Compatibility**: Maintain the original hook names but update their implementations to use the new API-first hooks
4. **Documentation**: Add clear JSDoc comments for all hooks and parameters
5. **Data Normalization**: Implement proper normalization of API response data through the `normalizeData` parameter
6. **Naming Convention**: Use the `*ViaApi` suffix for all App Router compatible hooks
7. **Error Messages**: Provide clear, user-friendly error messages for each hook
8. **Caching Strategy**: Set appropriate `staleTime` values based on how frequently the data changes

## Required API Route Implementation

To complete the migration, you'll need to implement corresponding API routes in the App Router structure:

### Events API Routes

1. `/app/api/events/[eventId]/route.js` - Get event by ID
2. `/app/api/events/upcoming/route.js` - Get upcoming events
3. `/app/api/programs/[programId]/events/route.js` - Get program events
4. `/app/api/cohorts/[cohortId]/events/route.js` - Get cohort events
5. `/app/api/user/events/route.js` - Get user-specific events
6. `/app/api/events/create/route.js` - Create a new event
7. `/app/api/events/[eventId]/update/route.js` - Update an event
8. `/app/api/events/[eventId]/delete/route.js` - Delete an event

### Institutions API Routes

1. `/app/api/institutions/[institutionId]/route.js` - Get institution by ID
2. `/app/api/institutions/route.js` - Search institutions
3. `/app/api/institutions/[institutionId]/partnerships/route.js` - Get institution partnerships

For each API route, follow these implementation patterns:

1. **Authentication**: Verify user session with Auth0
2. **Error Handling**: Use try/catch blocks with standardized error responses
3. **Data Normalization**: Return data in a consistent format across all endpoints
4. **Caching**: Set appropriate cache headers for optimizing performance

### API Route Pattern Example

Here's a template for implementing the required API routes:

```javascript
// /app/api/events/[eventId]/route.js
import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { events } from '@/lib/airtable/entities';

export async function GET(request, { params }) {
  try {
    // Get Auth0 session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Validate parameters
    const { eventId } = params;
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Fetch the data using the entity function
    const event = await events.getEventById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Return successful response
    return NextResponse.json({ 
      event,
      success: true
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch event' }, 
      { status: 500 }
    );
  }
}
```