import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/app-router-auth';
import { DashboardClientWrapper } from './components/DashboardClientWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  getCurrentUserContact,
  getUserTeams, 
  getActivePrograms, 
  getUpcomingEvents,
  fetchParallelData 
} from '@/lib/app-router';

/**
 * Dashboard Page - Server Component
 * Main dashboard page showing user's programs, teams, and upcoming events
 * Uses parallel data fetching to avoid request waterfalls
 */
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }
  
  // Get user's contact record
  const contact = await getCurrentUserContact(user);
  if (!contact) {
    // Handle case where user is authenticated but has no contact record
    // This could happen if Auth0 user exists but Airtable record doesn't
    console.error(`No contact record found for user ${user.email}`);
  }
  
  const contactId = contact?.id;
  
  // Fetch all data in parallel
  const { teams, programs, events } = await fetchParallelData({
    teams: () => getUserTeams(contactId),
    programs: () => getActivePrograms(),
    events: () => getUpcomingEvents(5),
  });
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Programs Section */}
        <Card>
          <CardHeader>
            <CardTitle>My Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading programs...</div>}>
              <ProgramsSection programs={programs} />
            </Suspense>
          </CardContent>
        </Card>
        
        {/* Teams Section */}
        <Card>
          <CardHeader>
            <CardTitle>My Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading teams...</div>}>
              <TeamsSection teams={teams} />
            </Suspense>
          </CardContent>
        </Card>
        
        {/* Events Section */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading events...</div>}>
              <EventsSection events={events} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
      
      {/* Client component wrapper for interactive elements */}
      <DashboardClientWrapper userId={user.sub} contactId={contactId} />
    </div>
  );
}

// Server component for programs section
function ProgramsSection({ programs }) {
  if (!programs || programs.length === 0) {
    return (
      <div className="p-4 border rounded-md border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-muted-foreground">You're not currently enrolled in any programs.</p>
        <a href="/dashboard/programs" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
          Browse available programs →
        </a>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {programs.map(program => (
        <div key={program.id} className="border rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
          <div className="flex items-center space-x-3">
            {program.logo && (
              <img 
                src={program.logo} 
                alt={program.name} 
                className="h-10 w-10 object-contain rounded"
              />
            )}
            <div>
              <h3 className="font-medium">{program.name}</h3>
              <p className="text-sm text-muted-foreground">{program.shortDescription}</p>
            </div>
          </div>
          <div className="mt-2">
            <a 
              href={`/dashboard/programs/${program.id}`}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              View details →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

// Server component for teams section
function TeamsSection({ teams }) {
  if (!teams || teams.length === 0) {
    return (
      <div className="p-4 border rounded-md border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-muted-foreground">You're not currently a member of any teams.</p>
        <a href="/dashboard/teams" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
          Join or create a team →
        </a>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {teams.map(team => (
        <div key={team.id} className="border rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
          <h3 className="font-medium">{team.name}</h3>
          <p className="text-sm text-muted-foreground mb-2">
            {team.members?.length} {team.members?.length === 1 ? 'member' : 'members'}
          </p>
          <a 
            href={`/dashboard/teams/${team.id}`}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            View team →
          </a>
        </div>
      ))}
    </div>
  );
}

// Server component for events section
function EventsSection({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="p-4 border rounded-md border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-muted-foreground">No upcoming events scheduled.</p>
      </div>
    );
  }
  
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {events.map(event => (
        <div key={event.id} className="border rounded-md p-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
          <h3 className="font-medium">{event.name}</h3>
          <p className="text-sm text-muted-foreground">{event.startDateFormatted}</p>
          <p className="text-xs text-muted-foreground">
            {event.startTimeFormatted} - {event.endTimeFormatted}
          </p>
          <p className="text-sm mt-2">{event.location}</p>
          
          {event.registrationUrl && (
            <a 
              href={event.registrationUrl}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
              target="_blank"
              rel="noopener noreferrer"
            >
              Register →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}