import { getEvent } from '@/app/lib/events';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { notFound } from 'next/navigation';
import EventActionsClient from '../components/EventActionsClient';

// Generate metadata for the page
export async function generateMetadata({ params }) {
  const event = await getEvent(params.eventId);
  
  if (!event) {
    return {
      title: 'Event Not Found',
    };
  }
  
  return {
    title: event.name,
    description: event.description || 'Event details',
  };
}

export default async function EventPage({ params }) {
  const event = await getEvent(params.eventId);
  
  if (!event) {
    notFound();
  }
  
  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">{event.name}</CardTitle>
              <CardDescription>
                {formatDate(event.date)}
                {event.time && ` • ${event.time}`}
              </CardDescription>
            </div>
            <EventActionsClient event={event} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium mb-2">Description</h3>
              <div className="prose max-w-none dark:prose-invert">
                {event.description ? (
                  <p className="text-muted-foreground">{event.description}</p>
                ) : (
                  <p className="text-muted-foreground italic">No description provided</p>
                )}
              </div>
              
              {event.programId && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Program</h3>
                  <p className="text-muted-foreground">{event.programName || event.programId}</p>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Details</h3>
              <dl className="space-y-2">
                {event.location && (
                  <>
                    <dt className="text-sm font-medium">Location:</dt>
                    <dd className="text-sm text-muted-foreground">{event.location}</dd>
                  </>
                )}
                
                <dt className="text-sm font-medium">Date:</dt>
                <dd className="text-sm text-muted-foreground">{formatDate(event.date)}</dd>
                
                {event.time && (
                  <>
                    <dt className="text-sm font-medium">Time:</dt>
                    <dd className="text-sm text-muted-foreground">{event.time}</dd>
                  </>
                )}
                
                {event.organizer && (
                  <>
                    <dt className="text-sm font-medium">Organizer:</dt>
                    <dd className="text-sm text-muted-foreground">{event.organizer}</dd>
                  </>
                )}
                
                {event.createdBy && (
                  <>
                    <dt className="text-sm font-medium">Created by:</dt>
                    <dd className="text-sm text-muted-foreground">{event.createdBy}</dd>
                  </>
                )}
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}