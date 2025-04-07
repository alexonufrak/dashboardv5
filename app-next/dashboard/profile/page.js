import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getUserProfile } from '@/lib/app-router-auth';
import { ProfileDialogButton } from '@/components/profile/ProfileDialogButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Profile Page - Server Component
 * Displays and allows editing of user profile
 */
export default async function ProfilePage() {
  try {
    // Get user profile
    const profile = await getUserProfile();
    
    if (!profile) {
      notFound();
    }
    
    return (
      <div className="container max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        
        {/* Contact Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading contact information...</div>}>
              <ContactSection profile={profile} />
            </Suspense>
          </CardContent>
        </Card>
        
        {/* Education Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Education</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading education information...</div>}>
              <EducationSection contactId={profile.contactId} />
            </Suspense>
          </CardContent>
        </Card>
        
        {/* Edit Profile Button */}
        <div className="flex justify-end mt-6">
          <ProfileDialogButton userId={profile.contactId} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading profile:', error);
    return (
      <div className="container max-w-4xl">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
          <h2 className="text-red-800 dark:text-red-300 text-lg font-medium mb-2">Error Loading Profile</h2>
          <p className="text-red-700 dark:text-red-200">{error.message || 'An unexpected error occurred'}</p>
        </div>
      </div>
    );
  }
}

// Placeholder server components - these would typically be in separate files
// and would fetch data from your Airtable API

async function ContactSection({ profile }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-muted-foreground">Name</p>
        <p>{profile.firstName} {profile.lastName}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Email</p>
        <p>{profile.email}</p>
      </div>
    </div>
  );
}

async function EducationSection({ contactId }) {
  // This would be a real data fetch in production
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">No education information available.</p>
    </div>
  );
}