"use client"

import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useState, useEffect } from "react"
import ProfileMenuButton from "./ProfileMenuButton"
import { useDashboard } from "@/contexts/DashboardContext"

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
} from "./ui/sidebar"

const ProperDashboardSidebar = ({ profile, onEditClick, currentPage, onNavigate }) => {
  const router = useRouter()
  const { user } = useUser()
  const { initiativeName, setIsEditModalOpen } = useDashboard()
  
  // Get active initiatives from context
  const { getAllProgramInitiatives, hasProgramData, profile: dashboardProfile } = useDashboard();
  
  // Get all active program initiatives
  const programInitiatives = getAllProgramInitiatives() || [];
  
  // Debug logs
  console.log("Program Initiatives:", programInitiatives);
  console.log("Profile has active participations:", dashboardProfile?.hasActiveParticipation);
  console.log("Profile participations:", dashboardProfile?.participations?.length);
  
  // Create base navigation links with dashboard
  const baseLinks = [
    {
      id: "dashboard",
      href: "/dashboard",
      label: "Dashboard",
      icon: <Home className="h-4 w-4" />
    }
  ];
  
  // Generate program links dynamically based on active participations
  const programLinks = programInitiatives.map(initiative => ({
    id: `program-${initiative.id}`,
    href: `/program-dashboard/${initiative.id}`,
    label: initiative.name || "Program",
    icon: <Compass className="h-4 w-4" />,
    programId: initiative.id
  }));
  
  // If no active participations, show default program link (will show "No active program" screen)
  const links = programLinks.length > 0 
    ? [...baseLinks, ...programLinks] 
    : [
        ...baseLinks,
        {
          id: "program",
          href: "/program-dashboard",
          label: initiativeName || "Program",
          icon: <Compass className="h-4 w-4" />
        }
      ]
  
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
  
  // Handle navigation click - simplified version that never causes full page loads
  const handleNavClick = (e, link) => {
    e.preventDefault()
    console.log("Navigation clicked:", link);
    
    if (link.href.startsWith('#')) {
      // Handle anchor links
      const element = document.getElementById(link.href.substring(1))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
      return
    }
    
    // Special handling for profile page - open modal instead of navigating
    if (link.href === "/profile") {
      console.log("Profile link clicked - opening modal directly");
      setIsEditModalOpen(true);
      return;
    }
    
    // IMPORTANT: We NEVER use router.push - only handle navigation via the onNavigate callback
    // or use window.history.pushState to update the URL without page reload
    
    // Handle program-specific navigation
    if (link.programId) {
      console.log(`Navigating to program ${link.programId}`);
      
      // Update URL without page reload
      window.history.pushState({}, '', link.href);
      
      // Update component state via callback
      if (onNavigate) {
        onNavigate(`program-${link.programId}`);
      }
      return;
    }
    
    // Handle internal navigation
    if (link.id && onNavigate) {
      console.log(`Navigating to ${link.id} using client-side navigation`);
      
      // Update URL without page reload
      window.history.pushState({}, '', link.href);
      
      // Update component state via callback
      onNavigate(link.id);
    } else if (link.href === "/dashboard" || link.href === "/program-dashboard") {
      // Map standard URLs to navigable pages
      const pageMap = {
        "/dashboard": "dashboard",
        "/program-dashboard": "program",
      };
      
      // Update URL without page reload
      window.history.pushState({}, '', link.href);
      
      if (onNavigate && pageMap[link.href]) {
        console.log(`Mapped ${link.href} to ${pageMap[link.href]} for client-side navigation`);
        onNavigate(pageMap[link.href]);
      }
    } else if (link.href.startsWith('http')) {
      // External links - open in new tab
      console.log(`Opening external link in new tab: ${link.href}`);
      window.open(link.href, '_blank');
    } else if (link.href.startsWith('/api/auth/logout')) {
      // Special case for logout - use direct navigation
      console.log(`Navigating to logout: ${link.href}`);
      window.location.href = link.href;
    }
  }

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
                      <SidebarMenuButton
                        isActive={currentPage === link.id || 
                                  (link.programId && currentPage === "program" && router.query.programId === link.programId) ||
                                  router.pathname === link.href || 
                                 (link.href.startsWith('#') && router.asPath.includes(link.href))}
                        onClick={(e) => handleNavClick(e, link)}
                      >
                        <a href={link.href} className="flex items-center gap-3">
                          {link.icon}
                          <span>{link.label}</span>
                        </a>
                      </SidebarMenuButton>
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
                    <SidebarMenuButton
                      asChild
                    >
                      {link.label === "Sign Out" ? (
                        <a href={link.href} className="flex justify-between w-full">
                          <span>{link.label}</span>
                          {link.icon}
                        </a>
                      ) : (
                        <a 
                          href={link.href} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex justify-between w-full"
                        >
                          <span>{link.label}</span>
                          {link.icon}
                        </a>
                      )}
                    </SidebarMenuButton>
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