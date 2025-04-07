# Server Component Implementation Examples

This document provides examples of Server Component implementations for the App Router migration. These examples demonstrate the proper patterns for data fetching, error handling, and component structure.

## Dashboard Page Example

```jsx
// app/dashboard/page.jsx
import { Suspense } from 'react';
import { auth } from '@/lib/app-router-auth';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { ProgramsSection } from './components/ProgramsSection';
import { TeamsSection } from './components/TeamsSection';
import { EventsSection } from './components/EventsSection';
import { 
  ProgramsSkeleton, 
  TeamsSkeleton, 
  EventsSkeleton 
} from '@/components/ui/skeletons';

/**
 * Dashboard Page - Server Component
 * 
 * Implements streaming with Suspense boundaries for
 * independent loading of different dashboard sections
 */
export default async function DashboardPage() {
  // Auth check and redirect
  const session = await auth();
  if (!session) {
    // This should be handled by middleware, but as a fallback
    redirect('/login');
  }
  
  return (
    <div className="dashboard-container">
      {/* Client component for interactive elements */}
      <DashboardHeader user={session.user} />
      
      <div className="dashboard-grid mt-6 grid gap-6 md:grid-cols-2">
        {/* Programs section with suspense boundary */}
        <Suspense fallback={<ProgramsSkeleton />}>
          <ProgramsSection userId={session.user.sub} />
        </Suspense>
        
        {/* Teams section with suspense boundary */}
        <Suspense fallback={<TeamsSkeleton />}>
          <TeamsSection userId={session.user.sub} />
        </Suspense>
        
        {/* Events section with suspense boundary */}
        <Suspense fallback={<EventsSkeleton />}>
          <EventsSection />
        </Suspense>
      </div>
    </div>
  );
}
```

## Dashboard Section Component Example

```jsx
// app/dashboard/components/ProgramsSection.jsx
import Link from 'next/link';
import { ProgramCard } from '@/components/program/ProgramCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentUserPrograms } from '@/lib/airtable/entities/programs';

/**
 * Programs Section - Server Component
 * 
 * Fetches and displays user's active programs
 */
export async function ProgramsSection({ userId }) {
  try {
    // Fetch programs data on the server with caching
    const programs = await getCurrentUserPrograms(userId, {
      // Cache for 10 minutes (programs don't change often)
      next: { revalidate: 600, tags: ['user-programs'] }
    });
    
    if (!programs || programs.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">My Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                You're not participating in any programs yet.
              </p>
              <Link href="/dashboard/programs">
                <Button>Browse Available Programs</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold">My Programs</CardTitle>
          <Link href="/dashboard/programs">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {programs.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error('Error loading programs:', error);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">My Programs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-red-800 dark:text-red-300">
            <p>Failed to load programs: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
}
```

## Profile Page Example

```jsx
// app/dashboard/profile/page.jsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/app-router-auth';
import { getUserByAuth0Id } from '@/lib/airtable/entities/users';
import { getEducation } from '@/lib/airtable/entities/education';
import ProfileHeader from './components/ProfileHeader';
import ProfileDetails from './components/ProfileDetails';
import EducationSection from './components/EducationSection';
import ProfileDialogButton from './components/ProfileDialogButton';
import { ProfileSkeleton, EducationSkeleton } from '@/components/ui/skeletons';

/**
 * Profile Page - Server Component
 * 
 * Implements streaming with Suspense boundaries for
 * independent loading of different profile sections
 */
export default async function ProfilePage() {
  // Get authenticated user
  const session = await auth();
  if (!session) {
    redirect('/login');
  }
  
  try {
    // Fetch the minimal user profile data needed for initial render
    const user = await getUserByAuth0Id(session.user.sub, { 
      next: { revalidate: 60, tags: ['user-profile'] }
    });
    
    if (!user) {
      notFound();
    }
    
    return (
      <div className="container max-w-4xl">
        <ProfileHeader 
          name={`${user.firstName} ${user.lastName}`} 
          email={user.email} 
        />
        
        <div className="grid gap-6 mt-6">
          {/* Profile details with suspense boundary */}
          <Suspense fallback={<ProfileSkeleton />}>
            <ProfileDetails userId={user.contactId} />
          </Suspense>
          
          {/* Education section with suspense boundary */}
          <Suspense fallback={<EducationSkeleton />}>
            <EducationSection userId={user.contactId} />
          </Suspense>
        </div>
        
        {/* Client component for editing profile */}
        <ProfileDialogButton userId={user.contactId} />
      </div>
    );
  } catch (error) {
    console.error('Error loading profile:', error);
    return (
      <div className="container max-w-4xl">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
          <h2 className="text-red-800 dark:text-red-300 text-lg font-medium mb-2">Error Loading Profile</h2>
          <p className="text-red-700 dark:text-red-200">{error.message || 'An unexpected error occurred'}</p>
        </div>
      </div>
    );
  }
}
```

