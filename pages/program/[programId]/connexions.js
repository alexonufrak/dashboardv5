import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';
import { getProgramIdFromUrl } from '@/lib/routing';
import ProgramLayout from '@/components/program/ProgramLayout';

/**
 * ConneXions iframe embed page
 * This page displays the ConneXions community platform in an iframe 
 * for seamless integration with the dashboard
 */
const ConneXionsPage = () => {
  const router = useRouter();
  const { participationData, setActiveProgram } = useDashboard();
  const [isLoading, setIsLoading] = useState(true);
  
  const programId = getProgramIdFromUrl(router);
  
  // Set active program when the page loads or programId changes
  useEffect(() => {
    if (programId) {
      setActiveProgram(programId);
    }
  }, [programId, setActiveProgram]);
  
  // Simulate loading to ensure iframe loads properly
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <ProgramLayout 
      title="ConneXions Community" 
      description="Connect with other program participants and the broader community"
      activeSection="connexions"
    >
      <div className="relative h-full w-full min-h-[calc(100vh-160px)]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm text-neutral-600">Loading ConneXions Community...</p>
            </div>
          </div>
        )}
        
        <iframe 
          src="https://connexions.xfoundry.org"
          className="h-full w-full min-h-[calc(100vh-160px)]"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="ConneXions Community"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </ProgramLayout>
  );
};

export default ConneXionsPage;