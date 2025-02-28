"use client"

import Link from "next/link"
import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"

import { 
  Home,
  Compass,
  Users, 
  User,
  LogOut, 
  Menu, 
  ExternalLink,
  Edit,
  CheckCircle,
  XCircle
} from "lucide-react"

const DashboardSidebar = ({ profile }) => {
  const router = useRouter()
  const { user } = useUser()
  const [openMobile, setOpenMobile] = useState(false)

  const getInitials = () => {
    if (!user?.name) return "U"
    return user.name
      .split(" ")
      .map(n => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }

  const isProfileComplete = profile?.isProfileComplete || false

  const links = [
    {
      href: "/dashboard",
      label: "Hub",
      icon: <Home className="h-5 w-5" />
    },
    {
      href: "#programs",
      label: "Programs",
      icon: <Compass className="h-5 w-5" />
    },
    {
      href: "#teams",
      label: "My Team",
      icon: <Users className="h-5 w-5" />
    }
  ]
  
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
  
  const renderExternalLink = (link) => (
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

  const renderProfileSection = () => (
    <div className="px-3 pb-5 border-b">
      <div className="flex flex-col items-center pt-5">
        <Avatar className="h-20 w-20 mb-3">
          <AvatarImage src={user?.picture} alt={user?.name || "Profile"} />
          <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
        </Avatar>
        
        <div className="text-center mb-2">
          <h3 className="font-semibold">{profile?.firstName} {profile?.lastName}</h3>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        
        <div className="w-full">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium">Profile Status</span>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <Edit className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Edit</span>
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-2 text-xs mb-2">
            {isProfileComplete ? (
              <Badge variant="outline" className="flex items-center gap-1 w-full justify-center py-1 bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3" />
                Complete
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1 w-full justify-center py-1 bg-amber-50 text-amber-700 border-amber-200">
                <XCircle className="h-3 w-3" />
                Incomplete
              </Badge>
            )}
          </div>
          
          <div className="text-xs space-y-1 mt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Institution</span>
              <span className="font-medium">{profile?.institutionName || "Not specified"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Degree</span>
              <span className="font-medium">{profile?.degreeType || "Not specified"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Graduation</span>
              <span className="font-medium">{profile?.graduationYear || "Not specified"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="px-6 py-3 border-b flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-primary">
          xFoundry Hub
        </h2>
        
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpenMobile(false)}>
            <XCircle className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Profile Section */}
      {profile && renderProfileSection()}
      
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
      
      {/* Sign Out */}
      <div className="px-3 py-4 border-t">
        <Link
          href="/api/auth/logout"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed left-4 top-3 z-40"
        onClick={() => setOpenMobile(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      {/* Mobile Sidebar */}
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="left" className="p-0 max-w-[300px]">
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