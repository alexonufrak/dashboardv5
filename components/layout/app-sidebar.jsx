"use client"

import * as React from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { Home, ExternalLink, LogOut, Command, Compass } from "lucide-react"
import { useDashboard } from "@/contexts/DashboardContext"
import { useUser } from "@auth0/nextjs-auth0/client"
import { ROUTES } from '@/lib/routing'

import { NavMain } from "@/components/layout/nav-main"
import { NavProjects, NavProjectsSkeleton } from "@/components/layout/nav-projects"
import { NavSecondary } from "@/components/layout/nav-secondary"
import { NavUser } from "@/components/layout/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarMenuSkeleton
} from "@/components/ui/sidebar"

export function AppSidebar({
  ...props
}) {
  const router = useRouter()
  const { user } = useUser()
  
  // Get dashboard context data
  const {
    profile,
    isLoading,
    programLoading,
    participationData,
    setIsEditModalOpen
  } = useDashboard()

  // Create navigation links skeleton for loading state
  const NavigationLinksSkeleton = () => {
    return (
      <>
        {Array.from({ length: 3 }).map((_, index) => (
          <SidebarMenuItem key={`nav-skeleton-${index}`}>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
        ))}
      </>
    );
  };

  // Create base navigation for main section (Dashboard only)
  const isDashboardActive = (router.pathname === "/dashboard" || router.pathname === "/dashboard-new") && !router.query.programId;

  const navMainItems = [
    {
      title: "Dashboard",
      url: "/dashboard-new",
      icon: Home,
      isActive: isDashboardActive
    }
  ];

  // Process program initiatives from participation data
  const programInitiatives = React.useMemo(() => {
    if (!participationData?.participation || isLoading) return [];
    
    // Use a Set to track unique initiative IDs
    const uniqueInitiativeIds = new Set();
    const initiatives = [];
    
    participationData.participation.forEach(p => {
      if (p.cohort?.initiativeDetails?.id) {
        const initiativeId = p.cohort.initiativeDetails.id;
        
        // Only add each initiative once
        if (!uniqueInitiativeIds.has(initiativeId)) {
          uniqueInitiativeIds.add(initiativeId);
          
          // Use new program URL structure
          const programUrl = `/program-new/${initiativeId}`;
          
          initiatives.push({
            name: p.cohort.initiativeDetails.name || "Unknown Program",
            url: programUrl,
            icon: Compass, 
            id: initiativeId,
            isActive: router.query.programId === initiativeId
          });
        }
      }
    });
    
    return initiatives;
  }, [participationData, isLoading, router.query.programId]);

  // External links for secondary navigation
  const secondaryLinks = [
    {
      title: "ConneXions Community",
      url: "https://connexions.xfoundry.org",
      icon: ExternalLink,
    },
    {
      title: "xFoundry Website",
      url: "https://xfoundry.org",
      icon: ExternalLink,
    }
  ];

  // Get institution name from profile data
  const institutionName = React.useMemo(() => {
    if (!profile) return "Institution";
    
    return profile.institutionName || 
           profile.institution?.name || 
           "Your Institution";
  }, [profile]);

  // User data for the NavUser component
  const userData = React.useMemo(() => {
    if (!user || !profile) return null;
    
    return {
      name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || user.name || "User",
      email: user.email,
      avatar: profile.headshot || user.picture || '/placeholder-user.jpg',
      // Pass the onEditClick handler to open profile modal
      onEditClick: () => setIsEditModalOpen(true)
    };
  }, [user, profile, setIsEditModalOpen]);

  // Mobile trigger button (fixed position)
  const MobileTrigger = () => (
    <div className="md:hidden fixed left-4 top-3 z-40">
      <SidebarTrigger 
        className="h-10 w-10 rounded-full bg-white shadow-xs border"
      />
    </div>
  );

  return (
    <>
      <MobileTrigger />
      <Sidebar
        className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
        {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/dashboard">
                  <div
                    className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg mr-2">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{institutionName}</span>
                    <span className="truncate text-xs">xFoundry Hub</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="flex flex-col flex-grow">
          {/* Main Navigation (Dashboard) */}
          <NavMain items={navMainItems} />
          
          {/* Programs Navigation */}
          {isLoading || programLoading ? (
            <NavProjectsSkeleton />
          ) : programInitiatives.length > 0 ? (
            <NavProjects projects={programInitiatives} groupLabel="Programs" />
          ) : null}
          
          {/* Add spacer to push secondary links to bottom */}
          <div className="flex-grow min-h-[50px]"></div>
          
          {/* Secondary Links */}
          <NavSecondary items={secondaryLinks} />
        </SidebarContent>
        <SidebarFooter>
          {/* User Profile */}
          {userData ? (
            <NavUser user={userData} profile={profile} />
          ) : (
            <SidebarMenuItem>
              <SidebarMenuSkeleton showIcon />
            </SidebarMenuItem>
          )}
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
