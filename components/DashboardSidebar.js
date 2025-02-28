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

import { 
  LayoutDashboard, 
  User, 
  Users, 
  BookOpen, 
  Calendar, 
  Settings, 
  LogOut, 
  Menu, 
  MessageSquare,
  Bell
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

  const links = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      href: "/profile",
      label: "Profile",
      icon: <User className="h-5 w-5" />
    },
    {
      href: "#teams",
      label: "My Team",
      icon: <Users className="h-5 w-5" />
    },
    {
      href: "#programs",
      label: "Programs",
      icon: <BookOpen className="h-5 w-5" />
    },
    {
      href: "#calendar",
      label: "Calendar",
      icon: <Calendar className="h-5 w-5" />
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

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-8 mt-2">
          <h2 className="text-lg font-semibold tracking-tight">
            xFoundry
          </h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary"></span>
            </Button>
            <Button variant="ghost" size="icon">
              <MessageSquare className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="mb-4 flex items-center gap-4 px-1">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.picture} alt={user?.name || "User"} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h3 className="text-sm font-medium leading-none">
              {user?.name || "User"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {user?.email || ""}
            </p>
          </div>
        </div>
        
        <Separator className="mb-4" />
        
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-2 pl-3">
            MENU
          </p>
          {links.map(renderNavLink)}
        </div>
      </div>
      
      <div className="mt-auto px-3 py-2">
        <Separator className="mb-4" />
        <div className="space-y-1">
          <Link
            href="/api/auth/logout"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Link>
        </div>
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
        <SheetContent side="left" className="p-0">
          {renderSidebarContent()}
        </SheetContent>
      </Sheet>
      
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen w-64 flex-col border-r bg-background fixed left-0 top-0">
        {renderSidebarContent()}
      </div>
    </>
  )
}

export default DashboardSidebar