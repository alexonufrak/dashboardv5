import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import UserProfileData from '../../server-components/UserProfileData'
import ProfileDialogButton from './ProfileDialogButton'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { revalidatePath } from 'next/cache'

// Loading state component shown while the server component is fetching data
function LoadingProfile() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded-md" />
      <div className="h-32 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-md" />
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-md" />
      </div>
    </div>
  )
}

// Action to refresh the profile data
async function refreshProfileData() {
  'use server'
  revalidatePath('/dashboard/profile')
}

/**
 * Server Profile Page Component with Client Interactivity
 * Demonstrates the pattern of server components with client interaction points
 */
export default function ProfileServerPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form action={refreshProfileData}>
            <Button 
              variant="outline" 
              size="sm"
              title="Refresh profile data"
              type="submit"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </form>
          <ProfileDialogButton>
            Edit Profile
          </ProfileDialogButton>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Profile Data</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Server Component wrapped in Suspense */}
          <Suspense fallback={<LoadingProfile />}>
            <UserProfileData />
          </Suspense>
        </CardContent>
      </Card>
      
      <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4 mt-6">
        <h2 className="text-yellow-800 dark:text-yellow-300 font-medium mb-2">App Router Implementation</h2>
        <p className="text-sm text-yellow-700 dark:text-yellow-400">
          This page demonstrates the Next.js 14 App Router pattern with Server Components. 
          Profile data is fetched directly in a Server Component, while interactivity 
          is provided through Client Components that use Server Actions for form submission.
          This approach reduces client-side JavaScript and improves performance.
        </p>
      </div>
    </div>
  )
}