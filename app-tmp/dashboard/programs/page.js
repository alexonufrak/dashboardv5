import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/app-router-auth'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import dynamic from 'next/dynamic'

// Use the existing programs page but with a loading state
const ProgramsPage = dynamic(() => import('@/pages/dashboard/programs/index'), {
  loading: () => <ProgramsLoading />
})

export const metadata = {
  title: 'Programs | xFoundry',
  description: 'Browse and join available programs on the xFoundry platform',
}

// Loading state for the programs page
function ProgramsLoading() {
  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Skeleton className="h-8 w-36 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

/**
 * Programs Page - Server Component with Client-Side Programs
 * 
 * Uses the App Router pattern but reuses the existing programs page component
 */
export default async function Programs() {
  // Auth check and redirect
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login?returnTo=/dashboard/programs');
  }
  
  return <ProgramsPage />
}