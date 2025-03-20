"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useRouter } from "next/router"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import MainDashboardLayout from "@/components/layout/MainDashboardLayout"
import { useDashboard } from "@/contexts/DashboardContext"
import { navigateToDashboard, navigateToProgram, navigateToProfile, navigateToPrograms } from '@/lib/routing'

// Dynamically import the ProfilePage component with loading state
const ProfilePage = dynamic(() => import("@/pages/dashboard/ProfilePage"), {
  loading: () => <PageSkeleton />
})

// Page skeleton for loading state
function PageSkeleton() {
  return (
    <div className="space-y-4 pt-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-64 rounded-lg" />
        <div className="col-span-2">
          <Skeleton className="h-16 rounded-lg mb-4" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function Profile() {
  const router = useRouter()
  const { profile, isLoading, error, refreshData } = useDashboard()

  // Handle navigation between pages
  const handleNavigation = (page) => {
    console.log(`Navigation requested to page: ${page}`);
    
    // Extract program ID if this is a program-specific page
    let programId = null;
    if (page.startsWith('program-')) {
      programId = page.replace('program-', '');
      page = 'program'; // Set base page to program
    }
    
    // Navigate based on the page
    switch (page) {
      case "dashboard":
        navigateToDashboard(router, { shallow: true });
        break;
      case "profile":
        navigateToProfile(router, { shallow: true });
        break;
      case "programs":
        navigateToPrograms(router, { shallow: true });
        break;
      case "program":
        if (programId) {
          navigateToProgram(router, programId, { shallow: true });
        }
        break;
      default:
        navigateToDashboard(router, { shallow: true });
    }
  }

  // Use refreshData function for error retry
  const handleRetry = () => {
    if (refreshData) {
      refreshData('all');
    } else {
      window.location.reload();
    }
  };

  return (
    <MainDashboardLayout
      title="Your Profile"
      profile={profile}
      currentPage="profile"
      onNavigate={handleNavigation}
      isLoading={isLoading}
      error={error && { message: error, onRetry: handleRetry }}
    >
      <ProfilePage onNavigate={handleNavigation} />
    </MainDashboardLayout>
  )
}

export const getServerSideProps = withPageAuthRequired()

export default Profile