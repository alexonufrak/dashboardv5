import { getUpcomingEvents } from '@/app/lib/events';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

/**
 * Server Component that displays a list of upcoming events
 */
export default async function UpcomingEvents() {
  // Fetch upcoming events (this happens on the server)
  const events = await getUpcomingEvents();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
        <CardDescription>Stay updated with upcoming events and deadlines</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4">No upcoming events found.</p>
        ) : (
          <ul className="space-y-4">
            {events.map((event) => (
              <li key={event.id} className="flex justify-between items-start border-b pb-3 last:border-0">
                <div>
                  <h3 className="font-medium">{event.name}</h3>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  {event.location && (
                    <p className="text-xs text-muted-foreground mt-1">Location: {event.location}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatDate(event.date)}</p>
                  {event.time && <p className="text-xs text-muted-foreground">{event.time}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Loading fallback UI when the server component is loading
 */
export function UpcomingEventsSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex justify-between items-start border-b pb-3 last:border-0">
              <div>
                <Skeleton className="h-5 w-56 mb-2" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-36 mt-2" />
              </div>
              <div className="text-right">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-16 mt-1" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}