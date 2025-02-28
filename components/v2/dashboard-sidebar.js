"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useUser } from "@auth0/nextjs-auth0/client";
import { 
  Home,
  Compass, 
  Users, 
  ExternalLink, 
  LogOut,
  Command
} from "lucide-react";

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
  SidebarSeparator
} from "../ui/sidebar";

export function DashboardSidebarV2({ profile, onEditClick }) {
  const router = useRouter();
  const { user } = useUser();
  
  // Navigation links
  const mainNavLinks = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-4 w-4" />,
      isActive: router.pathname === "/dashboard"
    }
  ];
  
  // External links
  const externalLinks = [
    {
      title: "ConneXions Community",
      href: "https://connexions.xfoundry.org",
      icon: <ExternalLink className="h-4 w-4" />
    },
    {
      title: "xFoundry Website",
      href: "https://xfoundry.org",
      icon: <ExternalLink className="h-4 w-4" />
    },
    {
      title: "Sign Out",
      href: "/api/auth/logout",
      icon: <LogOut className="h-4 w-4" />
    }
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-white">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">xFoundry Hub</span>
                  <span className="truncate text-xs">
                    {profile?.institutionName || "Education Platform"}
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>NAVIGATION</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavLinks.map((link) => (
                <SidebarMenuItem key={link.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={link.isActive}
                  >
                    <Link href={link.href}>
                      {link.icon}
                      <span>{link.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarSeparator />
        
        {/* User Profile Card */}
        {profile && (
          <SidebarGroup>
            <SidebarGroupLabel>PROFILE</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="flex flex-col items-center space-y-2 py-2 px-1">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-muted">
                  <img 
                    src={user?.picture || "/placeholder-user.jpg"} 
                    alt={user?.name || "User Profile"} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-sm">{profile?.firstName} {profile?.lastName}</h3>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{user?.email}</p>
                </div>
                <button 
                  onClick={onEditClick}
                  className="text-xs text-primary hover:underline"
                >
                  Edit Profile
                </button>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        
        {/* External Links */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>LINKS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {externalLinks.map((link) => (
                <SidebarMenuItem key={link.title}>
                  <SidebarMenuButton asChild>
                    {link.title === "Sign Out" ? (
                      <Link href={link.href} className="flex justify-between">
                        <span>{link.title}</span>
                        {link.icon}
                      </Link>
                    ) : (
                      <a 
                        href={link.href} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex justify-between"
                      >
                        <span>{link.title}</span>
                        {link.icon}
                      </a>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="pb-4">
        <div className="px-3 py-2 text-xs text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} xFoundry</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}