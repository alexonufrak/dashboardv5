import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/app-router-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ClockIcon, MapPinIcon } from 'lucide-react';
import { 
  getCurrentUserContact,
  getAllUpcomingEvents,
  getContactEvents,
  getPastEvents,
  getActivePrograms,
  fetchParallelData
} from '@/lib/app-router';
import CreateEventButton from './components/CreateEventButton';

/**
 * Events Page - Server Component
 * Shows upcoming events, user's registered events, and past events
 * Uses React Server Components with App Router for optimal performance
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'Events | xFoundry Dashboard',
    description: 'View upcoming and past events from all xFoundry programs.'
  };
}

export default async function EventsPage() {
  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }
  
  // Get user's contact record
  const contact = await getCurrentUserContact(user);
  if (!contact) {
    console.error(`No contact record found for user ${user.email}`);
  }
  
  const contactId = contact?.id;
  
  // Check if user is an admin (in a real app, you'd have a proper role check)
  // For now, we'll use a simple check based on email domain
  const isAdmin = user.email?.endsWith('@xfoundry.org') || false;
  
  // Fetch all data in parallel
  const { upcomingEvents, registeredEvents, pastEvents, programs } = await fetchParallelData({
    upcomingEvents: () => getAllUpcomingEvents(),
    registeredEvents: () => getContactEvents(contactId),
    pastEvents: () => getPastEvents(),
    programs: () => getActivePrograms(),
  });
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground">Browse all upcoming events and manage your registrations</p>
        </div>
        
        {isAdmin && (
          <div className="mt-4 md:mt-0">
            <CreateEventButton programs={programs} />
          </div>
        )}
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="registered">Registered</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Events that are available for registration</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading upcoming events...</div>}>
                <EventsList events={upcomingEvents} showRegisterButton />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="registered">
          <Card>
            <CardHeader>
              <CardTitle>Your Registered Events</CardTitle>
              <CardDescription>Events you've registered to attend</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading your events...</div>}>
                <EventsList events={registeredEvents} showProgram />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="past">
          <Card>
            <CardHeader>
              <CardTitle>Past Events</CardTitle>
              <CardDescription>Recently concluded events</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading past events...</div>}>
                <EventsList events={pastEvents} showProgram isPast />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Server component for events list
function EventsList({ events, showRegisterButton = false, showProgram = false, isPast = false }) {
  if (!events || events.length === 0) {
    return (
      <div className="p-4 border rounded-md border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-muted-foreground">
          {isPast ? "No past events to display." : 
           showRegisterButton ? "No upcoming events scheduled at this time." : 
           "You haven't registered for any events yet."}
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map(event => (
        <div 
          key={event.id} 
          className="border rounded-md p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex flex-col"
        >
          {event.imageUrl ? (
            <div className="mb-3">
              <img 
                src={event.imageUrl} 
                alt={event.name} 
                className="w-full h-32 object-cover rounded-md"
              />
            </div>
          ) : (
            <div className="mb-3 w-full h-32 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <CalendarIcon className="h-12 w-12 text-gray-400" />
            </div>
          )}
          
          <h3 className="font-medium text-lg">{event.name}</h3>
          
          {showProgram && event.programName && (
            <p className="text-sm text-muted-foreground mb-1">
              {event.programName}
              {event.cohortName && ` • ${event.cohortName}`}
            </p>
          )}
          
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span>{event.startDateFormatted}</span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <ClockIcon className="h-4 w-4 mr-1" />
            <span>{event.startTimeFormatted}{event.endTimeFormatted ? ` - ${event.endTimeFormatted}` : ''}</span>
          </div>
          
          {event.location && (
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <MapPinIcon className="h-4 w-4 mr-1" />
              <span>{event.location}</span>
            </div>
          )}

          {event.description && (
            <p className="text-sm mt-2 line-clamp-2">{event.description}</p>
          )}
          
          <div className="mt-auto pt-3">
            <a 
              href={`/dashboard/events/${event.id}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View details
            </a>
            
            {showRegisterButton && event.isRegistrationOpen && event.registrationUrl && (
              <div className="mt-2">
                <Button 
                  asChild 
                  size="sm" 
                  variant="outline"
                  className="w-full"
                >
                  <a 
                    href={event.registrationUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Register
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}