import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/app-router-auth';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  getCurrentUserContact,
  getActivePrograms,
  fetchParticipationByContactId,
  fetchParallelData 
} from '@/lib/app-router';

/**
 * Programs Listing Page - Server Component
 * Shows available programs and user's enrolled programs
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'Programs - xFoundry',
    description: 'Browse available programs and view your enrolled programs',
  };
}

export default async function ProgramsPage() {
  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }
  
  try {
    // Get user's contact record
    const contact = await getCurrentUserContact(user);
    const contactId = contact?.id;
    
    // Fetch data in parallel
    const { programs, participation } = await fetchParallelData({
      programs: () => getActivePrograms(),
      participation: contactId ? () => fetchParticipationByContactId(contactId) : () => []
    });
    
    // Determine which programs the user is enrolled in
    const enrolledProgramIds = new Set();
    
    if (participation && participation.length > 0) {
      participation.forEach(record => {
        if (record.fields.Cohort && record.fields.Cohort[0]) {
          // This is getting the program ID through cohort - in a real system we would
          // either have a direct relation or a more optimized query
          const programId = record.fields['Program (from Cohort)']?.[0];
          if (programId) {
            enrolledProgramIds.add(programId);
          }
        }
      });
    }
    
    return (
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Programs</h1>
        
        {/* My Enrolled Programs */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">My Programs</h2>
          <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading your programs...</div>}>
            <EnrolledProgramsSection programs={programs} enrolledProgramIds={enrolledProgramIds} />
          </Suspense>
        </section>
        
        {/* Available Programs */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Available Programs</h2>
          <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading available programs...</div>}>
            <AvailableProgramsSection programs={programs} enrolledProgramIds={enrolledProgramIds} />
          </Suspense>
        </section>
      </div>
    );
  } catch (error) {
    console.error('Error loading programs:', error);
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
          <h2 className="text-red-800 dark:text-red-300 text-lg font-medium mb-2">Error Loading Programs</h2>
          <p className="text-red-700 dark:text-red-200">{error.message || 'An unexpected error occurred'}</p>
        </div>
      </div>
    );
  }
}

// Server component for user's enrolled programs
function EnrolledProgramsSection({ programs, enrolledProgramIds }) {
  // Filter programs to only those user is enrolled in
  const enrolledPrograms = programs.filter(program => enrolledProgramIds.has(program.id));
  
  if (enrolledPrograms.length === 0) {
    return (
      <div className="p-6 border rounded-md border-dashed border-gray-300 dark:border-gray-700 text-center">
        <p className="text-muted-foreground mb-2">You are not currently enrolled in any programs.</p>
        <p className="text-sm text-muted-foreground">
          Browse available programs below and apply to get started.
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {enrolledPrograms.map(program => (
        <ProgramCard 
          key={program.id}
          program={program}
          isEnrolled={true}
        />
      ))}
    </div>
  );
}

// Server component for available programs
function AvailableProgramsSection({ programs, enrolledProgramIds }) {
  // Filter programs to only those user is not enrolled in
  const availablePrograms = programs.filter(program => !enrolledProgramIds.has(program.id));
  
  if (availablePrograms.length === 0) {
    return (
      <div className="p-6 border rounded-md border-dashed border-gray-300 dark:border-gray-700 text-center">
        <p className="text-muted-foreground">
          There are no additional programs available at this time.
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {availablePrograms.map(program => (
        <ProgramCard 
          key={program.id}
          program={program}
          isEnrolled={false}
        />
      ))}
    </div>
  );
}

// Program card component
function ProgramCard({ program, isEnrolled }) {
  const activeCohorts = program.cohorts?.filter(cohort => 
    cohort.isActive && cohort.status === 'Active'
  ) || [];
  
  const hasActiveApplications = activeCohorts.length > 0;
  
  return (
    <Card className="overflow-hidden flex flex-col h-full">
      {/* Program Logo/Image */}
      <div 
        className="h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
        style={{
          backgroundColor: program.primaryColor || '#f3f4f6',
          color: getContrastColor(program.primaryColor || '#f3f4f6')
        }}
      >
        {program.logo ? (
          <img 
            src={program.logo} 
            alt={program.name} 
            className="h-24 w-auto object-contain"
          />
        ) : (
          <div className="text-2xl font-bold">{program.name}</div>
        )}
      </div>
      
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{program.name}</CardTitle>
          {isEnrolled && (
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800">
              Enrolled
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground mb-4">
          {program.shortDescription || program.description?.substring(0, 150) || 'No description available.'}
        </p>
        
        {activeCohorts.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Active Cohorts:</h4>
            <div className="space-y-1">
              {activeCohorts.map(cohort => (
                <div key={cohort.id} className="text-xs flex justify-between">
                  <span>{cohort.name}</span>
                  {cohort.applicationDeadline && (
                    <span className="text-muted-foreground">
                      Deadline: {formatDate(cohort.applicationDeadline)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t bg-gray-50 dark:bg-gray-900/50 pt-4">
        {isEnrolled ? (
          <Button asChild className="w-full">
            <Link href={`/dashboard/programs/${program.id}`}>
              View Program
            </Link>
          </Button>
        ) : hasActiveApplications ? (
          <Button asChild className="w-full">
            <Link href={`/dashboard/programs/${program.id}`}>
              Learn More
            </Link>
          </Button>
        ) : (
          <Button disabled variant="outline" className="w-full">
            Applications Closed
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Helper function to format dates
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Helper function to determine contrasting text color
function getContrastColor(hexColor) {
  // If no color or invalid, return black
  if (!hexColor || hexColor === '#') return '#000000';
  
  // Remove # if present
  hexColor = hexColor.replace('#', '');
  
  // Convert to RGB
  let r, g, b;
  if (hexColor.length === 3) {
    r = parseInt(hexColor.charAt(0) + hexColor.charAt(0), 16);
    g = parseInt(hexColor.charAt(1) + hexColor.charAt(1), 16);
    b = parseInt(hexColor.charAt(2) + hexColor.charAt(2), 16);
  } else {
    r = parseInt(hexColor.substring(0, 2), 16);
    g = parseInt(hexColor.substring(2, 4), 16);
    b = parseInt(hexColor.substring(4, 6), 16);
  }
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white depending on luminance
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}