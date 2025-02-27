import { useEffect } from 'react';
import { useRouter } from 'next/router';
import LoadingScreen from './LoadingScreen';

const DashboardRedirect = () => {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/dashboard');
  }, [router]);
  
  return <LoadingScreen message="Redirecting to dashboard..." />;
};

export default DashboardRedirect;
