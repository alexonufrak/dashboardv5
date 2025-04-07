# Server Components Implementation for Events and Institutions

This document provides implementation examples for migrating events and institutions data fetching from React Query to Next.js 14 Server Components. These examples demonstrate the recommended patterns for our Next.js App Router migration.

## Table of Contents

1. [Server Component Data Fetching](#server-component-data-fetching)
2. [Server Actions for Mutations](#server-actions-for-mutations)
3. [Client Component Integration](#client-component-integration)
4. [Caching Strategy Implementation](#caching-strategy-implementation)
5. [Migration Path](#migration-path)

## Server Component Data Fetching

### Events Data Fetching

```javascript
// app/lib/events.js
import { events } from '@/lib/airtable/entities';
import { cache } from 'react';

/**
 * Get a single event by ID
 * Cached for the duration of the request and reusable across components
 */
export const getEvent = cache(async (eventId) => {
  if (!eventId) return null;
  return events.getEventById(eventId);
});

/**
 * Get upcoming events with limit
 * Uses fetch with Next.js cache controls
 */
export async function getUpcomingEvents(limit = 10) {
  // Using fetch API to leverage Next.js caching
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/upcoming?limit=${limit}`, {
    next: { 
      revalidate: 300, // Cache for 5 minutes
      tags: ['events']
    }
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch upcoming events');
  }
  
  return res.json();
}

/**
 * Get events for a specific program
 */
export async function getProgramEvents(programId) {
  if (!programId) return [];
  
  // Using fetch API to leverage Next.js caching
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/programs/${programId}/events`, {
    next: { 
      revalidate: 300, // Cache for 5 minutes
      tags: [`program:${programId}:events`, 'events']
    }
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch events for program ${programId}`);
  }
  
  return res.json();
}

/**
 * Get events for a specific cohort
 */
export async function getCohortEvents(cohortId) {
  if (!cohortId) return [];
  
  // Using fetch API to leverage Next.js caching
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cohorts/${cohortId}/events`, {
    next: { 
      revalidate: 300, // Cache for 5 minutes
      tags: [`cohort:${cohortId}:events`, 'events']
    }
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch events for cohort ${cohortId}`);
  }
  
  return res.json();
}

/**
 * Get events for a specific user
 * Using no-store because this is user-specific data
 */
export async function getUserEvents(userId) {
  if (!userId) return [];
  
  // Using fetch API with no-store for fresh data
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/events?userId=${userId}`, {
    cache: 'no-store' // Always fresh data for user-specific content
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch events for user ${userId}`);
  }
  
  return res.json();
}

/**
 * Get all relevant events for a user in a specific context
 * This combines multiple data sources
 */
export async function getAllRelevantEvents(userId, programId, cohortId) {
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
}
```

### Institutions Data Fetching

```javascript
// app/lib/institutions.js
import { institutions } from '@/lib/airtable/entities';
import { cache } from 'react';

/**
 * Get an institution by ID
 * Cached for the duration of the request and reusable across components
 */
export const getInstitution = cache(async (institutionId) => {
  if (!institutionId) return null;
  
  // Institutions change very infrequently, so we can cache them longer
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/institutions/${institutionId}`, {
    next: { 
      revalidate: 86400, // Cache for 24 hours
      tags: [`institution:${institutionId}`]
    }
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch institution ${institutionId}`);
  }
  
  return res.json();
});

/**
 * Search institutions by name
 * No caching because search results should be fresh
 */
