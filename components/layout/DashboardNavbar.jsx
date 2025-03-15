"use client"

import React from 'react'
import { useRouter } from 'next/router'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile' 
import { BellIcon, Search, MoreHorizontal } from 'lucide-react'

const routeMap = {
  '/dashboard': 'Dashboard',
  '/dashboard/programs': 'Programs',
  '/dashboard/program': 'Program',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/program': 'Programs',
}

const ITEMS_TO_DISPLAY = 3

/**
 * Dashboard navigation bar component with breadcrumbs and page title
 * Follows the sidebar-08 shadcn example pattern
 */
export function DashboardNavbar({ title, showBreadcrumbs = true }) {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()
  const isDesktop = !isMobile
  const router = useRouter()
  const { pathname, query } = router
  
  // Generate breadcrumb segments
  const generateBreadcrumbs = () => {
    // Special case handling for dynamic routes
    let processedPathname = pathname
    const dynamicParams = Object.keys(query).filter(key => key !== 'slug')
    
    dynamicParams.forEach(param => {
      processedPathname = processedPathname.replace(`[${param}]`, query[param])
    })

    const segments = processedPathname.split('/')
      .filter(Boolean)
      .map((segment, i, arr) => {
        const path = `/${arr.slice(0, i + 1).join('/')}`
        
        // Get the route mapping or capitalize the segment
        let label = routeMap[path]
        
        // Handle dynamic routes with IDs
        if (!label && segment.match(/^[a-f0-9-]{36}$/)) {
          // This looks like a UUID - use the previous segment + "Details"
          const parentSegment = i > 0 ? arr[i-1] : ''
          label = parentSegment.charAt(0).toUpperCase() + parentSegment.slice(1) + ' Details'
        } else if (!label) {
          // Just capitalize the segment as fallback
          label = segment.charAt(0).toUpperCase() + segment.slice(1)
        }
        
        return { href: path, label }
      })
    
    // Add dashboard as first item
    const items = [
      { href: "/dashboard", label: "Dashboard" },
      ...segments.filter(segment => segment.href !== '/dashboard') // Remove duplicate dashboard
    ]
    
    // Mark the last item as the current page (no href)
    if (items.length > 0) {
      const lastItem = items[items.length - 1]
      
      // If we have a title parameter, use it for the last segment
      if (title && title.trim()) {
        lastItem.label = title
      }
      
      delete lastItem.href
    }
    
    return items
  }
  
  const items = generateBreadcrumbs()
  
  // If we're on the homepage or breadcrumbs are disabled, don't show them
  const shouldShowBreadcrumbs = showBreadcrumbs && pathname !== '/' && items.length > 0
  
  if (!shouldShowBreadcrumbs && !title) {
    return null
  }
  
  return (
    <header className="flex h-16 shrink-0 items-center border-b mb-4">
      <div className="flex items-center gap-2 px-2 flex-1">
        <SidebarTrigger className="-ml-1 md:hidden" />
        {shouldShowBreadcrumbs && (
          <>
            <Separator orientation="vertical" className="mr-2 h-6 hidden md:block" />
            <Breadcrumb>
              <BreadcrumbList>
                {items.length > ITEMS_TO_DISPLAY ? (
                  <>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href={items[0].href}>
                        {items[0].label}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      {isDesktop ? (
                        <DropdownMenu open={open} onOpenChange={setOpen}>
                          <DropdownMenuTrigger
                            className="flex items-center gap-1"
                            aria-label="Toggle menu"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {items.slice(1, -1).map((item, index) => (
                              <DropdownMenuItem key={index}>
                                <a href={item.href ? item.href : "#"} className="w-full">
                                  {item.label}
                                </a>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Drawer open={open} onOpenChange={setOpen}>
                          <DrawerTrigger aria-label="Toggle Menu">
                            <MoreHorizontal className="h-4 w-4" />
                          </DrawerTrigger>
                          <DrawerContent>
                            <DrawerHeader className="text-left">
                              <DrawerTitle>Navigate to</DrawerTitle>
                              <DrawerDescription>
                                Select a page to navigate to.
                              </DrawerDescription>
                            </DrawerHeader>
                            <div className="grid gap-1 px-4">
                              {items.slice(0, -1).map((item, index) => (
                                <a
                                  key={index}
                                  href={item.href ? item.href : "#"}
                                  className="py-1 text-sm"
                                >
                                  {item.label}
                                </a>
                              ))}
                            </div>
                            <DrawerFooter className="pt-4">
                              <DrawerClose asChild>
                                <Button variant="outline">Close</Button>
                              </DrawerClose>
                            </DrawerFooter>
                          </DrawerContent>
                        </Drawer>
                      )}
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </>
                ) : (
                  // If we have fewer items, just show them all
                  items.slice(0, -1).map((item, index) => (
                    <React.Fragment key={index}>
                      <BreadcrumbItem>
                        <BreadcrumbLink href={item.href}>
                          {item.label}
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                    </React.Fragment>
                  ))
                )}
                
                {/* Always show the current page */}
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {items[items.length - 1].label}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </>
        )}
        
        {/* If we don't have breadcrumbs but have a title, show it */}
        {!shouldShowBreadcrumbs && title && (
          <h1 className="text-xl font-semibold truncate ml-2">{title}</h1>
        )}
      </div>
      
      {/* Optional right-side actions */}
      <div className="flex-shrink-0 flex items-center gap-2 pr-2">
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <BellIcon className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>
      </div>
    </header>
  )
}