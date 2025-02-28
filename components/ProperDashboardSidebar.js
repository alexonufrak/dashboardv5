"use client"

import Link from "next/link"
import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0/client"
import ProfileMenuButton from "./ProfileMenuButton"

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
  SidebarProvider,
  SidebarTrigger
} from "./ui/sidebar"

const ProperDashboardSidebar = ({ profile, onEditClick }) => {
  const router = useRouter()
  const { user } = useUser()
  
  // Navigation links (currently empty as specified)
  const links = []
  
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

  return (
    <>
      {/* Mobile trigger button - fixed position */}
      <div className="md:hidden fixed left-4 top-3 z-40">
        <SidebarTrigger 
          className="h-10 w-10 rounded-full bg-white shadow-sm border"
        >
          <Menu className="h-5 w-5" />
        </SidebarTrigger>
      </div>
      
      {/* SidebarProvider wraps the entire layout */}
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
                {links.map((link) => (
                  <SidebarMenuItem key={link.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={router.pathname === link.href || 
                               (link.href.startsWith('#') && router.asPath.includes(link.href))}
                    >
                      <Link href={link.href} onClick={() => {
                        if (link.href.startsWith('#')) {
                          const element = document.getElementById(link.href.substring(1))
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' })
                          }
                        }
                      }}>
                        {link.icon}
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
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
                        <Link href={link.href} className="flex justify-between w-full">
                          <span>{link.label}</span>
                          {link.icon}
                        </Link>
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