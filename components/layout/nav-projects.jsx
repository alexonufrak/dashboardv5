import { useRouter } from "next/router"
import Link from "next/link"
import React, { Suspense } from "react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar"

// Loading skeleton for projects
export function NavProjectsSkeleton() {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Programs</SidebarGroupLabel>
      <SidebarMenu>
        {Array.from({ length: 3 }).map((_, index) => (
          <SidebarMenuItem key={index}>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function NavProjects({
  projects,
  isLoading = false,
  groupLabel = "Projects" // Default label, can be overridden
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()

  // Function to handle client-side navigation with shallow update
  const handleNavigation = (e, url) => {
    e.preventDefault() // Prevent default link behavior
    router.push(url, undefined, { shallow: true })
  }

  // Prefetch all project URLs to make navigation feel instant
  React.useEffect(() => {
    projects.forEach(item => {
      router.prefetch(item.url)
    })
  }, [projects, router])

  return (
    (<SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
      {isLoading ? (
        <NavProjectsSkeleton />
      ) : (
        <SidebarMenu>
          {projects.map((item) => (
            <SidebarMenuItem key={item.name || item.id}>
              {item.isActive ? (
                <SidebarMenuButton 
                  as="a"
                  href={item.url}
                  onClick={(e) => handleNavigation(e, item.url)}
                  isActive
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.name}</span>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton 
                  as="a"
                  href={item.url}
                  onClick={(e) => handleNavigation(e, item.url)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.name}</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      )}
    </SidebarGroup>)
  );
}
