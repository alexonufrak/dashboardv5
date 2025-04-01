import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { events } from '../entities';

/**
 * Hook to fetch a single event by ID
 * @param {string} eventId - The ID of the event to fetch
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function useEvent(eventId, options = {}) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: () => events.getEventById(eventId),
    enabled: !!eventId,
    ...options
  });
}

/**
 * Hook to fetch upcoming events
 * @param {number} limit - Maximum number of events to return
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function useUpcomingEvents(limit = 10, options = {}) {
  return useQuery({
    queryKey: ['events', 'upcoming', limit],
    queryFn: () => events.getUpcomingEvents(limit),
    ...options
  });
}

/**
 * Hook to fetch events for a specific program/initiative
 * @param {string} programId - The ID of the program
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function useProgramEvents(programId, options = {}) {
  return useQuery({
    queryKey: ['events', 'program', programId],
    queryFn: () => events.getEventsByProgram(programId),
    enabled: !!programId,
    ...options
  });
}

/**
 * Hook to fetch events for a specific cohort
 * @param {string} cohortId - The ID of the cohort
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function useCohortEvents(cohortId, options = {}) {
  return useQuery({
    queryKey: ['events', 'cohort', cohortId],
    queryFn: () => events.getEventsByCohort(cohortId),
    enabled: !!cohortId,
    ...options
  });
}

/**
 * Hook to fetch events relevant to a specific user
 * @param {string} userId - The Auth0 ID of the user
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function useUserEvents(userId, options = {}) {
  return useQuery({
    queryKey: ['events', 'user', userId],
    queryFn: () => events.getEventsByUser(userId),
    enabled: !!userId,
    ...options
  });
}

/**
 * Hook that combines all events available for a user in a specific program/cohort context
 * @param {string} userId - The Auth0 ID of the user
 * @param {string} programId - The program ID (optional)
 * @param {string} cohortId - The cohort ID (optional)
 * @param {Object} options - Additional React Query options
 * @returns {Object} The combined query result
 */
export function useAllRelevantEvents(userId, programId, cohortId, options = {}) {
  const upcomingEventsQuery = useUpcomingEvents(5, {
    ...options,
    enabled: options.enabled !== false
  });
  
  const userEventsQuery = useUserEvents(userId, {
    ...options,
    enabled: !!userId && (options.enabled !== false)
  });
  
  const programEventsQuery = useProgramEvents(programId, {
    ...options,
    enabled: !!programId && (options.enabled !== false)
  });
  
  const cohortEventsQuery = useCohortEvents(cohortId, {
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
 * Hook to create a new event
 * @returns {Object} The mutation result
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (eventData) => events.createEvent(eventData),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries(['events', 'upcoming']);
      
      if (variables.programId) {
        queryClient.invalidateQueries(['events', 'program', variables.programId]);
      }
      
      if (variables.cohortId) {
        queryClient.invalidateQueries(['events', 'cohort', variables.cohortId]);
      }
      
      // Add the new event to the cache
      if (data && data.id) {
        queryClient.setQueryData(['event', data.id], data);
      }
    }
  });
}

/**
 * Hook to update an existing event
 * @returns {Object} The mutation result
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ eventId, updateData }) => 
      events.updateEvent(eventId, updateData),
    onSuccess: (data) => {
      if (data) {
        // Update the event in the cache
        queryClient.setQueryData(['event', data.id], data);
        
        // Invalidate related queries
        queryClient.invalidateQueries(['events', 'upcoming']);
        
        if (data.programId) {
          queryClient.invalidateQueries(['events', 'program', data.programId]);
        }
        
        if (data.cohortId) {
          queryClient.invalidateQueries(['events', 'cohort', data.cohortId]);
        }
        
        // Also invalidate user events as this could affect multiple users
        queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] === 'events' && query.queryKey[1] === 'user'
        });
      }
    }
  });
}

/**
 * Hook to delete an event
 * @returns {Object} The mutation result
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (eventId) => events.deleteEvent(eventId),
    onSuccess: (data) => {
      if (data) {
        // Remove the event from the cache
        queryClient.removeQueries(['event', data.id]);
        
        // Invalidate related queries
        queryClient.invalidateQueries(['events', 'upcoming']);
        
        if (data.programId) {
          queryClient.invalidateQueries(['events', 'program', data.programId]);
        }
        
        if (data.cohortId) {
          queryClient.invalidateQueries(['events', 'cohort', data.cohortId]);
        }
        
        // Also invalidate user events as this could affect multiple users
        queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] === 'events' && query.queryKey[1] === 'user'
        });
      }
    }
  });
}