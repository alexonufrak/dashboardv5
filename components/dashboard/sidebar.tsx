import React, { useState, useEffect } from "react";
import { Button, Divider, Link } from "@heroui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useDashboard } from "@/contexts/DashboardContext";

// Import icon components
import { 
  HomeIcon, 
  CompassIcon,
  UserIcon,
  ExternalLinkIcon,
  ChevronRightIcon,
  LogoutIcon,
  CommandIcon,
  TeamIcon,
  SettingsIcon
} from "@/components/dashboard/icons";

export function DashboardSidebar({ 
  isOpen,
  onToggle,
  profile
}: { 
  isOpen: boolean;
  onToggle: () => void;
  profile: any;
}) {
  const router = useRouter();
  const { getAllProgramInitiatives } = useDashboard();
  
  // Memoize main links with active state based on current route
  const mainLinks = React.useMemo(() => {
    // Define navigation links inside the memo
    const mainLinksConfig = [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: <HomeIcon />
      },
      {
        title: "Profile",
        url: "/profile",
        icon: <UserIcon />
      },
      {
        title: "Teams",
        url: "/teams",
        icon: <TeamIcon />
      }
    ];
    
    return mainLinksConfig.map(link => ({
      ...link,
      isActive: router.pathname === link.url || 
                (link.url !== '/dashboard' && router.pathname.startsWith(link.url))
    }));
  }, [router.pathname]);
  
  // Get and memoize program initiatives from context
  const programInitiatives = React.useMemo(() => {
    return profile ? getAllProgramInitiatives() : [];
  }, [profile, getAllProgramInitiatives]);
  
  // Memoize program links creation based on initiatives
  const programLinks = React.useMemo(() => {
    if (programInitiatives.length === 0) return [];
    
    return programInitiatives.map(initiative => ({
      title: initiative.name,
      url: `/program/${initiative.id}`,
      icon: <CompassIcon />,
      isActive: router.pathname.includes(`/program/${initiative.id}`)
    }));
  }, [programInitiatives, router.pathname]);
  
  // Memoize utility links with active state based on current route
  const utilityLinks = React.useMemo(() => {
    // Define utility links configuration inside the memo
    const utilityLinksConfig = [
      {
        title: "ConneXions Community",
        url: "https://connexions.xfoundry.org",
        icon: <ExternalLinkIcon />,
        isExternal: true
      },
      {
        title: "xFoundry Website",
        url: "https://xfoundry.org",
        icon: <ExternalLinkIcon />,
        isExternal: true
      },
      {
        title: "Settings",
        url: "/settings",
        icon: <SettingsIcon />,
        isExternal: false
      }
    ];
    
    return utilityLinksConfig.map(link => ({
      ...link,
      isActive: !link.isExternal && router.pathname === link.url
    }));
  }, [router.pathname]);
  
  // Active state calculation is now handled in the useMemo hooks above

  // Format the institution name
  const institutionName = profile?.institutionName || 
                          profile?.institution?.name || 
                          "Your Institution";
  
  return (
    <aside 
      className={`bg-background fixed md:relative inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-divider transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-16"
      }`}
    >
      {/* Mobile close button - visible only on small screens */}
      <div className="md:hidden absolute right-2 top-2">
        <Button 
          isIconOnly
          size="sm" 
          variant="light"
          onClick={onToggle}
          aria-label="Close sidebar"
        >
          <ChevronRightIcon />
        </Button>
      </div>
      
      {/* Header */}
      <div className="p-4">
        <NextLink 
          className={`flex items-center ${isOpen ? "justify-start" : "justify-center"} gap-2`}
          href="/dashboard"
        >
          <div className="bg-primary text-white p-1 rounded-md">
            <CommandIcon className="w-5 h-5" />
          </div>
          {isOpen && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{institutionName}</span>
              <span className="text-xs text-default-500">xFoundry Hub</span>
            </div>
          )}
        </NextLink>
      </div>
      
      <Divider />
      
      {/* Navigation sections */}
      <div className="flex-1 flex flex-col gap-2 p-2 overflow-y-auto">
        {/* Main navigation */}
        <nav className="flex flex-col gap-1">
          {mainLinks.map((link, index) => (
            <NextLink 
              key={`main-${index}`}
              href={link.url}
              className={`flex items-center ${isOpen ? "justify-start px-2" : "justify-center"} py-2 rounded-md text-sm transition-colors ${
                link.isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-default-600 hover:bg-default-100"
              }`}
            >
              <span className="w-5 h-5">{link.icon}</span>
              {isOpen && <span className="ml-2">{link.title}</span>}
            </NextLink>
          ))}
        </nav>
        
        {/* Programs section */}
        {programLinks.length > 0 && (
          <>
            <div className={`${isOpen ? "px-2 flex items-center" : "hidden"} py-1 text-xs text-default-500`}>
              Programs
            </div>
            <nav className="flex flex-col gap-1">
              {programLinks.map((link, index) => (
                <NextLink 
                  key={`program-${index}`}
                  href={link.url}
                  className={`flex items-center ${isOpen ? "justify-start px-2" : "justify-center"} py-2 rounded-md text-sm transition-colors ${
                    link.isActive 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-default-600 hover:bg-default-100"
                  }`}
                >
                  <span className="w-5 h-5">{link.icon}</span>
                  {isOpen && <span className="ml-2 truncate max-w-[160px]">{link.title}</span>}
                </NextLink>
              ))}
              {isOpen && (
                <NextLink 
                  href="/programs"
                  className="px-2 mt-1 py-1 text-xs text-primary hover:underline"
                >
                  Browse all programs
                </NextLink>
              )}
            </nav>
          </>
        )}
        
        {/* Spacer to push utility links to bottom */}
        <div className="flex-grow min-h-[50px]"></div>
        
        {/* Utility links section */}
        {utilityLinks.length > 0 && (
          <>
            <div className={`${isOpen ? "px-2 flex items-center" : "hidden"} py-1 text-xs text-default-500`}>
              Links
            </div>
            <nav className="flex flex-col gap-1">
              {utilityLinks.map((link, index) => (
                <Link
                  key={`utility-${index}`}
                  href={link.url}
                  isExternal={link.isExternal}
                  className={`flex items-center ${isOpen ? "justify-start px-2" : "justify-center"} py-2 rounded-md text-sm transition-colors ${
                    link.isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-default-600 hover:bg-default-100"
                  }`}
                >
                  <span className="w-5 h-5">{link.icon}</span>
                  {isOpen && <span className="ml-2">{link.title}</span>}
                </Link>
              ))}
            </nav>
          </>
        )}
      </div>
      
      {/* Footer with user info */}
      <div className="border-t border-divider p-4">
        {profile ? (
          <div className={`flex ${isOpen ? "justify-between" : "justify-center"} items-center`}>
            <div className="flex items-center gap-2">
              <img 
                src={profile.headshot || "/placeholder-user.jpg"} 
                alt="User" 
                className="w-8 h-8 rounded-full object-cover"
              />
              {isOpen && (
                <div className="flex flex-col">
                  <span className="font-medium text-sm truncate max-w-[120px]">
                    {profile.firstName} {profile.lastName}
                  </span>
                  <span className="text-xs text-default-500 truncate max-w-[120px]">
                    {profile.email}
                  </span>
                </div>
              )}
            </div>
            
            {isOpen && (
              <Link href="/api/auth/logout" className="text-default-400 hover:text-danger">
                <LogoutIcon className="w-5 h-5" />
              </Link>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-default-200 animate-pulse"></div>
            {isOpen && (
              <div className="ml-2 flex-1">
                <div className="h-3 w-24 bg-default-200 rounded animate-pulse"></div>
                <div className="h-2 w-16 bg-default-200 rounded animate-pulse mt-1"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}