"use client";

import { useRouter } from "next/router";
import Link from "next/link";
import { cn } from "../../lib/utils";
import { useIsMobile } from "../hooks/use-mobile";
import { useDashboard } from "../../contexts/DashboardContext";
import {
  Home,
  Users,
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  LayoutDashboard,
  Settings,
  BarChart,
  FileText,
  Rocket,
  BookMarked,
  Lightbulb
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

/**
 * PROTOTYPE Dashboard Sidebar Component
 * Provides navigation and program access for the dashboard v2 prototype
 * Note: This is a prototype component and not used in production
 */
export function DashboardSidebarPrototype({ userProfile }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { setIsEditModalOpen } = useDashboard();
  
  // Skip rendering on mobile as we use a sheet in the header
  if (isMobile) {
    return null;
  }
  
  // Main navigation links
  const mainNavLinks = [
    {
      name: "Dashboard",
      href: "/dashboard-v2",
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: "Active Programs",
      href: "/dashboard-v2/programs",
      icon: <LayoutDashboard className="h-5 w-5" />,
      badge: {
        text: "3",
        variant: "default"
      }
    },
    {
      name: "My Teams",
      href: "/dashboard-v2/teams",
      icon: <Users className="h-5 w-5" />,
      badge: {
        text: "2",
        variant: "default"
      }
    },
    {
      name: "Points & Progress",
      href: "/dashboard-v2/points",
      icon: <Award className="h-5 w-5" />,
    },
    {
      name: "Deliverables",
      href: "/dashboard-v2/deliverables",
      icon: <FileText className="h-5 w-5" />,
      badge: {
        text: "3",
        variant: "outline"
      }
    },
    {
      name: "Opportunities",
      href: "/dashboard-v2/opportunities",
      icon: <Rocket className="h-5 w-5" />,
      badge: {
        text: "New",
        variant: "outline"
      }
    },
    {
      name: "Calendar",
      href: "/dashboard-v2/calendar",
      icon: <Calendar className="h-5 w-5" />,
    },
  ];
  
  // Program category links
  const programLinks = [
    {
      name: "Xperience",
      href: "/dashboard-v2/programs?type=xperience",
      icon: <Briefcase className="h-5 w-5" />,
      color: "text-blue-500"
    },
    {
      name: "Xperiment",
      href: "/dashboard-v2/programs?type=xperiment",
      icon: <BookOpen className="h-5 w-5" />,
      color: "text-green-500"
    },
    {
      name: "Xtrapreneurs",
      href: "/dashboard-v2/programs?type=xtrapreneurs",
      icon: <Lightbulb className="h-5 w-5" />,
      color: "text-amber-500"
    },
    {
      name: "Horizons",
      href: "/dashboard-v2/programs?type=horizons",
      icon: <Rocket className="h-5 w-5" />,
      color: "text-purple-500"
    },
  ];
  
  // Utility links
  const utilityLinks = [
    {
      name: "Resources",
      href: "/dashboard/resources",
      icon: <BookMarked className="h-5 w-5" />,
    },
    {
      name: "Reports",
      href: "/dashboard/reports",
      icon: <BarChart className="h-5 w-5" />,
    },
    {
      name: "Documents",
      href: "/dashboard/documents",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  // Check if link is active
  const isActiveLink = (href) => {
    if (href === "/dashboard" && router.pathname === "/dashboard") {
      return true;
    }
    return router.pathname.startsWith(href) && href !== "/dashboard";
  };

  // Render navigation link
  const renderNavLink = (link) => {
    const active = isActiveLink(link.href);
    
    return (
      <TooltipProvider key={link.name}>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Link
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active 
                  ? "bg-accent text-accent-foreground" 
                  : "hover:bg-accent/50 text-muted-foreground hover:text-foreground",
                link.color
              )}
            >
              {link.icon}
              <span>{link.name}</span>
              {link.badge && (
                <Badge 
                  variant={link.badge.variant} 
                  className="ml-auto text-xs"
                >
                  {link.badge.text}
                </Badge>
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" align="center">
            {link.name}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <aside className="hidden border-r bg-background md:block md:w-64 lg:w-72">
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="flex flex-col gap-2 p-4">
          {/* User Profile Card */}
          {userProfile && (
            <div className="mb-2 flex flex-col items-center space-y-2 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
              <Avatar className="h-16 w-16">
                <AvatarImage src={userProfile.picture || "/placeholder-user.jpg"} />
                <AvatarFallback>{userProfile.firstName?.[0]}{userProfile.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-sm font-medium">
                  {userProfile.firstName} {userProfile.lastName}
                </h3>
                <p className="text-xs text-muted-foreground">{userProfile.institutionName || "Student"}</p>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="flex flex-col items-center">
                  <span className="font-medium">330</span>
                  <span className="text-muted-foreground">Points</span>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="flex flex-col items-center">
                  <span className="font-medium">3</span>
                  <span className="text-muted-foreground">Programs</span>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="flex flex-col items-center">
                  <span className="font-medium">2</span>
                  <span className="text-muted-foreground">Teams</span>
                </div>
              </div>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setIsEditModalOpen(true);
                }}
                className="text-xs text-primary hover:underline"
              >
                View Profile
              </a>
            </div>
          )}

          {/* Main Navigation */}
          <div className="py-2">
            <h3 className="mb-2 px-3 text-xs font-medium text-muted-foreground">
              NAVIGATION
            </h3>
            <nav className="flex flex-col gap-1">
              {mainNavLinks.map(renderNavLink)}
            </nav>
          </div>

          {/* Programs */}
          <div className="py-2">
            <h3 className="mb-2 px-3 text-xs font-medium text-muted-foreground">
              PROGRAMS
            </h3>
            <nav className="flex flex-col gap-1">
              {programLinks.map(renderNavLink)}
            </nav>
          </div>

          {/* Utilities */}
          <div className="py-2">
            <h3 className="mb-2 px-3 text-xs font-medium text-muted-foreground">
              UTILITIES
            </h3>
            <nav className="flex flex-col gap-1">
              {utilityLinks.map(renderNavLink)}
            </nav>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}