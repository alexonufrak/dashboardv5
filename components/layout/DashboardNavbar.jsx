"use client"

import React from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useDashboard } from '@/contexts/DashboardContext'
import { useUser } from '@auth0/nextjs-auth0/client'
import { ROUTES, isProgramRoute, getProgramIdFromUrl } from '@/lib/routing'
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile' 
import { BellIcon, Search, MoreHorizontal, LogOut, Edit, Settings, User, Moon, Sun } from 'lucide-react'

// Enhanced route map with display names for breadcrumbs
const routeMap = {
  '/': 'Home',
  '/dashboard': 'Dashboard',
  '/dashboard/programs': 'Programs',
  '/dashboard/program': 'Program',
  '/dashboard/program/[programId]': 'Program Details',
  '/dashboard/program/[programId]/milestones': 'Milestones',
  '/dashboard/program/[programId]/team': 'Team',
  '/dashboard/program/[programId]/bounties': 'Bounties',
  '/dashboard/programs/apply/[cohortId]': 'Program Application',
  '/dashboard/profile': 'Profile',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/program': 'Programs',
  '/program/[programId]': 'Program Details',
  // Legacy routes
  '/program-dashboard': 'Program Dashboard',
}

const ITEMS_TO_DISPLAY = 3

/**
 * Dashboard navigation bar component with breadcrumbs and page title
 * Follows the sidebar-08 shadcn example pattern
 * Enhanced with existing navigation functionality
 */
export function DashboardNavbar({ title, showBreadcrumbs = true }) {
  const [open, setOpen] = React.useState(false)
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
  const isMobile = useIsMobile()
  const isDesktop = !isMobile
  const router = useRouter()
  const { pathname, query } = router
  const { user } = useUser()
  
  // Access the dashboard context for user profile and navigation data
  const { 
    profile, 
    isLoading,
    participationData,
    setIsEditModalOpen,
    updateProfile 
  } = useDashboard()
  
  // Handle theme
  const [theme, setTheme] = React.useState('light')
  
  // Get initial theme on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check both localStorage and class presence for theme
      const savedTheme = localStorage.getItem('theme')
      const isDarkMode = document.documentElement.classList.contains('dark')
      setTheme(savedTheme === 'dark' || isDarkMode ? 'dark' : 'light')
    }
  }, [])
  
  // Toggle theme with consistent approach
  const toggleTheme = React.useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    
    if (typeof window !== 'undefined') {
      // Update DOM
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      
      // Save preference
      localStorage.setItem('theme', newTheme)
    }
    
    setTheme(newTheme)
  }, [theme])
  
  // Navigation helper functions 
  const navigateTo = React.useCallback((url) => {
    router.push(url, undefined, { shallow: true })
  }, [router])
  
  // Prefetch common routes for faster navigation
  React.useEffect(() => {
    // Common routes that should be prefetched
    const routesToPrefetch = [
      ROUTES.DASHBOARD,
      ROUTES.PROGRAMS,
      ROUTES.PROFILE
    ]
    
    // Add program routes if available
    if (participationData?.participation) {
      participationData.participation.forEach(p => {
        if (p.cohort?.initiativeDetails?.id) {
          routesToPrefetch.push(ROUTES.PROGRAM.DETAIL(p.cohort.initiativeDetails.id))
        }
      })
    }
    
    // Prefetch all routes
    routesToPrefetch.forEach(route => {
      router.prefetch(route)
    })
  }, [router, participationData])
  
  // Check if we're on a program page
  const programId = isProgramRoute(router) ? getProgramIdFromUrl(router) : null
  
  // Get program name for breadcrumbs if available
  const programName = React.useMemo(() => {
    if (!programId || !participationData?.participation) return null
    
    const program = participationData.participation.find(p => 
      p.cohort?.initiativeDetails?.id === programId
    )
    
    return program?.cohort?.initiativeDetails?.name || null
  }, [programId, participationData])
  
  // Generate breadcrumb segments with enhanced context awareness
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
        
        // Handle program routes specially with real program names
        if (i > 0 && arr[i-1] === 'program' && programName) {
          label = programName
        }
        // Handle dynamic routes with IDs
        else if (!label && segment.match(/^[a-f0-9-]{36}$/)) {
          // This looks like a UUID - use the previous segment + "Details"
          const parentSegment = i > 0 ? arr[i-1] : ''
          
          // Special handling for program IDs with actual names
          if (parentSegment === 'program' && programName) {
            label = programName
          } else {
            label = parentSegment.charAt(0).toUpperCase() + parentSegment.slice(1) + ' Details'
          }
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
  
  // If there's nothing to show, don't render
  if (!shouldShowBreadcrumbs && !title) {
    return null
  }
  
  return (
    <header className="flex h-16 shrink-0 items-center border-b mb-4">
      <div className="flex items-center gap-2 px-2 flex-1">
        <SidebarTrigger className="-ml-1 md:hidden" aria-label="Toggle navigation sidebar" />
        {shouldShowBreadcrumbs && (
          <>
            <Separator orientation="vertical" className="mr-2 h-6 hidden md:block" />
            <Breadcrumb>
              <BreadcrumbList>
                {items.length > ITEMS_TO_DISPLAY ? (
                  <>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href={items[0].href} onClick={(e) => {
                        e.preventDefault()
                        navigateTo(items[0].href)
                      }}>
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
                              <DropdownMenuItem key={index} asChild>
                                <Link 
                                  href={item.href ? item.href : "#"} 
                                  className="w-full cursor-pointer"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    navigateTo(item.href)
                                    setOpen(false)
                                  }}
                                >
                                  {item.label}
                                </Link>
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
                                <Link
                                  key={index}
                                  href={item.href ? item.href : "#"}
                                  className="py-1 text-sm"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    navigateTo(item.href)
                                    setOpen(false)
                                  }}
                                >
                                  {item.label}
                                </Link>
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
                        <BreadcrumbLink 
                          href={item.href}
                          onClick={(e) => {
                            e.preventDefault()
                            navigateTo(item.href)
                          }}
                        >
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
      
      {/* Right-side actions with user profile */}
      <div className="flex-shrink-0 flex items-center gap-2 pr-2">
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Search">
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>
        
        {/* User profile dropdown */}
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full h-9 w-9"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={profile?.picture || user?.picture} 
                  alt={`${profile?.firstName || ''} ${profile?.lastName || user?.name || 'User'}`} 
                />
                <AvatarFallback aria-hidden="true">
                  {profile?.firstName?.[0]}{profile?.lastName?.[0] || 
                   (user?.name ? user.name.split(" ").map(n => n?.[0] || '').join("").slice(0, 2) : "U")}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {profile?.firstName} {profile?.lastName || (user?.name || "User")}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || profile?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Navigation items */}
            <DropdownMenuItem onClick={() => navigateTo(ROUTES.PROFILE)}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => setIsEditModalOpen?.(true)}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit Profile</span>
            </DropdownMenuItem>
            
            {/* Theme switcher */}
            <DropdownMenuItem onClick={toggleTheme}>
              {theme === 'light' ? (
                <>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light Mode</span>
                </>
              )}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Logout button */}
            <DropdownMenuItem asChild>
              <Link href="/api/auth/logout">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}