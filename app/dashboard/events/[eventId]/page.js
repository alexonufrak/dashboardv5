import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/app-router-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ClockIcon, MapPinIcon, Users, ArrowLeft, Edit } from 'lucide-react';
import { 
  getCurrentUserContact,
  getEventById,
  getContactEvents,
  getActivePrograms,
  fetchParallelData
} from '@/lib/app-router';
import EventRegistrationButton from '../components/EventRegistrationButton';
import EditEventButton from './EditEventButton';
import DeleteEventButton from './DeleteEventButton';

/**
 * Event Detail Page - Server Component
 * Shows detailed information about a specific event
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { eventId } = params;
  const event = await getEventById(eventId);
  
  if (!event) {
    return {
      title: 'Event Not Found | xFoundry Dashboard',
      description: 'The requested event could not be found.'
    };
  }
  
  return {
    title: `${event.name} | xFoundry Dashboard`,
    description: event.description || 'Event details and registration information.'
  };
}

export default async function EventDetailPage({ params }) {
  const { eventId } = params;
  
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
  const isAdmin = user.email?.endsWith('@xfoundry.org') || false;
  
  // Fetch event data, user's registered events, and programs in parallel
  const { event, registeredEvents, programs } = await fetchParallelData({
    event: () => getEventById(eventId),
    registeredEvents: () => getContactEvents(contactId),
    programs: isAdmin ? () => getActivePrograms() : null,
  });
  
  if (!event) {
    notFound();
  }
  
  // Check if user is registered for this event
  const isRegistered = registeredEvents.some(e => e.id === eventId);
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <a 
          href="/dashboard/events" 
          className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to events
        </a>
        
        {isAdmin && (
          <div className="flex space-x-2">
            <EditEventButton event={event} programs={programs || []} />
            <DeleteEventButton eventId={event.id} eventName={event.name} />
          </div>
        )}
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-4">
                <h1 className="text-3xl font-bold">{event.name}</h1>
                
                {event.programName && (
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">
                      Program: <span className="font-medium">{event.programName}</span>
                    </span>
                    {event.cohortName && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          Cohort: <span className="font-medium">{event.cohortName}</span>
                        </span>
                      </>
                    )}
                  </div>
                )}
                
                <div className="flex items-center text-muted-foreground">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  <span>{event.startDateFormatted}</span>
                </div>
                
                <div className="flex items-center text-muted-foreground">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  <span>{event.startTimeFormatted}{event.endTimeFormatted ? ` - ${event.endTimeFormatted}` : ''}</span>
                </div>
                
                {event.location && (
                  <div className="flex items-center text-muted-foreground">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    <span>{event.location}</span>
                  </div>
                )}
                
                {event.capacity && (
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-5 w-5 mr-2" />
                    <span>{event.registrationCount} / {event.capacity} registered</span>
                  </div>
                )}
                
                {event.description && (
                  <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-2">Description</h2>
                    <div className="prose dark:prose-invert max-w-none">
                      {event.description.split('\n').map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Registration</h2>
              
              {event.isPast ? (
                <div className="mb-4 text-muted-foreground">
                  This event has already taken place.
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-sm">
                      Status: <span className={`font-semibold ${event.isRegistrationOpen ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {event.isRegistrationOpen ? 'Registration Open' : 'Registration Closed'}
                      </span>
                    </p>
                    
                    {event.capacity && (
                      <p className="text-sm mt-1">
                        Capacity: {event.registrationCount} / {event.capacity} registered
                      </p>
                    )}
                  </div>
                  
                  <Suspense fallback={<Button disabled className="w-full">Loading...</Button>}>
                    <EventRegistrationButton 
                      event={event}
                      isRegistered={isRegistered}
                    />
                  </Suspense>
                </>
              )}
              
              {isRegistered && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md text-sm">
                  You're registered for this event. Check your email for details.
                </div>
              )}
              
              {event.type && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    Event type: {event.type}
                  </p>
                </div>
              )}
              
              {isAdmin && (
                <Button 
                  variant="outline"
                  className="w-full mt-4"
                  asChild
                >
                  <a href={`/dashboard/events/attendance/${event.id}`}>
                    Manage Attendance
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}