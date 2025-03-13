"use client";
import { useRouter } from "next/router"
import Link from "next/link"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items
}) {
  const router = useRouter()

  // Function to handle client-side navigation
  const handleNavigation = (e, url) => {
    e.preventDefault() // Prevent default link behavior
    router.push(url, undefined, { shallow: true })
  }

  return (
    (<SidebarGroup>
      <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            {item.isActive ? (
              <SidebarMenuButton 
                as="a" 
                href={item.url} 
                onClick={(e) => handleNavigation(e, item.url)}
                isActive 
                tooltip={item.title}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton 
                as="a" 
                href={item.url} 
                onClick={(e) => handleNavigation(e, item.url)}
                tooltip={item.title}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>)
  );
}
