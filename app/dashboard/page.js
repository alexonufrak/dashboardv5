import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/app-router-auth';
import { DashboardClientWrapper } from './components/DashboardClientWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Dashboard Page - Server Component
 * Main dashboard page showing user's programs, teams, and upcoming events
 */
export const dynamic = 'force-dynamic';
export default async function DashboardPage() {
  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }
  
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
              <ProgramsSection userId={user.sub} />
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
              <TeamsSection userId={user.sub} />
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
              <EventsSection />
            </Suspense>
          </CardContent>
        </Card>
      </div>
      
      {/* Client component wrapper for interactive elements */}
      <DashboardClientWrapper userId={user.sub} />
    </div>
  );
}

// Placeholder server components - these would typically be in separate files
// and would fetch data from your Airtable API

async function ProgramsSection({ userId }) {
  // This would be a real data fetch in production
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">You're not currently enrolled in any programs.</p>
    </div>
  );
}

async function TeamsSection({ userId }) {
  // This would be a real data fetch in production
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">You're not currently a member of any teams.</p>
    </div>
  );
}

async function EventsSection() {
  // This would be a real data fetch in production
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">No upcoming events scheduled.</p>
    </div>
  );
}