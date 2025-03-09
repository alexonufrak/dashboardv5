import Link from "next/link"
import { Suspense } from "react";

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

  return (
    (<SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
      {isLoading ? (
        <NavProjectsSkeleton />
      ) : (
        <SidebarMenu>
          {projects.map((item) => (
            <SidebarMenuItem key={item.name || item.id}>
              <SidebarMenuButton asChild isActive={item.isActive}>
                <Link href={item.url} passHref>
                  <item.icon />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      )}
    </SidebarGroup>)
  );
}
