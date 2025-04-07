import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/app-router-auth'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import dynamic from 'next/dynamic'

// Use the existing profile page but with ssr enabled
const ProfilePage = dynamic(() => import('@/pages/dashboard/ProfilePage'), {
  loading: () => <ProfileLoading />
})

export const metadata = {
  title: 'Profile | xFoundry',
  description: 'Manage your xFoundry profile and account settings',
}

// Loading state for the profile page
function ProfileLoading() {
  return (
    <div className="container max-w-4xl mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Skeleton className="h-8 w-36 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  )
}

/**
 * Profile Page - Server Component with Client-Side Profile
 * 
 * Uses the App Router pattern but reuses the existing profile page component
 */
export default async function Profile() {
  // Auth check and redirect
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login?returnTo=/dashboard/profile');
  }
  
  return <ProfilePage />
}