'use client';

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ExternalLink, LogOut, Command, Compass, User, Users, CalendarDays } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NavMain } from "@/components/layout/nav-main";
import { NavProjects, NavProjectsSkeleton } from "@/components/layout/nav-projects";
import { NavSecondary } from "@/components/layout/nav-secondary";
import { NavUser } from "@/components/layout/nav-user";
import { CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppSidebarClient({
  user,
  programs = [],
  isLoading = false,
  onProfileEdit,
  ...props
}) {
  const pathname = usePathname();
  
  // Create base navigation for main section
  const navMainItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: pathname === "/dashboard"
    },
    {
      title: "Programs",
      url: "/dashboard/programs",
      icon: Compass,
      isActive: pathname.startsWith("/dashboard/programs")
    },
    {
      title: "Teams",
      url: "/dashboard/teams",
      icon: Users,
      isActive: pathname.startsWith("/dashboard/teams")
    },
    {
      title: "Events",
      url: "/dashboard/events",
      icon: CalendarDays,
      isActive: pathname.startsWith("/dashboard/events")
    },
    {
      title: "Profile",
      url: "/dashboard/profile",
      icon: User,
      isActive: pathname === "/dashboard/profile"
    }
  ];

  // Process programs for the sidebar
  const programItems = React.useMemo(() => {
    if (!programs || isLoading) return [];
    
    return programs.map(program => ({
      name: program.name || "Unknown Program",
      url: `/dashboard/programs/${program.id}`,
      icon: Compass,
      id: program.id,
      isActive: pathname === `/dashboard/programs/${program.id}`
    }));
  }, [programs, isLoading, pathname]);

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

  // Get institution name
  const institutionName = React.useMemo(() => {
    if (!user) return "Institution";
    return user.institutionName || "Institution";
  }, [user]);

  // User data for the NavUser component
  const userData = React.useMemo(() => {
    if (!user) return null;
    
    return {
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || "User",
      email: user.email,
      avatar: user.headshot || '/placeholder-user.jpg',
      onEditClick: onProfileEdit
    };
  }, [user, onProfileEdit]);

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar className="hidden md:block">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <Popover>
                <PopoverTrigger asChild>
                  <SidebarMenuButton size="lg" className="cursor-pointer w-full">
                    <div
                      className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg mr-2">
                      <Command className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{institutionName}</span>
                        <span className="truncate text-xs">xFoundry</span>
                      </div>
                    </SidebarMenuButton>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{institutionName}</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  </PopoverContent>
                </Popover>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent className="flex flex-col flex-grow">
            {/* Main Navigation (Dashboard) */}
            <NavMain items={navMainItems} />
            
            {/* Programs Navigation */}
            {isLoading ? (
              <NavProjectsSkeleton />
            ) : programItems.length > 0 ? (
              <NavProjects projects={programItems} groupLabel="Your Programs" />
            ) : null}
            
            {/* Add spacer to push secondary links to bottom */}
            <div className="flex-grow min-h-[50px]"></div>
            
            {/* Secondary Links */}
            <NavSecondary items={secondaryLinks} />
          </SidebarContent>
          <SidebarFooter>
            {/* User Profile */}
            {userData ? (
              <NavUser user={userData} profile={user} />
            ) : (
              <SidebarMenuItem>
                <SidebarMenuSkeleton showIcon />
              </SidebarMenuItem>
            )}
          </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        {props.children}
      </SidebarInset>
    </SidebarProvider>
  );
}

// Add SidebarInset component to create the main content area
function SidebarInset({ children, className, ...props }) {
  return (
    <main
      className="relative flex w-full flex-1 flex-col overflow-x-hidden"
      {...props}
    >
      {children}
    </main>
  );
}