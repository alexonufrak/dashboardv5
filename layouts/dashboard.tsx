import { Head } from "./head";

import { useEffect, useState } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";

// Import components we'll create
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardNavbar } from "@/components/dashboard/navbar";
import OnboardingBanner from "@/components/onboarding/OnboardingBanner";
import OnboardingDialog from "@/components/onboarding/OnboardingDialog";
import { Link } from "@heroui/react";

export default function DashboardLayout({
  children,
  title = "Dashboard",
  profile,
  isLoading = false,
  loadingMessage = "Loading dashboard...",
  error = null,
  applications = []
}: {
  children: React.ReactNode;
  title?: string;
  profile?: any;
  isLoading?: boolean;
  loadingMessage?: string;
  error?: string | null;
  applications?: any[];
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentYear, setCurrentYear] = useState("");
  const { 
    checkOnboardingStatus, 
    dialogOpen,
    isLoading: isLoadingOnboarding
  } = useOnboarding();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());
  }, []);
  
  // Check onboarding status when the component mounts
  useEffect(() => {
    if (!isLoading && profile) {
      checkOnboardingStatus();
    }
  }, [isLoading, profile, checkOnboardingStatus]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="relative flex flex-col h-screen bg-content1">
      <Head />
      
      <div className="flex flex-1 h-full overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          onToggle={toggleSidebar}
          profile={profile}
        />
        
        {/* Main content area */}
        <div className="flex flex-col flex-1 w-full overflow-x-hidden">
          {/* Navbar for mobile/desktop */}
          <DashboardNavbar 
            onSidebarToggle={toggleSidebar} 
            profile={profile} 
          />
          
          {/* Onboarding Banner */}
          <OnboardingBanner />
          
          {/* Onboarding Dialog */}
          <OnboardingDialog 
            profile={profile} 
            applications={applications}
            isLoadingApplications={isLoading}
          />
          
          {/* Content area */}
          <main className="flex-1 w-full p-4 md:p-6 overflow-auto">
            {/* Error state */}
            {error ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="bg-danger-50 border border-danger-200 rounded-lg p-6 max-w-md">
                  <h2 className="text-lg font-semibold text-danger-800 mb-2">Error Loading Dashboard</h2>
                  <p className="text-danger-700 mb-4">{error}</p>
                  <button 
                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-default-600">{loadingMessage}</p>
              </div>
            ) : (
              <div className="w-full">
                {children}
              </div>
            )}
          </main>
          
          {/* Footer */}
          <footer className="border-t py-6 mt-auto text-center text-default-500 text-sm">
            <p>© {currentYear} xFoundry Education Platform. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </div>
  );
}