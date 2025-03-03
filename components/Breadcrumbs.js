"use client"

import { useRouter } from "next/router"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { HomeIcon, ChevronRight } from "lucide-react"

const routeMap = {
  '/dashboard': 'Dashboard',
  '/profile': 'Profile',
  '/settings': 'Settings',
}

const Breadcrumbs = () => {
  const router = useRouter()
  const { pathname } = router
  
  // If we're on the homepage, don't render breadcrumbs
  if (pathname === '/') return null
  
  // Generate breadcrumb segments
  const generateBreadcrumbs = () => {
    const segments = pathname.split('/')
      .filter(Boolean)
      .map((segment, i, arr) => {
        const path = `/${arr.slice(0, i + 1).join('/')}`
        const label = routeMap[path] || segment.charAt(0).toUpperCase() + segment.slice(1)
        const isLast = i === arr.length - 1
        
        return { path, label, isLast }
      })
    
    return segments
  }
  
  const breadcrumbs = generateBreadcrumbs()
  
  return (
    <Breadcrumb className="mb-6 animate-fadeInUp">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">
              <HomeIcon className="h-3.5 w-3.5" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {breadcrumbs.map((crumb, i) => (
          <BreadcrumbItem key={i}>
            <BreadcrumbSeparator>
              <ChevronRight className="h-3.5 w-3.5" />
            </BreadcrumbSeparator>
            {crumb.isLast ? (
              <BreadcrumbLink className="font-medium">
                {crumb.label}
              </BreadcrumbLink>
            ) : (
              <BreadcrumbLink asChild>
                <Link href={crumb.path}>{crumb.label}</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export default Breadcrumbs