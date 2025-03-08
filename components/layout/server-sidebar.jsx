'use server'

import { Suspense } from "react"
import { Command, Frame, Map, PieChart } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { NavProjectsSkeleton } from "./nav-projects"

// Simulated async data fetching function
async function fetchProjects() {
  // This simulates a database or API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ]
}

// Server component that fetches data
async function NavProjects() {
  const projects = await fetchProjects()
 
  return (
    <SidebarMenu>
      {projects.map((item) => (
        <SidebarMenuItem key={item.name}>
          <SidebarMenuButton asChild>
            <a href={item.url}>
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

// Usage with Suspense
export function ServerSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">React Server Components</span>
                  <span className="truncate text-xs">Example Implementation</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <Suspense fallback={<NavProjectsSkeleton />}>
          <NavProjects />
        </Suspense>
      </SidebarContent>
      
      <SidebarFooter>
        {/* Footer content */}
      </SidebarFooter>
    </Sidebar>
  )
}