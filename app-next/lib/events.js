/**
 * Events data fetching for Server Components
 * 
 * This module provides server-side data fetching functions for events
 * that can be used directly in Server Components.
 */
import { events } from '@/lib/airtable/entities';
import { cache } from 'react';

// Use cache wrapper for request memoization in a single render pass
export const getEvent = cache(async (eventId) => {
  if (!eventId) return null;
  
  try {
    return events.getEventById(eventId);
  } catch (error) {
    console.error(`Error fetching event ${eventId}:`, error);
    throw new Error(`Failed to fetch event: ${error.message}`);
  }
});

/**
 * Get upcoming events with caching
 */
export async function getUpcomingEvents(limit = 10) {
  try {
    // Use fetch API to leverage Next.js caching
    // For internal API routes, we can directly call the Airtable entity
    // but using fetch enables Next.js built-in caching
    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
    const response = await fetch(`${API_URL}/api/events/upcoming?limit=${limit}`, {
      next: { 
        revalidate: 300, // Cache for 5 minutes
        tags: ['events', 'upcoming-events']
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch upcoming events: ${response.status}`);
    }
    
    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    // Fallback to direct entity access if the API request fails
    return events.getUpcomingEvents(limit);
  }
}

/**
 * Get events for a specific program
 */
export async function getProgramEvents(programId) {
  if (!programId) return [];
  
  try {
    // Direct entity access for now
    // Will be replaced with API call when the endpoint is implemented
    return events.getEventsByProgram(programId);
  } catch (error) {
    console.error(`Error fetching program events for ${programId}:`, error);
    throw new Error(`Failed to fetch program events: ${error.message}`);
  }
}

/**
 * Get events for a specific cohort
 */
export async function getCohortEvents(cohortId) {
  if (!cohortId) return [];
  
  try {
    // Direct entity access for now
    // Will be replaced with API call when the endpoint is implemented
    return events.getEventsByCohort(cohortId);
  } catch (error) {
    console.error(`Error fetching cohort events for ${cohortId}:`, error);
    throw new Error(`Failed to fetch cohort events: ${error.message}`);
  }
}

/**
 * Get events for a specific user
 * Using no-store because this is user-specific data
 */
export async function getUserEvents(userId) {
  if (!userId) return [];
  
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
    const response = await fetch(`${API_URL}/api/user/events?userId=${userId}`, {
      cache: 'no-store' // Always fresh data for user-specific content
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user events: ${response.status}`);
    }
    
    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error(`Error fetching user events for ${userId}:`, error);
    // Fallback to direct entity access if the API request fails
    return events.getEventsByUser(userId);
  }
}

/**
 * Get all relevant events for a user in a specific context
 * This combines multiple event sources
 */
export async function getAllRelevantEvents(userId, programId, cohortId) {
  try {
    // Fetch data in parallel for better performance
    const [upcomingEvents, userEvents, programEvents, cohortEvents] = await Promise.all([
      getUpcomingEvents(5).catch(() => []),
      userId ? getUserEvents(userId).catch(() => []) : [],
      programId ? getProgramEvents(programId).catch(() => []) : [],
      cohortId ? getCohortEvents(cohortId).catch(() => []) : []
    ]);
    
    // Combine and deduplicate events
    const allEvents = [
      ...upcomingEvents,
      ...userEvents,
      ...programEvents,
      ...cohortEvents
    ];
    
    // Deduplicate by ID
    const uniqueEvents = allEvents.reduce((acc, event) => {
      if (!acc[event.id]) {
        acc[event.id] = event;
      }
      return acc;
    }, {});
    
    // Sort events by start date/time
    return Object.values(uniqueEvents).sort((a, b) => {
      return new Date(a.startDateTime) - new Date(b.startDateTime);
    });
  } catch (error) {
    console.error('Error fetching all relevant events:', error);
    return [];
  }
}