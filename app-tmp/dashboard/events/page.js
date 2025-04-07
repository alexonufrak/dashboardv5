import { getAllEvents } from '@/app/lib/events';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { CalendarPlus } from 'lucide-react';
import Link from 'next/link';
import CreateEventForm from './components/CreateEventForm';

export const metadata = {
  title: 'Events | xFoundry Dashboard',
  description: 'View and manage all events',
};

export default async function EventsPage() {
  const events = await getAllEvents();
  
  const upcomingEvents = events.filter(event => new Date(event.date) >= new Date());
  const pastEvents = events.filter(event => new Date(event.date) < new Date());
  
  // Sort events by date
  upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
  pastEvents.sort((a, b) => new Date(b.date) - new Date(a.date)); // Reverse sort for past events
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground mt-1">View and manage program events</p>
        </div>
        
        <CreateEventForm>
          <Button>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </CreateEventForm>
      </div>
      
      <div className="space-y-8">
        {/* Upcoming Events Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
          {upcomingEvents.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center py-8">
                  No upcoming events scheduled.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
        
        {/* Past Events Section */}
        {pastEvents.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Past Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastEvents.map(event => (
                <EventCard key={event.id} event={event} isPast />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function EventCard({ event, isPast = false }) {
  return (
    <Card className={isPast ? 'opacity-75' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          <Link href={`/dashboard/events/${event.id}`} className="hover:underline">
            {event.name}
          </Link>
        </CardTitle>
        <CardDescription>
          {formatDate(event.date)}
          {event.time && ` • ${event.time}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {event.description ? (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No description provided
          </p>
        )}
        
        {event.location && (
          <p className="text-xs text-muted-foreground mt-2">
            Location: {event.location}
          </p>
        )}
        
        {event.programName && (
          <p className="text-xs text-muted-foreground mt-1">
            Program: {event.programName}
          </p>
        )}
      </CardContent>
    </Card>
  );
}