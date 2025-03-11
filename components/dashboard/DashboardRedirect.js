import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Skeleton } from "@/components/ui/skeleton";
import { 
  getProgramIdFromUrl, 
  navigateToProgram,
  navigateToDashboard,
  ROUTES 
} from '@/lib/routing';

/**
 * DashboardRedirect component
 * Handles redirection from legacy routes to the new URL structure
 */
const DashboardRedirect = () => {
  const router = useRouter();
  
  useEffect(() => {
    // Check if there's a program ID in the URL (from either path or query parameters)
    const programId = getProgramIdFromUrl(router);
    
    if (programId) {
      // Redirect to the new URL structure with the program ID
      navigateToProgram(router, programId, { replace: true });
    } else {
      // No program ID, just redirect to dashboard
      navigateToDashboard(router, { replace: true });
    }
  }, [router]);
  
  return (
    <div className="space-y-6 w-full py-6 max-w-6xl mx-auto">
      <Skeleton className="h-8 w-64 mb-6" />
      <div className="text-muted-foreground text-sm mb-6">Redirecting to dashboard...</div>
      <Skeleton className="h-48 w-full rounded-lg mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    </div>
  );
};

export default DashboardRedirect;