export async function searchInstitutions(query, limit = 10) {
  if (!query || query.length < 2) {
    return { institutions: [], count: 0 };
  }
  
  // Using fetch API with no-store for search results
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/institutions?q=${encodeURIComponent(query)}&limit=${limit}`,
    { cache: 'no-store' } // Always fresh for search
  );
  
  if (!res.ok) {
    throw new Error('Failed to search institutions');
  }
  
  return res.json();
}

/**
 * Get partnerships for an institution
 */
export async function getInstitutionPartnerships(institutionId) {
  if (!institutionId) return [];
  
  // Using fetch API to leverage Next.js caching
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/institutions/${institutionId}/partnerships`,
    {
      next: { 
        revalidate: 3600, // Cache for 1 hour
        tags: [`institution:${institutionId}:partnerships`, 'partnerships']
      }
    }
  );
  
  if (!res.ok) {
    throw new Error(`Failed to fetch partnerships for institution ${institutionId}`);
  }
  
  return res.json();
}
```

## Server Actions for Mutations

### Events Mutations

```javascript
// app/actions/events.js
'use server'

import { events } from '@/lib/airtable/entities';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/lib/app-router-auth';

/**
 * Create a new event
 */
export async function createEvent(formData) {
  try {
    // Get auth session
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // Extract data from formData
    const eventData = {
      name: formData.get('name'),
      description: formData.get('description'),
      startDateTime: formData.get('startDateTime'),
      endDateTime: formData.get('endDateTime'),
      location: formData.get('location'),
      url: formData.get('url'),
      type: formData.get('type'),
      programId: formData.get('programId'),
      cohortId: formData.get('cohortId'),
    };
    
    // Validate required fields
    if (!eventData.name) {
      return { success: false, error: 'Event name is required' };
    }
    
    if (!eventData.startDateTime) {
      return { success: false, error: 'Start date/time is required' };
    }
    
    // Create the event
    const result = await events.createEvent(eventData);
    
    // Revalidate caches
    revalidateTag('events');
    if (eventData.programId) {
      revalidateTag(`program:${eventData.programId}:events`);
    }
    if (eventData.cohortId) {
      revalidateTag(`cohort:${eventData.cohortId}:events`);
    }
    
    // Revalidate related paths
    revalidatePath('/dashboard/events');
    if (eventData.programId) {
      revalidatePath(`/dashboard/program/${eventData.programId}`);
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create event:', error);
    return { success: false, error: error.message || 'Failed to create event' };
  }
}

/**
 * Update an existing event
 */
export async function updateEvent(eventId, formData) {
  try {
    // Get auth session
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // Ensure we have an event ID
    if (!eventId) {
      return { success: false, error: 'Event ID is required' };
    }
    
    // Extract data from formData
    const updateData = {
      name: formData.get('name'),
      description: formData.get('description'),
      startDateTime: formData.get('startDateTime'),
      endDateTime: formData.get('endDateTime'),
      location: formData.get('location'),
      url: formData.get('url'),
      type: formData.get('type'),
      programId: formData.get('programId'),
      cohortId: formData.get('cohortId'),
    };
    
    // Get the existing event to determine what needs revalidation
    const existingEvent = await events.getEventById(eventId);
    
    // Update the event
    const result = await events.updateEvent(eventId, updateData);
    
    // Revalidate caches
    revalidateTag('events');
    revalidateTag(`event:${eventId}`);
    
    // Revalidate program tags if program ID changed or remained the same
    if (existingEvent?.programId) {
      revalidateTag(`program:${existingEvent.programId}:events`);
    }
    if (updateData.programId && updateData.programId !== existingEvent?.programId) {
      revalidateTag(`program:${updateData.programId}:events`);
    }
    
    // Revalidate cohort tags if cohort ID changed or remained the same
    if (existingEvent?.cohortId) {
      revalidateTag(`cohort:${existingEvent.cohortId}:events`);
    }
    if (updateData.cohortId && updateData.cohortId !== existingEvent?.cohortId) {
      revalidateTag(`cohort:${updateData.cohortId}:events`);
    }
    
    // Revalidate related paths
    revalidatePath('/dashboard/events');
    revalidatePath(`/dashboard/events/${eventId}`);
    
    if (existingEvent?.programId) {
      revalidatePath(`/dashboard/program/${existingEvent.programId}`);
    }
    if (updateData.programId && updateData.programId !== existingEvent?.programId) {
      revalidatePath(`/dashboard/program/${updateData.programId}`);
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error(`Failed to update event ${eventId}:`, error);
    return { success: false, error: error.message || 'Failed to update event' };
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId) {
  try {
    // Get auth session
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // Ensure we have an event ID
    if (!eventId) {
      return { success: false, error: 'Event ID is required' };
    }
    
    // Get the existing event to determine what needs revalidation
    const existingEvent = await events.getEventById(eventId);
    
    // Delete the event
    const result = await events.deleteEvent(eventId);
    
    // Revalidate caches
    revalidateTag('events');
    
    if (existingEvent?.programId) {
      revalidateTag(`program:${existingEvent.programId}:events`);
    }
    
    if (existingEvent?.cohortId) {
      revalidateTag(`cohort:${existingEvent.cohortId}:events`);
    }
    
    // Revalidate related paths
    revalidatePath('/dashboard/events');
    
    if (existingEvent?.programId) {
      revalidatePath(`/dashboard/program/${existingEvent.programId}`);
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error(`Failed to delete event ${eventId}:`, error);
    return { success: false, error: error.message || 'Failed to delete event' };
  }
}
```

### Institutions Mutations (if needed)

```javascript
// app/actions/institutions.js
'use server'

import { institutions } from '@/lib/airtable/entities';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/lib/app-router-auth';

/**
 * Create a partnership between an institution and program
 */
export async function createPartnership(formData) {
  try {
    // Get auth session
    const session = await auth();
    if (!session || !session.user.isAdmin) {
      return { success: false, error: 'Not authorized' };
    }
    
    const institutionId = formData.get('institutionId');
    const programId = formData.get('programId');
    const status = formData.get('status') || 'active';
    const notes = formData.get('notes') || '';
    
    // Validate required fields
    if (!institutionId) {
      return { success: false, error: 'Institution ID is required' };
    }
    
    if (!programId) {
      return { success: false, error: 'Program ID is required' };
    }
    
    // Create the partnership (assuming this function exists)
    const result = await institutions.createPartnership({
      institutionId,
      programId,
      status,
      notes
    });
    
    // Revalidate caches
    revalidateTag('partnerships');
    revalidateTag(`institution:${institutionId}:partnerships`);
    revalidateTag(`program:${programId}:partnerships`);
    
    // Revalidate related paths
    revalidatePath(`/dashboard/institutions/${institutionId}`);
    revalidatePath(`/dashboard/program/${programId}`);
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create partnership:', error);
    return { success: false, error: error.message || 'Failed to create partnership' };
  }
}
```

## Client Component Integration

### Events Component Examples

#### Server Component (Page)

```jsx
// app/dashboard/events/page.js
import { getUpcomingEvents } from '@/app/lib/events';
import { Suspense } from 'react';
import EventsList from './components/events-list';
import EventsListSkeleton from './components/events-list-skeleton';
import CreateEventButton from './components/create-event-button';

export const metadata = {
  title: 'Upcoming Events | xFoundry',
  description: 'View upcoming events and activities'
};

export default async function EventsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Upcoming Events</h1>
        <CreateEventButton />
      </div>
      
      <Suspense fallback={<EventsListSkeleton />}>
        <EventsSection />
      </Suspense>
    </div>
  );
}

// This component is a server component that fetches data
async function EventsSection() {
  const events = await getUpcomingEvents(10);
  
  return <EventsList events={events} />;
}
```

#### Client Component with Event Form

```jsx
// app/dashboard/events/components/create-event-form.jsx
'use client'

import { useFormState } from 'react-dom';
import { createEvent } from '@/app/actions/events';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { format } from 'date-fns';

const initialState = {
  success: false,
  error: null,
  data: null
};

export default function CreateEventForm({ onSuccess }) {
  const [state, formAction] = useFormState(createEvent, initialState);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  
  // Callback to handle success
  if (state.success && state.data && onSuccess) {
    onSuccess(state.data);
  }
  
  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="bg-red-50 p-4 rounded-md text-red-500">{state.error}</div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Event Name
        </label>
        <Input 
          id="name" 
          name="name" 
          placeholder="Enter event name" 
          required 
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <Textarea 
          id="description" 
          name="description" 
          placeholder="Describe the event" 
          rows={3} 
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Start Date/Time
          </label>
          <div className="flex flex-col space-y-2">
            <Calendar 
              selected={startDate}
              onSelect={setStartDate}
              className="border rounded-md p-2"
            />
            {/* Time input */}
            <Input 
              type="time" 
              name="startTime" 
              defaultValue="09:00" 
            />
            <input 
              type="hidden" 
              name="startDateTime" 
              value={format(startDate, "yyyy-MM-dd'T'HH:mm:ss")} 
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            End Date/Time
          </label>
          <div className="flex flex-col space-y-2">
            <Calendar 
              selected={endDate}
              onSelect={setEndDate}
              className="border rounded-md p-2"
            />
            {/* Time input */}
            <Input 
              type="time" 
              name="endTime" 
              defaultValue="17:00" 
            />
            <input 
              type="hidden" 
              name="endDateTime" 
              value={format(endDate, "yyyy-MM-dd'T'HH:mm:ss")} 
            />
          </div>
        </div>
      </div>
      
      <div>
        <label htmlFor="location" className="block text-sm font-medium mb-1">
          Location
        </label>
        <Input 
          id="location" 
          name="location" 
          placeholder="Event location" 
        />
      </div>
      
      <div>
        <label htmlFor="url" className="block text-sm font-medium mb-1">
          Event URL
        </label>
        <Input 
          id="url" 
          name="url" 
          placeholder="https://example.com/event" 
          type="url" 
        />
      </div>
      
      <div>
        <label htmlFor="type" className="block text-sm font-medium mb-1">
          Event Type
        </label>
        <select 
          id="type" 
          name="type" 
          className="w-full border rounded-md py-2 px-3"
        >
          <option value="Workshop">Workshop</option>
          <option value="Seminar">Seminar</option>
          <option value="Networking">Networking</option>
          <option value="Deadline">Deadline</option>
          <option value="General">General</option>
        </select>
      </div>
      
      <div className="mt-6 flex justify-end">
        <Button type="submit">Create Event</Button>
      </div>
    </form>
  );
}
```

#### Event Details Component with Dynamic Data

```jsx
// app/dashboard/events/[eventId]/page.js
import { getEvent } from '@/app/lib/events';
import { notFound } from 'next/navigation';
import EventDetailsView from '../components/event-details-view';
import EventActionsBar from '../components/event-actions-bar';

export async function generateMetadata({ params }) {
  const event = await getEvent(params.eventId);
  
  if (!event) {
    return {
      title: 'Event Not Found',
      description: 'The requested event could not be found.'
    };
  }
  
  return {
    title: `${event.name} | xFoundry Events`,
    description: event.description?.substring(0, 160) || 'Event details'
  };
}

export default async function EventPage({ params }) {
  const event = await getEvent(params.eventId);
  
  if (!event) {
    notFound();
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <EventActionsBar event={event} />
        <EventDetailsView event={event} />
      </div>
    </div>
  );
}
```

### Institutions Component Examples

#### Server Component (Page)

```jsx
// app/dashboard/institutions/[institutionId]/page.js
import { getInstitution, getInstitutionPartnerships } from '@/app/lib/institutions';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import InstitutionHeader from '../components/institution-header';
import PartnershipsSection from '../components/partnerships-section';
import PartnershipsSkeleton from '../components/partnerships-skeleton';

export async function generateMetadata({ params }) {
  const institution = await getInstitution(params.institutionId);
  
  if (!institution) {
    return {
      title: 'Institution Not Found',
      description: 'The requested institution could not be found.'
    };
  }
  
  return {
    title: `${institution.name} | xFoundry`,
    description: `Information about ${institution.name} and its partnerships.`
  };
}

export default async function InstitutionPage({ params }) {
  const institution = await getInstitution(params.institutionId);
  
  if (!institution) {
    notFound();
  }
  
  return (
    <div className="container mx-auto py-8">
      <InstitutionHeader institution={institution} />
      
      <h2 className="text-2xl font-bold mt-8 mb-4">Partnerships</h2>
      <Suspense fallback={<PartnershipsSkeleton />}>
        <InstitutionPartnerships institutionId={params.institutionId} />
      </Suspense>
    </div>
  );
}

// This component is a server component that fetches data
async function InstitutionPartnerships({ institutionId }) {
  const partnerships = await getInstitutionPartnerships(institutionId);
  
  return <PartnershipsSection partnerships={partnerships} />;
}
```

#### Institution Search Component

```jsx
// app/dashboard/institutions/components/institution-search.jsx
'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export default function InstitutionSearch() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    router.push(`/dashboard/institutions/search?q=${encodeURIComponent(query)}`);
  };
  
  return (
    <form onSubmit={handleSearch} className="flex space-x-2">
      <Input
        type="text"
        placeholder="Search institutions..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-grow"
      />
      <Button type="submit" disabled={isSearching || !query.trim()}>
        {isSearching ? <Spinner size="sm" /> : 'Search'}
      </Button>
    </form>
  );
}
```

#### Institutions Search Results Page

```jsx
// app/dashboard/institutions/search/page.js
import { searchInstitutions } from '@/app/lib/institutions';
import InstitutionsList from '../components/institutions-list';
import InstitutionSearch from '../components/institution-search';

