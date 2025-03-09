"use client"

import { useRouter } from "next/router"
import Link from "next/link" 
import { useUser } from "@auth0/nextjs-auth0/client"
import { useState, useEffect, Suspense } from "react"
import ProfileMenuButton from "@/components/profile/ProfileMenuButton"
import { useDashboard } from "@/contexts/DashboardContext"
import { ROUTES } from '@/lib/routing'

import { 
  Home,
  Compass,
  ExternalLink,
  LogOut,
  Menu,
  LayoutDashboard
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarMenuSkeleton
} from "@/components/ui/sidebar"

import { Skeleton } from "@/components/ui/skeleton"

const ProperDashboardSidebar = ({ profile, onEditClick, currentPage, onNavigate }) => {
  const router = useRouter()
  const { user } = useUser()
  // Use conditional initialization for dashboard context values
  // This prevents errors if context isn't available yet
  let initiativeName = "Program";
  let setIsEditModalOpen = () => {};
  let getAllProgramInitiatives = () => [];
  let hasProgramData = false;
  let dashboardProfile = null;
  let isLoading = false;
  let programLoading = false;
  
  try {
    // Try to access the dashboard context
    const dashboardContext = useDashboard();
    if (dashboardContext) {
      // If context exists, extract the values we need
      initiativeName = dashboardContext.initiativeName || "Program";
      setIsEditModalOpen = dashboardContext.setIsEditModalOpen || (() => {});
      getAllProgramInitiatives = dashboardContext.getAllProgramInitiatives || (() => []);
      hasProgramData = dashboardContext.hasProgramData || false;
      dashboardProfile = dashboardContext.profile;
      isLoading = dashboardContext.isLoading || false;
      programLoading = dashboardContext.programLoading || false;
    }
  } catch (error) {
    // If we can't access context, log the error but continue with defaults
    console.error('Error accessing dashboard context in sidebar:', error);
  }
  
  // Get active program initiatives safely - don't use getAllProgramInitiatives directly
  // Instead, use the raw participationData from API
  let programInitiatives = [];
  
  try {
    // Try to access the dashboard context's participation data directly
    // This should be available from the API response
    const dashboardContext = useDashboard();
    const participationData = dashboardContext?.participationData;
    
    // Process the participation data manually - safer than calling the function
    if (participationData?.participation && Array.isArray(participationData.participation)) {
      // Use a Set to track unique initiative IDs
      const uniqueInitiativeIds = new Set();
      
      // Map participations to initiatives
      participationData.participation.forEach(p => {
        if (p.cohort?.initiativeDetails?.id) {
          const initiativeId = p.cohort.initiativeDetails.id;
          
          // Only add each initiative once
          if (!uniqueInitiativeIds.has(initiativeId)) {
            uniqueInitiativeIds.add(initiativeId);
            
            programInitiatives.push({
              id: initiativeId,
              name: p.cohort.initiativeDetails.name || "Unknown Initiative",
              cohortId: p.cohort.id,
              teamId: p.teamId || null
            });
          }
        }
      });
    }
  } catch (error) {
    console.error('Error processing program initiatives in sidebar:', error);
  }
  
  // Debug logs
  console.log("Program Initiatives (safe method):", programInitiatives);
  console.log("Profile has active participations:", dashboardProfile?.hasActiveParticipation);
  console.log("Total program initiatives found:", programInitiatives.length);
  
  // Debug router state
  console.log("Current router state:", { 
    pathname: router.pathname,
    query: router.query,
    asPath: router.asPath,
    currentPage: currentPage 
  });
  
  // Navigation links skeleton (short version)
const ShortNavigationLinksSkeleton = () => {
  return (
    <>
      {Array.from({ length: 2 }).map((_, index) => (
        <SidebarMenuItem key={`nav-skeleton-short-${index}`}>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
      ))}
    </>
  );
};

// Create base navigation links with dashboard
const baseLinks = [
  {
    id: "dashboard",
    href: "/dashboard",
    label: "Dashboard",
    icon: <Home className="h-4 w-4" />
  }
];
  
  // ROUTES is now imported at the top of the file
  
  // Navigation links skeleton
const NavigationLinksSkeleton = () => {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <SidebarMenuItem key={`nav-skeleton-${index}`}>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
      ))}
    </>
  );
};

