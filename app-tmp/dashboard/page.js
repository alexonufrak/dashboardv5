import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/app-router-auth'
import DashboardClient from './components/DashboardClient'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Dashboard | xFoundry',
  description: 'xFoundry Dashboard - Manage your programs, teams, and milestones',
}

// Loading state for the dashboard
function DashboardLoading() {
  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="mt-6 space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  )
}

/**
 * Dashboard Page - Server Component with Client-Side Dashboard
 * 
 * Uses the App Router pattern but maximizes reuse of existing components
 * by wrapping them in a client component
 */
export default async function Dashboard() {
  // Auth check and redirect
  const user = await getCurrentUser();
  if (!user) {
    // This should be handled by middleware, but as a fallback
    redirect('/auth/login?returnTo=/dashboard');
  }
  
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardClient user={user} />
    </Suspense>
  )
}