export const dynamic = 'force-dynamic'; // Force dynamic rendering for search results

export async function generateMetadata({ searchParams }) {
  const query = searchParams.q || '';
  
  return {
    title: `Search: ${query} | Institutions`,
    description: `Search results for "${query}" in the institutions directory.`
  };
}

export default async function InstitutionsSearchPage({ searchParams }) {
  const query = searchParams.q || '';
  const limit = parseInt(searchParams.limit) || 20;
  
  // Only perform search if we have a query
  const results = query.length >= 2 
    ? await searchInstitutions(query, limit)
    : { institutions: [], count: 0 };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Institutions Search</h1>
      
      <div className="mb-6">
        <InstitutionSearch />
      </div>
      
      {query.length < 2 ? (
        <p className="text-gray-500">Please enter at least 2 characters to search</p>
      ) : results.count === 0 ? (
        <p className="text-gray-500">No results found for &quot;{query}&quot;</p>
      ) : (
        <>
          <p className="text-gray-500 mb-4">
            Found {results.count} result{results.count !== 1 ? 's' : ''} for &quot;{query}&quot;
          </p>
          <InstitutionsList institutions={results.institutions} />
        </>
      )}
    </div>
  );
}
```

## Caching Strategy Implementation

```javascript
// app/lib/cache-utils.js

