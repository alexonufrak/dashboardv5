import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/app-router-auth'
import { Skeleton } from '@/components/ui/skeleton'
import dynamic from 'next/dynamic'

// Use the existing program detail page with a loading state
const ProgramDashboard = dynamic(() => import('@/components/program/ProgramDashboard'), {
  loading: () => <ProgramLoading />
})

// Generate metadata for the program page
export async function generateMetadata({ params }) {
  return {
    title: `Program Dashboard | xFoundry`,
    description: 'View program details, milestones, and team information',
  }
}

// Loading state for the program page
function ProgramLoading() {
  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div>
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

/**
 * Program Detail Page - Server Component with Client Component Integration
 * 
 * Uses the App Router pattern but reuses the existing program dashboard component
 */
export default async function ProgramDetail({ params }) {
  // Auth check and redirect
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/auth/login?returnTo=/dashboard/program/${params.programId}`);
  }
  
  // Make sure we have a program ID
  if (!params.programId) {
    notFound();
  }
  
  // Render the program dashboard with the program ID
  return <ProgramDashboard programId={params.programId} />
}