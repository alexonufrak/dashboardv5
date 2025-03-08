import { useEffect } from 'react';
import { useRouter } from 'next/router';
import LoadingScreen from './LoadingScreen';
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
  
  return <LoadingScreen message="Redirecting to dashboard..." />;
};

export default DashboardRedirect;