/**
 * Cache tag constants for consistent cache invalidation
 */
export const CACHE_TAGS = {
  EVENTS: {
    ALL: 'events',
    SINGLE: (id) => `event:${id}`,
    PROGRAM: (id) => `program:${id}:events`,
    COHORT: (id) => `cohort:${id}:events`,
    USER: (userId) => `user:${userId}:events`,
  },
  INSTITUTIONS: {
    ALL: 'institutions',
    SINGLE: (id) => `institution:${id}`,
    PARTNERSHIPS: (id) => `institution:${id}:partnerships`,
  },
  PROGRAMS: {
    ALL: 'programs',
    SINGLE: (id) => `program:${id}`,
    PARTNERSHIPS: (id) => `program:${id}:partnerships`,
  }
};

/**
 * Cache durations (in seconds)
 */
export const CACHE_DURATIONS = {
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
  
  // Specific durations for different data types
  USER_PROFILE: 0, // Always fresh
  EVENTS: 300, // 5 minutes
  PROGRAMS: 3600, // 1 hour
  INSTITUTIONS: 86400, // 24 hours
};

/**
 * Helper function to revalidate all related caches for an entity
 */
export function revalidateEntityCaches(entityType, entityId, relatedEntities = []) {
  switch (entityType) {
    case 'event':
      revalidateTag(CACHE_TAGS.EVENTS.ALL);
      revalidateTag(CACHE_TAGS.EVENTS.SINGLE(entityId));
      
      // Revalidate related entities if provided
      relatedEntities.forEach(({ type, id }) => {
        if (type === 'program') {
          revalidateTag(CACHE_TAGS.EVENTS.PROGRAM(id));
          revalidateTag(CACHE_TAGS.PROGRAMS.SINGLE(id));
        } else if (type === 'cohort') {
          revalidateTag(CACHE_TAGS.EVENTS.COHORT(id));
        }
      });
      break;
      
    case 'institution':
      revalidateTag(CACHE_TAGS.INSTITUTIONS.ALL);
      revalidateTag(CACHE_TAGS.INSTITUTIONS.SINGLE(entityId));
      
      // Revalidate partnerships
      revalidateTag(CACHE_TAGS.INSTITUTIONS.PARTNERSHIPS(entityId));
      
      // Revalidate related entities if provided
      relatedEntities.forEach(({ type, id }) => {
        if (type === 'program') {
          revalidateTag(CACHE_TAGS.PROGRAMS.PARTNERSHIPS(id));
        }
      });
      break;
      
    // Additional entity types...
  }
}

