"use client"

import Link from "next/link"
import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useState } from "react"

import ProfileMenuButton from "./ProfileMenuButton"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet"

import { 
  Home,
  Compass,
  Users, 
  Menu, 
  ExternalLink,
  XCircle,
  LogOut
} from "lucide-react"

const DashboardSidebar = ({ profile, onEditClick }) => {
  const router = useRouter()
  const { user } = useUser()
  const [openMobile, setOpenMobile] = useState(false)

  // Hide navigation links for now as requested
  const links = []
  
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

  const renderNavLink = (link) => {
    const isActive = router.pathname === link.href || 
                    (link.href.startsWith('#') && router.asPath.includes(link.href))
    
    return (
      <Link
        key={link.label}
        href={link.href}
        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
          isActive 
            ? "bg-muted font-medium text-primary" 
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
        onClick={() => {
          if (link.href.startsWith('#')) {
            const element = document.getElementById(link.href.substring(1))
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' })
            }
            setOpenMobile(false)
          }
        }}
      >
        {link.icon}
        {link.label}
      </Link>
    )
  }
  
  const renderExternalLink = (link) => {
    // Special case for logout link
    if (link.label === "Sign Out") {
      return (
        <Link
          key={link.label}
          href={link.href}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {link.label}
          {link.icon}
        </Link>
      )
    }
    
    // Regular external links
    return (
      <a
        key={link.label}
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        {link.label}
        {link.icon}
      </a>
    )
  }

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="px-6 py-3 border-b flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-primary">
          xFoundry Hub
        </h2>
      </div>
      
      {/* Profile Section */}
      {profile && <ProfileMenuButton user={user} profile={profile} onEditClick={onEditClick} />}
      
      {/* Navigation Links */}
      <div className="px-3 py-5">
        <p className="text-xs font-medium text-muted-foreground mb-2 pl-3">
          NAVIGATION
        </p>
        <div className="space-y-1">
          {links.map(renderNavLink)}
        </div>
      </div>
      
      {/* External Links */}
      <div className="px-3 py-2 border-t mt-auto">
        <p className="text-xs font-medium text-muted-foreground mb-2 pl-3">
          LINKS
        </p>
        <div className="space-y-1">
          {externalLinks.map(renderExternalLink)}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Trigger */}
      <Button
        variant="outline"
        size="icon"
        className="md:hidden fixed left-4 top-3 z-40"
        onClick={() => setOpenMobile(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      {/* Mobile Sidebar */}
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="left" className="p-0 max-w-[300px] shadow-md">
          {renderSidebarContent()}
        </SheetContent>
      </Sheet>
      
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen w-64 flex-col border-r bg-background fixed left-0 top-0 overflow-y-auto">
        {renderSidebarContent()}
      </div>
    </>
  )
}

export default DashboardSidebar