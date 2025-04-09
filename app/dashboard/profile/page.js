import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/app-router-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  getCurrentUserContact,
  fetchEducationByContactId,
  fetchInstitutionById,
  fetchParallelData
} from '@/lib/app-router';
import { ProfileDialogButton } from '@/components/profile/ProfileDialogButton.jsx';

/**
 * Profile Page - Server Component
 * Shows the user's profile information
 * Uses parallel data fetching to avoid request waterfalls
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const user = await getCurrentUser();
  if (!user) {
    return {
      title: 'Profile - xFoundry',
    };
  }
  
  return {
    title: `${user.name || 'Profile'} - xFoundry`,
    description: 'Your user profile and account information',
  };
}

export default async function ProfilePage() {
  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }
  
  try {
    // Get user's contact record
    const contact = await getCurrentUserContact(user);
    if (!contact) {
      console.error(`No contact record found for user ${user.email}`);
      return (
        <div className="container mx-auto py-6 px-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
            <h2 className="text-yellow-800 dark:text-yellow-300 text-lg font-medium mb-2">Profile Not Found</h2>
            <p className="text-yellow-700 dark:text-yellow-200">
              We couldn't find your profile information. Please contact support.
            </p>
          </div>
        </div>
      );
    }
    
    const contactId = contact.id;
    
    // Fetch additional data in parallel
    const { educationRecords, teams, participation } = await fetchParallelData({
      educationRecords: () => fetchEducationByContactId(contactId),
      teams: () => [], // TODO: Implement when adding teams section
      participation: () => [] // TODO: Implement when adding participation section
    });
    
    // Get institution details for primary education if available
    let institution = null;
    const primaryEducation = educationRecords && educationRecords.length > 0 ? educationRecords[0] : null;
    
    if (primaryEducation?.fields?.Institution?.[0]) {
      try {
        institution = await fetchInstitutionById(primaryEducation.fields.Institution[0]);
      } catch (error) {
        console.error("Error fetching institution:", error);
      }
    }
    
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <ProfileDialogButton userId={contactId} />
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          {/* Personal Information */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading profile data...</div>}>
                <ProfileSection contact={contact} />
              </Suspense>
            </CardContent>
          </Card>
          
          {/* Profile Image */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Image</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 mb-4">
                {contact.fields.Headshot && contact.fields.Headshot[0] ? (
                  <img 
                    src={contact.fields.Headshot[0].url} 
                    alt={contact.fields['Full Name'] || 'Profile picture'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Education Information */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Education</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading education data...</div>}>
                <EducationSection education={primaryEducation} institution={institution} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading profile:', error);
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
          <h2 className="text-red-800 dark:text-red-300 text-lg font-medium mb-2">Error Loading Profile</h2>
          <p className="text-red-700 dark:text-red-200">{error.message || 'An unexpected error occurred'}</p>
        </div>
      </div>
    );
  }
}

// Server component for profile section
function ProfileSection({ contact }) {
  if (!contact) {
    return (
      <div className="p-4 border rounded-md border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-muted-foreground">Profile information not available. Please complete your profile setup.</p>
      </div>
    );
  }
  
  const { fields } = contact;
  
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="font-medium text-sm text-muted-foreground mb-1">Name</h3>
        <p>{fields['Full Name'] || `${fields['First Name'] || ''} ${fields['Last Name'] || ''}`.trim()}</p>
      </div>
      
      <div>
        <h3 className="font-medium text-sm text-muted-foreground mb-1">Email</h3>
        <p>{fields['Email'] || 'Not provided'}</p>
      </div>
      
      {fields['Phone'] && (
        <div>
          <h3 className="font-medium text-sm text-muted-foreground mb-1">Phone</h3>
          <p>{fields['Phone']}</p>
        </div>
      )}
      
      {fields['LinkedIn'] && (
        <div>
          <h3 className="font-medium text-sm text-muted-foreground mb-1">LinkedIn</h3>
          <a href={fields['LinkedIn']} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            View Profile
          </a>
        </div>
      )}
      
      {fields['Website URL'] && (
        <div>
          <h3 className="font-medium text-sm text-muted-foreground mb-1">Website</h3>
          <a href={fields['Website URL']} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {fields['Website URL'].replace(/^https?:\/\//, '')}
          </a>
        </div>
      )}
      
      {fields['Bio'] && (
        <div className="md:col-span-2">
          <h3 className="font-medium text-sm text-muted-foreground mb-1">Bio</h3>
          <p className="whitespace-pre-line">{fields['Bio']}</p>
        </div>
      )}
      
      {fields['Expertise'] && fields['Expertise'].length > 0 && (
        <div className="md:col-span-2">
          <h3 className="font-medium text-sm text-muted-foreground mb-1">Expertise</h3>
          <div className="flex flex-wrap gap-2 mt-1">
            {fields['Expertise'].map(skill => (
              <span key={skill} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Server component for education section
function EducationSection({ education, institution }) {
  if (!education) {
    return (
      <div className="p-4 border rounded-md border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-muted-foreground">Education information not available. Please complete your profile setup.</p>
      </div>
    );
  }
  
  const { fields } = education;
  const institutionName = institution?.fields?.Name || 'Unknown Institution';
  
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div>
        <h3 className="font-medium text-sm text-muted-foreground mb-1">Institution</h3>
        <p>{institutionName}</p>
      </div>
      
      <div>
        <h3 className="font-medium text-sm text-muted-foreground mb-1">Degree Type</h3>
        <p>{fields['Degree Type'] || 'Not specified'}</p>
      </div>
      
      <div>
        <h3 className="font-medium text-sm text-muted-foreground mb-1">Graduation</h3>
        <p>
          {fields['Graduation Semester'] || ''} {fields['Graduation Year'] || 'Not specified'}
        </p>
      </div>
      
      {fields['Major'] && fields['Major'].length > 0 && (
        <div>
          <h3 className="font-medium text-sm text-muted-foreground mb-1">Major</h3>
          <p>{fields['Major'].join(', ') || 'Not specified'}</p>
        </div>
      )}
      
      {fields['Minor'] && fields['Minor'].length > 0 && (
        <div>
          <h3 className="font-medium text-sm text-muted-foreground mb-1">Minor</h3>
          <p>{fields['Minor'].join(', ')}</p>
        </div>
      )}
    </div>
  );
}