## Program Detail Component Example

```jsx
// app/dashboard/program/[programId]/page.jsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/app-router-auth';
import { getProgram } from '@/lib/airtable/entities/programs';
import ProgramHeader from './components/ProgramHeader';
import ProgramDetails from './components/ProgramDetails';
import TeamSection from './components/TeamSection';
import MilestonesSection from './components/MilestonesSection';
import { DetailsSkeleton, TeamSkeleton, MilestonesSkeleton } from '@/components/ui/skeletons';

/**
 * Program Detail Page - Server Component
 * 
 * Shows program details, team info, and milestones with
 * parallel data loading and streaming
 */
export default async function ProgramPage({ params }) {
  // Get authenticated user
  const session = await auth();
  if (!session) {
    redirect('/login');
  }
  
  try {
    // Start parallel data fetching
    const programPromise = getProgram(params.programId, {
      next: { revalidate: 3600, tags: [`program-${params.programId}`] }
    });
    
    // Wait for critical program data first
    const program = await programPromise;
    
    if (!program) {
      notFound();
    }
    
    return (
      <div className="program-page container">
        <ProgramHeader 
          name={program.name} 
          description={program.description} 
          logoUrl={program.logoUrl}
        />
        
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-2">
            <Suspense fallback={<DetailsSkeleton />}>
              <ProgramDetails programId={params.programId} />
            </Suspense>
            
            <Suspense fallback={<MilestonesSkeleton />}>
              <MilestonesSection programId={params.programId} />
            </Suspense>
          </div>
          
          <div>
            <Suspense fallback={<TeamSkeleton />}>
              <TeamSection 
                programId={params.programId} 
                userId={session.user.sub} 
              />
            </Suspense>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading program:', error);
    return (
      <div className="container">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
          <h2 className="text-red-800 dark:text-red-300 text-lg font-medium mb-2">Error Loading Program</h2>
          <p className="text-red-700 dark:text-red-200">{error.message || 'An unexpected error occurred'}</p>
        </div>
      </div>
    );
  }
}
```

## Implementation Notes

### Data Fetching Strategy

1. **Critical Initial Data**
   - Load minimal essential data as early as possible
   - Use this data for initial rendering and layout

2. **Secondary Data in Suspense Boundaries**
   - Wrap non-critical sections in Suspense
   - Provide skeleton loaders as fallbacks
   - Allow progressive rendering as data loads

3. **Parallel Data Loading**
   - Start multiple fetch requests in parallel 
   - Use the technique of creating promises and then awaiting them later
   - Prevents data loading waterfalls

### Error Handling

1. **Component-Level Error Boundaries**
   - Each major section handles its own errors
   - Prevents entire page from failing due to one section

2. **Graceful Degradation**
   - Show useful error messages
   - If possible, show partial content when only some data fails

3. **NotFound Handling**
   - Use notFound() function when requested resources don't exist
   - Triggers the nearest not-found.js special file

### Authentication and Authorization

1. **Early Auth Checks**
   - Check authentication early in the component
   - Redirect to login if not authenticated
   - This is a backup to middleware protection

2. **Per-Resource Authorization**
   - Check if the user has access to the specific resource
   - Include authorization logic in data fetching

### Performance Optimization

1. **Cache Configuration**
   - Set appropriate revalidation times for different data types
   - Use cache tags for precise invalidation

2. **Streaming with Suspense**
   - Break page into logical sections with Suspense boundaries
   - Enables streaming HTML response to the client

3. **Lazy Loading**
   - Load below-the-fold content lazily
   - Use client-side components for deferred loading