// Create program links directly from initiatives
const programLinks = programInitiatives
  .filter(initiative => initiative && initiative.id) // Only include valid initiatives
  .map(initiative => ({
    id: `program-${initiative.id}`,
    href: ROUTES.PROGRAM.DETAIL(initiative.id),
    label: initiative.name || "Program",
    icon: <Compass className="h-4 w-4" />,
    programId: initiative.id
  }));

// Combine base links (Dashboard) with program links
const links = [...baseLinks, ...programLinks];
  
  // External links
  const externalLinks = [
    {
      href: "https://connexions.xfoundry.org",
      label: "ConneXions Community",
      icon: <ExternalLink className="h-4 w-4" />
    },
    {
      href: "https://xfoundry.org",
      label: "xFoundry Website",
      icon: <ExternalLink className="h-4 w-4" />
    },
    {
      href: "/api/auth/logout",
      label: "Sign Out",
      icon: <LogOut className="h-4 w-4" />
    }
  ]

  // Modal state is now imported at the top of the component
  
  // Log a message when navigation is being prepared
  console.log("Sidebar initialized with links:", links);

  return (
    <>
      {/* Mobile trigger button - fixed position */}
      <div className="md:hidden fixed left-4 top-3 z-40">
        <SidebarTrigger 
          className="h-10 w-10 rounded-full bg-white shadow-xs border"
        >
          <Menu className="h-5 w-5" />
        </SidebarTrigger>
      </div>
      
      {/* Sidebar component */}
      <Sidebar>
        <SidebarHeader>
          <div className="flex flex-col gap-2 px-3 pt-2">
            <h2 className="text-xl font-bold tracking-tight text-primary">
              xFoundry Hub
            </h2>
          </div>
          
          {/* Profile Section */}
          {profile && <ProfileMenuButton user={user} profile={profile} onEditClick={onEditClick} />}
        </SidebarHeader>
  
        <SidebarContent>
          {/* Navigation Links Group */}
          <SidebarGroup>
            <SidebarGroupLabel>NAVIGATION</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Check if data is loading */}
                {isLoading || programLoading ? (
                  <NavigationLinksSkeleton />
                ) : (
                  /* Render all links (dashboard + program links) */
                  links.map((link) => (
                    <SidebarMenuItem key={link.id || link.label}>
                      <Link 
                        href={link.href}
                        className="w-full"
                        shallow={true}
                        scroll={false}
                        onClick={() => {
                          if (onNavigate && link.programId) {
                            onNavigate(`program-${link.programId}`);
                          }
                        }}
                        passHref
                      >
                        <SidebarMenuButton
                          isActive={
                            currentPage === link.id || 
                            router.pathname === link.href ||
                            (link.id === "dashboard" && router.pathname === "/dashboard" && !router.query.programId) ||
                            (link.programId && router.query.programId === link.programId)
                          }
                        >
                          <div className="flex items-center gap-2">
                            {link.icon}
                            <span>{link.label}</span>
                          </div>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  ))
                )}
                
                {/* All links are now rendered together */}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
  
        <SidebarFooter>
          <SidebarGroup>
            <SidebarGroupLabel>LINKS</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {isLoading ? (
                  // External links skeleton
                  Array.from({ length: 3 }).map((_, index) => (
                    <SidebarMenuItem key={`external-link-skeleton-${index}`}>
                      <SidebarMenuSkeleton showIcon />
                    </SidebarMenuItem>
                  ))
                ) : (
                  // Render external links
                  externalLinks.map((link) => (
                    <SidebarMenuItem key={link.label}>
                      {link.label === "Sign Out" ? (
                        <Link href={link.href} className="w-full">
                          <SidebarMenuButton className="w-full">
                            <div className="flex justify-between w-full">
                              <span>{link.label}</span>
                              {link.icon}
                            </div>
                          </SidebarMenuButton>
                        </Link>
                      ) : (
                        <a 
                          href={link.href} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full"
                        >
                          <SidebarMenuButton className="w-full">
                            <div className="flex justify-between w-full">
                              <span>{link.label}</span>
                              {link.icon}
                            </div>
                          </SidebarMenuButton>
                        </a>
                      )}
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>
    </>
  )
}

export default ProperDashboardSidebar