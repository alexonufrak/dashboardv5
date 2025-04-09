import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/app-router-auth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  getTeamWithMembers,
  getCurrentUserContact,
  getTeamSubmissions,
  fetchParallelData
} from '@/lib/app-router';

/**
 * Team Detail Page - Server Component
 * Shows detailed information about a specific team
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  try {
    const team = await getTeamWithMembers(params.teamId);
    return {
      title: `${team.name} - Teams - xFoundry`,
      description: team.description || `Learn more about the ${team.name} team`,
    };
  } catch (error) {
    return {
      title: 'Team - xFoundry',
      description: 'Team details',
    };
  }
}

export default async function TeamDetailPage({ params }) {
  const teamId = params.teamId;
  
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
    const { team, submissions } = await fetchParallelData({
      team: () => getTeamWithMembers(teamId),
      submissions: () => getTeamSubmissions(teamId)
    });
    
    if (!team) {
      notFound();
    }
    
    // Check if user is a member of this team
    const isMember = contactId && team.members?.some(member => 
      member.contact === contactId
    );
    
    // Get user's role in the team
    const userRole = isMember && 
      team.members?.find(member => member.contact === contactId)?.role || 'Visitor';
    
    // Check if user is a team admin
    const isAdmin = userRole === 'Owner' || userRole === 'Admin';
    
    return (
      <div className="container mx-auto py-6 px-4">
        {/* Team Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              {team.logo ? (
                <div className="w-16 h-16 rounded overflow-hidden bg-white shadow">
                  <img
                    src={team.logo}
                    alt={team.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded bg-primary flex items-center justify-center text-white">
                  <span className="text-xl font-bold">{team.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold">{team.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                    {team.cohortName || 'Unknown Cohort'}
                  </Badge>
                  {isMember && (
                    <Badge variant="outline">
                      {userRole}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              {isMember ? (
                <TeamMemberActions team={team} isAdmin={isAdmin} />
              ) : (
                <JoinTeamButton team={team} contactId={contactId} />
              )}
            </div>
          </div>
        </div>
        
        {/* Team Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            {(isMember || submissions.length > 0) && (
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading team details...</div>}>
              <TeamOverviewSection team={team} />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="members" className="space-y-6">
            <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading team members...</div>}>
              <TeamMembersSection team={team} currentUserRole={userRole} />
            </Suspense>
          </TabsContent>
          
          {(isMember || submissions.length > 0) && (
            <TabsContent value="submissions" className="space-y-6">
              <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading submissions...</div>}>
                <TeamSubmissionsSection submissions={submissions} />
              </Suspense>
            </TabsContent>
          )}
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error('Error loading team:', error);
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
          <h2 className="text-red-800 dark:text-red-300 text-lg font-medium mb-2">Error Loading Team</h2>
          <p className="text-red-700 dark:text-red-200">{error.message || 'An unexpected error occurred'}</p>
        </div>
      </div>
    );
  }
}

// Placeholder for client components
function TeamMemberActions({ team, isAdmin }) {
  return (
    <div className="flex gap-3">
      {isAdmin && (
        <Button variant="outline">Edit Team</Button>
      )}
      <Button variant="destructive">Leave Team</Button>
    </div>
  );
}

function JoinTeamButton({ team, contactId }) {
  return (
    <Button>Request to Join</Button>
  );
}

// Server component for team overview
function TeamOverviewSection({ team }) {
  return (
    <div className="space-y-8">
      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>About This Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none">
            <p className="whitespace-pre-line">{team.description || "No description available for this team."}</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Key Information */}
      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Program</h3>
              <p>{team.programName || 'Not specified'}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Cohort</h3>
              <p>{team.cohortName || 'Not specified'}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Status</h3>
              <p>{team.status || 'Not specified'}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Created</h3>
              <p>{formatDate(team.createdTime) || 'Not specified'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Server component for team members
function TeamMembersSection({ team, currentUserRole }) {
  const members = team.members || [];
  
  if (!members || members.length === 0) {
    return (
      <div className="p-6 border rounded-md border-dashed border-gray-300 dark:border-gray-700 text-center">
        <p className="text-muted-foreground">This team currently has no members.</p>
      </div>
    );
  }
  
  // Sort members by role (Owner first, then Admin, then Members)
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { 'Owner': 0, 'Admin': 1, 'Member': 2 };
    return (roleOrder[a.role] || 3) - (roleOrder[b.role] || 3);
  });
  
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedMembers.map(member => (
          <Card key={member.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={null} />
                  <AvatarFallback className="bg-primary text-white">
                    {member.contactName?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{member.contactName || 'Unknown Member'}</h3>
                      <Badge className="mt-1" variant={
                        member.role === 'Owner' ? 'default' : 
                        member.role === 'Admin' ? 'secondary' : 'outline'
                      }>
                        {member.role}
                      </Badge>
                    </div>
                    
                    {/* Show member actions for admin users */}
                    {(currentUserRole === 'Owner' || currentUserRole === 'Admin') && (
                      currentUserRole === 'Owner' || member.role !== 'Owner' ? (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                          <span>...</span>
                        </Button>
                      ) : null
                    )}
                  </div>
                  
                  {member.joinedDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Joined {formatDate(member.joinedDate)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Invite Members Button */}
      {(currentUserRole === 'Owner' || currentUserRole === 'Admin') && (
        <div className="flex justify-center mt-6">
          <Button variant="outline">Invite Members</Button>
        </div>
      )}
    </div>
  );
}

// Server component for team submissions
function TeamSubmissionsSection({ submissions }) {
  if (!submissions || submissions.length === 0) {
    return (
      <div className="p-6 border rounded-md border-dashed border-gray-300 dark:border-gray-700 text-center">
        <p className="text-muted-foreground">No submissions found for this team.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {submissions.map(submission => (
        <Card key={submission.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{submission.title || 'Untitled Submission'}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {submission.milestoneName || 'Unknown Milestone'} • 
                  {formatDate(submission.submittedDate)}
                </p>
              </div>
              <Badge variant={submission.status === 'Approved' ? 'default' : 'secondary'}>
                {submission.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">
              {submission.description || 'No description provided.'}
            </p>
            
            {submission.files && submission.files.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Attachments:</h4>
                <div className="space-y-1">
                  {submission.files.map((file, index) => (
                    <div key={index} className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <a 
                        href={file.url} 
                        className="text-sm text-blue-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {file.filename || `File ${index + 1}`}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
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