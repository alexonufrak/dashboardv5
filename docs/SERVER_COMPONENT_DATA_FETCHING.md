# Server Component Data Fetching Pattern

This document outlines the new server component data fetching pattern for the xFoundry Dashboard App Router implementation. This pattern replaces client-side React Query hooks with server component data fetching to improve performance and reduce client-side JavaScript.

## Overview

Server Components in the App Router enable data fetching directly on the server. This provides several benefits:

- Reduced client-side JavaScript bundle size
- Elimination of client-server request waterfalls
- Improved initial page load performance
- Automatic caching of fetch requests
- SEO improvements (content is directly rendered in HTML)

Our implementation provides a structured approach to server-side data fetching that maintains consistency with our domain model.

## Directory Structure

```
/lib/app-router/
├── index.js                 # Main exports and utilities
├── airtable.js              # Core Airtable fetching utilities
├── entities/
│   ├── index.js             # Entity exports
│   ├── contacts.js          # Contact data fetching
│   ├── programs.js          # Program data fetching
│   ├── teams.js             # Team data fetching
│   └── events.js            # Event data fetching
```

## Implementation Details

### 1. Core Fetching Utility

The `fetchAirtableData` function in `airtable.js` provides a base utility for cached Airtable data fetching:

```javascript
export const fetchAirtableData = cache(async (tableFn, options = {}) => {
  // ... implementation
});
```

This function is wrapped with React's `cache()` utility to deduplicate requests within a render cycle.

### 2. Entity-Specific Utilities

Each entity module provides specialized functions for fetching and formatting data:

```javascript
// In entities/contacts.js
export const getCurrentUserContact = cache(async (user) => {
  // ... implementation
});

export function formatContact(contact) {
  // ... implementation
}
```

### 3. Parallel Data Fetching

To avoid request waterfalls, we implemented the `fetchParallelData` helper:

```javascript
export async function fetchParallelData(fetchFunctions) {
  const results = await Promise.all(
    Object.entries(fetchFunctions).map(async ([key, fetchFn]) => {
      try {
        const result = await fetchFn();
        return [key, result];
      } catch (error) {
        console.error(`Error fetching ${key}:`, error);
        return [key, null];
      }
    })
  );
  
  return Object.fromEntries(results);
}
```

## Using the Pattern

### In Server Components

```jsx
import { getCurrentUserContact, getUserTeams } from '@/lib/app-router';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const contact = await getCurrentUserContact(user);
  
  // Pass data down to child components
  return (
    <div>
      <ProfileDisplay contact={contact} />
    </div>
  );
}
```

### Parallel Data Fetching

```jsx
import { fetchParallelData, getUserTeams, getActivePrograms } from '@/lib/app-router';

export default async function DashboardPage() {
  // Fetch all data in parallel
  const { teams, programs } = await fetchParallelData({
    teams: () => getUserTeams(contactId),
    programs: () => getActivePrograms(),
  });
  
  return (
    <div>
      <TeamsSection teams={teams} />
      <ProgramsSection programs={programs} />
    </div>
  );
}
```

### With Suspense

```jsx
import { Suspense } from 'react';
import { getUserTeams } from '@/lib/app-router';

export default async function TeamsPage() {
  return (
    <div>
      <Suspense fallback={<div>Loading teams...</div>}>
        <TeamsList />
      </Suspense>
    </div>
  );
}

// This could be extracted to a separate file
async function TeamsList() {
  const teams = await getUserTeams(contactId);
  
  return (
    <ul>
      {teams.map(team => (
        <li key={team.id}>{team.name}</li>
      ))}
    </ul>
  );
}
```

## Benefits Over React Query

1. **Reduced Client JavaScript**: Data fetching code stays on the server
2. **Simplified Components**: No need for loading/error states in many components
3. **Improved Performance**: Data is fetched at build time or during SSR
4. **No Request Waterfalls**: Parallel data fetching prevents sequential requests
5. **Automatic Caching**: Next.js provides built-in caching mechanisms
6. **Better SEO**: Content is rendered in the initial HTML response

## When to Use React Query vs. Server Components

While server components are preferable for most data fetching, React Query still has appropriate use cases:

### Use Server Components For:
- Initial page data
- SEO-critical content
- Static or infrequently changing data
- Data that doesn't require user interaction to load

### Use React Query For:
- User-triggered data fetching (e.g., search results)
- Real-time or frequently refreshing data
- Data that depends on client-side state
- Complex local state management with mutations

## Invalidating Cache with Server Actions

When using server actions to mutate data, use `revalidatePath` or `revalidateTag` to invalidate cache:

```javascript
'use server'

import { revalidatePath } from 'next/cache';

export async function updateProfile(formData) {
  // Update logic...
  
  // Invalidate the cache for this path
  revalidatePath('/dashboard/profile');
  
  return { success: true };
}
```