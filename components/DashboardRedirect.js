import { useEffect } from 'react';
import { useRouter } from 'next/router';
import LoadingScreen from './LoadingScreen';

const DashboardRedirect = () => {
  const router = useRouter();
  
  useEffect(() => {
    // Check if there's a program query parameter
    if (router.query.program) {
      // Redirect to the new URL structure with the program ID
      router.replace(`/program/${encodeURIComponent(router.query.program)}`);
    } else {
      // No program ID, just redirect to dashboard
      router.replace('/dashboard');
    }
  }, [router.query, router]);
  
  return <LoadingScreen message="Redirecting to dashboard..." />;
};

export default DashboardRedirect;
