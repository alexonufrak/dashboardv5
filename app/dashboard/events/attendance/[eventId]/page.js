import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/app-router-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, UserCheck, Clock } from 'lucide-react';
import { 
  getCurrentUserContact,
  getEventById,
  getEventAttendees,
  fetchParallelData
} from '@/lib/app-router';
import AttendanceControls from '../../components/AttendanceControls';
import CheckInButton from '../../components/CheckInButton';
import ManualRegistrationForm from '../../components/ManualRegistrationForm';

/**
 * Event Attendance Page - Server Component
 * Shows attendance tracking for a specific event
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
    title: `${event.name} Attendance | xFoundry Dashboard`,
    description: 'Manage event attendance and check-ins.'
  };
}

export default async function EventAttendancePage({ params }) {
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
  
  // Fetch event data and attendees in parallel
  const { event, attendees } = await fetchParallelData({
    event: () => getEventById(eventId),
    attendees: () => getEventAttendees(eventId),
  });
  
  if (!event) {
    notFound();
  }
  
  // Format check-in time for display
  const formatCheckInTime = (isoString) => {
    if (!isoString) return '';
    
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <a 
          href={`/dashboard/events/${eventId}`} 
          className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to event details
        </a>
      </div>
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <p className="text-muted-foreground">
            {event.startDateFormatted} • {event.startTimeFormatted}
            {event.endTimeFormatted ? ` - ${event.endTimeFormatted}` : ''}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <div className="flex space-x-2">
            <AttendanceControls event={event} />
            <Button 
              variant="outline"
              size="sm"
              asChild
            >
              <a href={`/dashboard/events/attendance/${event.id}/qr`} className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <rect width="6" height="6" x="3" y="3" rx="1" />
                  <rect width="6" height="6" x="15" y="3" rx="1" />
                  <rect width="6" height="6" x="3" y="15" rx="1" />
                  <path d="M15 15h.01" />
                  <path d="M21 15h.01" />
                  <path d="M21 21h.01" />
                  <path d="M15 21h.01" />
                  <path d="M21 3v.01" />
                </svg>
                QR Code
              </a>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Registered Attendees</CardTitle>
              <CardDescription>
                {attendees.length} registered
                {event.checkedInCount > 0 && ` • ${event.checkedInCount} checked in`}
                {event.capacity > 0 && ` • ${event.capacity - event.registrationCount} spots remaining`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendees.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <p className="text-muted-foreground mb-2">No registered attendees yet.</p>
                  <p className="text-sm text-muted-foreground">Use the form on the right to manually register attendees.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <Input 
                      type="text" 
                      placeholder="Search attendees..." 
                      className="max-w-sm"
                    />
                  </div>
                  
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Institution</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendees.map((attendee) => (
                          <TableRow key={attendee.contactId}>
                            <TableCell className="font-medium">{attendee.fullName}</TableCell>
                            <TableCell>{attendee.email}</TableCell>
                            <TableCell>{attendee.institutionName || '-'}</TableCell>
                            <TableCell>
                              {attendee.checkedIn ? (
                                <Badge variant="success" className="flex items-center bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Checked In
                                  {attendee.checkInTime && (
                                    <span className="ml-1 text-xs">
                                      • <Clock className="h-3 w-3 inline mx-1" />
                                      {formatCheckInTime(attendee.checkInTime)}
                                    </span>
                                  )}
                                </Badge>
                              ) : (
                                <Badge variant="outline">Registered</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {!attendee.checkedIn && event.attendanceOpen && (
                                <CheckInButton 
                                  eventId={event.id} 
                                  contactId={attendee.contactId} 
                                  name={attendee.fullName}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Manual Registration</CardTitle>
              <CardDescription>Register an attendee who hasn't pre-registered</CardDescription>
            </CardHeader>
            <CardContent>
              <ManualRegistrationForm eventId={event.id} />
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Registered:</span>
                  <span className="font-medium">{event.registrationCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Checked In:</span>
                  <span className="font-medium">{event.checkedInCount}</span>
                </div>
                {event.capacity > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Capacity:</span>
                    <span className="font-medium">{event.capacity}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm">Attendance Rate:</span>
                  <span className="font-medium">
                    {event.registrationCount > 0 
                      ? `${Math.round((event.checkedInCount / event.registrationCount) * 100)}%` 
                      : '0%'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}