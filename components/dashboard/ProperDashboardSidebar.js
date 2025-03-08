"use client"

import { useRouter } from "next/router"
import Link from "next/link" 
import { useUser } from "@auth0/nextjs-auth0/client"
import { useState, useEffect } from "react"
import ProfileMenuButton from "@/components/profile/ProfileMenuButton"
import { useDashboard } from "@/contexts/DashboardContext"
import { ROUTES } from '@/lib/routing'

import { 
  Home,
  Compass,
  Users, 
  ExternalLink,
  LogOut,
  Menu,
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
  SidebarTrigger
} from "@/components/ui/sidebar"

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
  
  // Generate program links dynamically based on active participations
  // Ensure we only create links for valid initiatives
  const programLinks = programInitiatives
    .filter(initiative => initiative && initiative.id) // Only include valid initiatives
    .map(initiative => ({
      id: `program-${initiative.id}`,
      href: ROUTES.PROGRAM.DETAIL(initiative.id), // Use routing utility
      label: initiative.name || "Program",
      icon: <Compass className="h-4 w-4" />,
      programId: initiative.id
    }));
  
  // Only include program links if there are active participations
  const links = programLinks.length > 0 
    ? [...baseLinks, ...programLinks] 
    : [...baseLinks] // Only include base links if no program participations
  
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
                {console.log("Rendering links:", links)}
                {links.map((link) => {
                  console.log("Rendering link:", link);
                  return (
                    <SidebarMenuItem key={link.id || link.label}>
                      <Link 
                        href={link.programId ? `/program/${link.programId}` : link.href}
                        className="w-full"
                        shallow={true}
                        scroll={false}
                        onClick={(e) => {
                          // Special case for profile - open modal instead of navigation
                          if (link.href === "/profile") {
                            e.preventDefault();
                            setIsEditModalOpen(true);
                            return;
                          }
                          
                          // For program links, update internal state
                          if (link.programId && onNavigate) {
                            onNavigate(`program-${link.programId}`);
                          }
                        }}
                        passHref
                      >
                        <SidebarMenuButton
                          isActive={
                            // Debug active state checks
                            (() => {
                              const isIdMatch = currentPage === link.id;
                              const isProgramIdMatch = link.programId && currentPage === "program" && router.query.program === link.programId;
                              const isDashboardNoProgram = link.id === "dashboard" && router.pathname === "/dashboard" && !router.query.program;
                              const isPathMatch = router.pathname === link.href;
                              
                              console.log(`Link ${link.label} active check:`, {
                                isIdMatch,
                                isProgramIdMatch,
                                isDashboardNoProgram,
                                isPathMatch,
                                result: isIdMatch || isProgramIdMatch || isDashboardNoProgram || isPathMatch
                              });
                              
                              return isIdMatch || isProgramIdMatch || isDashboardNoProgram || isPathMatch || 
                                    (link.href.startsWith('#') && router.asPath.includes(link.href));
                            })()
                          }
                          className="w-full"
                        >
                          <div className="flex items-center gap-3">
                            {link.icon}
                            <span>{link.label}</span>
                          </div>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
  
        <SidebarFooter>
          <SidebarGroup>
            <SidebarGroupLabel>LINKS</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {externalLinks.map((link) => (
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
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>
    </>
  )
}

export default ProperDashboardSidebar