import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/app-router-auth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  getProgramWithCohorts, 
  getProgramEvents,
  getCurrentUserContact,
  fetchParticipationByContactId,
  fetchParallelData
} from '@/lib/app-router';
import { ApplyButtonWrapper } from '../components/ApplyButtonWrapper';

/**
 * Program Detail Page - Server Component
 * Shows detailed information about a specific program
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  try {
    const program = await getProgramWithCohorts(params.programId);
    return {
      title: `${program.name} - xFoundry`,
      description: program.shortDescription || `Learn more about the ${program.name} program`,
    };
  } catch (error) {
    return {
      title: 'Program - xFoundry',
      description: 'Program details',
    };
  }
}

export default async function ProgramDetailPage({ params }) {
  const programId = params.programId;
  
  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    notFound();
  }
  
  try {
    // Get user's contact record
    const contact = await getCurrentUserContact(user);
    const contactId = contact?.id;
    
    // Fetch data in parallel
    const { program, events, participation } = await fetchParallelData({
      program: () => getProgramWithCohorts(programId),
      events: () => getProgramEvents(programId),
      participation: contactId ? () => fetchParticipationByContactId(contactId) : () => []
    });
    
    if (!program) {
      notFound();
    }
    
    // Check if user is enrolled in this program
    const isEnrolled = participation.some(record => {
      const participationProgramId = record.fields['Program (from Cohort)']?.[0];
      return participationProgramId === programId;
    });
    
    // Get active cohorts
    const activeCohorts = program.cohorts?.filter(cohort => 
      cohort.isActive && cohort.status === 'Active'
    ) || [];
    
    const hasActiveApplications = activeCohorts.length > 0;
    
    return (
      <div className="container mx-auto py-6 px-4">
        {/* Program Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              {program.logo && (
                <div className="w-16 h-16 rounded overflow-hidden bg-white shadow">
                  <img
                    src={program.logo}
                    alt={program.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold">{program.name}</h1>
                {isEnrolled && (
                  <Badge className="mt-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                    Enrolled
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              {isEnrolled ? (
                <Button>Dashboard</Button>
              ) : hasActiveApplications ? (
                <ApplyButtonWrapper 
                  programId={programId} 
                  cohorts={activeCohorts} 
                />
              ) : (
                <Button disabled variant="outline">Applications Closed</Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Program Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading program details...</div>}>
              <ProgramOverviewSection program={program} />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="cohorts" className="space-y-6">
            <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading cohorts...</div>}>
              <ProgramCohortsSection program={program} />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="events" className="space-y-6">
            <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading events...</div>}>
              <ProgramEventsSection events={events} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error('Error loading program:', error);
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
          <h2 className="text-red-800 dark:text-red-300 text-lg font-medium mb-2">Error Loading Program</h2>
          <p className="text-red-700 dark:text-red-200">{error.message || 'An unexpected error occurred'}</p>
        </div>
      </div>
    );
  }
}

// Program Overview Section
function ProgramOverviewSection({ program }) {
  return (
    <div className="space-y-8">
      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>About This Program</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none">
            <p className="whitespace-pre-line">{program.description || "No description available for this program."}</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Key Information */}
      <Card>
        <CardHeader>
          <CardTitle>Key Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {program.startDate && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Start Date</h3>
                <p>{formatDate(program.startDate)}</p>
              </div>
            )}
            
            {program.endDate && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">End Date</h3>
                <p>{formatDate(program.endDate)}</p>
              </div>
            )}
            
            {program.contactEmail && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Contact Email</h3>
                <p>{program.contactEmail}</p>
              </div>
            )}
            
            {program.website && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Website</h3>
                <a 
                  href={program.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {program.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Program Cohorts Section
function ProgramCohortsSection({ program }) {
  const { cohorts } = program;
  
  if (!cohorts || cohorts.length === 0) {
    return (
      <div className="p-6 border rounded-md border-dashed border-gray-300 dark:border-gray-700 text-center">
        <p className="text-muted-foreground">No cohorts are currently available for this program.</p>
      </div>
    );
  }
  
  // Get active cohorts
  const activeCohorts = cohorts.filter(cohort => 
    cohort.status === 'Active'
  );
  
  // Get past cohorts
  const pastCohorts = cohorts.filter(cohort => 
    cohort.status === 'Completed'
  );
  
  return (
    <div className="space-y-8">
      {/* Active Cohorts */}
      {activeCohorts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Cohorts</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeCohorts.map(cohort => (
              <CohortCard key={cohort.id} cohort={cohort} isActive={true} />
            ))}
          </div>
        </div>
      )}
      
      {/* Past Cohorts */}
      {pastCohorts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Past Cohorts</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pastCohorts.map(cohort => (
              <CohortCard key={cohort.id} cohort={cohort} isActive={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Cohort Card
function CohortCard({ cohort, isActive }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{cohort.name}</CardTitle>
          <Badge variant={isActive ? "default" : "secondary"}>
            {cohort.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {cohort.description || "No description available."}
        </p>
        
        <div className="space-y-2 text-sm">
          {cohort.startDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Date:</span>
              <span>{formatDate(cohort.startDate)}</span>
            </div>
          )}
          
          {cohort.endDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">End Date:</span>
              <span>{formatDate(cohort.endDate)}</span>
            </div>
          )}
          
          {isActive && cohort.applicationDeadline && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Application Deadline:</span>
              <span>{formatDate(cohort.applicationDeadline)}</span>
            </div>
          )}
        </div>
        
        {isActive && (
          <ApplyButtonWrapper programId={cohort.program} cohorts={[cohort]} buttonText="Apply" className="w-full mt-4" />
        )}
      </CardContent>
    </Card>
  );
}

// Program Events Section
function ProgramEventsSection({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="p-6 border rounded-md border-dashed border-gray-300 dark:border-gray-700 text-center">
        <p className="text-muted-foreground">No upcoming events scheduled for this program.</p>
      </div>
    );
  }
  
  // Sort events by date (closest first)
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.startDate || a.fields['Start Date']);
    const dateB = new Date(b.startDate || b.fields['Start Date']);
    return dateA - dateB;
  });
  
  return (
    <div className="space-y-4">
      {sortedEvents.map(event => (
        <Card key={event.id} className="overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Left side: Event info */}
            <div className="flex-grow p-6">
              <h3 className="text-xl font-semibold mb-2">{event.name || event.fields.Name}</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-medium">{event.startDateFormatted || formatDate(event.fields['Start Date'])}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.startTimeFormatted || formatTime(event.fields['Start Date'])} - {event.endTimeFormatted || formatTime(event.fields['End Date'])}
                    </p>
                  </div>
                </div>
                
                {(event.location || event.fields.Location) && (
                  <div className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{event.location || event.fields.Location}</span>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                {event.description || event.fields.Description || "No description available."}
              </p>
              
              {(event.registrationUrl || event.fields['Registration URL']) && (
                <Button asChild>
                  <a 
                    href={event.registrationUrl || event.fields['Registration URL']} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Register
                  </a>
                </Button>
              )}
            </div>
            
            {/* Right side: Event image */}
            {(event.imageUrl || event.fields.Image?.[0]?.url) && (
              <div className="md:w-1/3 h-48 md:h-auto bg-gray-100 dark:bg-gray-800">
                <img 
                  src={event.imageUrl || event.fields.Image[0].url} 
                  alt={event.name || event.fields.Name} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

// Helper function to format dates
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Helper function to format times
function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}