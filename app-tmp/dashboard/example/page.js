/**
 * Dashboard Example Page
 * Server Component implementation using Next.js App Router
 */
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/app-router-auth';
import { getCompleteUserProfile } from '@/lib/userProfile.refactored';
import { getActivePrograms } from '@/lib/airtable/entities/programs';
import { getParticipationRecords } from '@/lib/airtable/entities/participation';

// Import client components for interactive elements
import ClientSideDashboardHeader from './components/client-dashboard-header';
import ClientSideProgramList from './components/client-program-list';

// Server components (separate files for better organization)
import ProgramsSection from './components/programs-section';
import TeamsSection from './components/teams-section';
import ActivitySection from './components/activity-section';

/**
 * Loading skeleton for programs section
 */
function ProgramsSkeleton() {
  return (
    <div className="w-full p-4 space-y-2">
      <div className="h-8 w-40 bg-gray-200 rounded animate-pulse"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for teams section
 */
function TeamsSkeleton() {
  return (
    <div className="w-full p-4 space-y-2">
      <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
      <div className="grid grid-cols-1 gap-4">
        {Array(2).fill(0).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for activity section
 */
function ActivitySkeleton() {
  return (
    <div className="w-full p-4 space-y-2">
      <div className="h-8 w-36 bg-gray-200 rounded animate-pulse"></div>
      <div className="space-y-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

/**
 * Dashboard example page - Server Component with streaming
 */
export default async function DashboardExamplePage() {
  // Check authentication
  const user = await getCurrentUser();
  if (!user) {
    redirect('/api/auth/login');
  }
  
  // Get profile data - this is needed immediately
  const profile = await getCompleteUserProfile(user);
  
  return (
    <div className="dashboard-container max-w-7xl mx-auto px-4 py-8">
      {/* Critical UI that loads immediately */}
      <ClientSideDashboardHeader user={profile} />
      
      {/* Programs section - can be streamed */}
      <Suspense fallback={<ProgramsSkeleton />}>
        <ProgramsSection userId={profile.contactId} />
      </Suspense>
      
      <div className="dashboard-columns grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <div className="md:col-span-2">
          {/* Teams section - can be streamed */}
          <Suspense fallback={<TeamsSkeleton />}>
            <TeamsSection userId={profile.contactId} />
          </Suspense>
        </div>
        
        <div>
          {/* Activity section - can be streamed */}
          <Suspense fallback={<ActivitySkeleton />}>
            <ActivitySection userId={profile.contactId} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}