/**
 * Helper function to revalidate all related paths for an entity
 */
export function revalidateEntityPaths(entityType, entityId, relatedEntities = []) {
  switch (entityType) {
    case 'event':
      revalidatePath('/dashboard/events');
      revalidatePath(`/dashboard/events/${entityId}`);
      
      // Revalidate related paths
      relatedEntities.forEach(({ type, id }) => {
        if (type === 'program') {
          revalidatePath(`/dashboard/program/${id}`);
        } else if (type === 'cohort') {
          revalidatePath(`/dashboard/cohorts/${id}`);
        }
      });
      break;
      
    case 'institution':
      revalidatePath('/dashboard/institutions');
      revalidatePath(`/dashboard/institutions/${entityId}`);
      
      // Revalidate related paths
      relatedEntities.forEach(({ type, id }) => {
        if (type === 'program') {
          revalidatePath(`/dashboard/program/${id}`);
        }
      });
      break;
      
    // Additional entity types...
  }
}
```

## Migration Path

### From React Query to Server Components

1. **Identify Data Needs**:
   - Determine which data needs to be fetched server-side vs. client-side
   - Map existing React Query hooks to Server Component data fetchers

2. **Create Server-Side Data Fetchers**:
   - Implement server-side data fetching functions in `app/lib/`
   - Use `cache()` for request memoization where needed
   - Implement proper error handling
   - Set up appropriate caching strategies

3. **Create API Route Handlers**:
   - Create route handlers for data that needs to be available via API
   - Implement consistent error handling and response formats
   - Set up proper cache headers

4. **Create Server Actions**:
   - Implement Server Actions for mutations
   - Add proper validation and error handling
   - Implement cache invalidation for affected data

5. **Update/Create Server Components**:
   - Create Server Components that use the new data fetchers
   - Implement Suspense boundaries for progressive loading
   - Set up appropriate error boundaries

6. **Create Client Wrappers (Only If Needed)**:
   - For components that must be client-side, create minimal client hooks
   - Use the `use` hook to integrate with server data fetchers
   - Keep these to a minimum to maximize server-rendering benefits

7. **Test and Validate**:
   - Test server rendering performance
   - Validate cache effectiveness
   - Ensure proper error handling
   - Check loading state behavior with Suspense

### Transitional Approach

During migration, you may need to support both patterns. Here's an approach:

1. Start with Server Components and APIs for new features
2. For existing features, create the Server Component version alongside the React Query version
3. Gradually replace React Query implementations with calls to server data fetchers
4. Use feature flags to switch between implementations if needed

### Performance Considerations

- Use parallel data fetching with `Promise.all()` where possible
- Implement appropriate caching strategies for different data types
- Use streaming with Suspense for better user experience during loading
- Consider partial prerendering for static portions of dynamic pages