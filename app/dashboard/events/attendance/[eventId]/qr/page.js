import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/app-router-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { 
  getCurrentUserContact,
  getEventById
} from '@/lib/app-router';
import QRCodeDisplay from '../../../components/QRCodeDisplay';

/**
 * Event QR Code Page - Server Component
 * Shows a QR code for attendees to scan for easy check-in
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
    title: `${event.name} Check-In QR | xFoundry Dashboard`,
    description: 'QR code for attendee check-in.'
  };
}

export default async function EventQRCodePage({ params }) {
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
  
  // Check if user is an admin or event staff
  const isStaff = user.email?.endsWith('@xfoundry.org') || false;
  if (!isStaff) {
    redirect('/dashboard/events');
  }
  
  // Fetch event data
  const event = await getEventById(eventId);
  
  if (!event) {
    notFound();
  }
  
  // Generate QR code data - this would be a URL to a check-in form or API
  const qrData = `https://xfoundry.org/events/checkin/${eventId}`;
  
  return (
    <div className="container mx-auto p-4 flex flex-col items-center">
      <div className="w-full mb-6">
        <a 
          href={`/dashboard/events/attendance/${eventId}`} 
          className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to attendance
        </a>
      </div>
      
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">{event.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <p className="mb-6 text-center text-muted-foreground">
            Attendees can scan this QR code to check in to the event
          </p>
          
          <div className="mb-6">
            <QRCodeDisplay value={qrData} size={250} />
          </div>
          
          <div className="text-center">
            <p className="text-sm mb-2 font-semibold">{event.startDateFormatted}</p>
            <p className="text-sm text-muted-foreground">
              {event.startTimeFormatted} 
              {event.endTimeFormatted ? ` - ${event.endTimeFormatted}` : ''}
            </p>
            {event.location && (
              <p className="text-sm text-muted-foreground mt-1">{event.location}</p>
            )}
          </div>
          
          <Button 
            variant="outline"
            className="mt-8"
            asChild
          >
            <a href={`/dashboard/events/attendance/${eventId}`}>
              Return to Attendance Management
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}