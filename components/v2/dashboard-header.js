"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Bell, Menu, Search } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "../ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Input } from "../ui/input";
import { useEffect, useState } from "react";
import { useIsMobile } from "../hooks/use-mobile";

/**
 * Dashboard Header Component
 * Displays the main navigation header with user profile menu and search
 */
export function DashboardHeader({ userProfile }) {
  const { user } = useUser();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Track scroll position to add shadow when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Generate user initials for avatar fallback
  const getUserInitials = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}`;
    }
    
    if (user?.name) {
      const nameParts = user.name.split(" ");
      if (nameParts.length >= 2) {
        return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`;
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    
    return "XF";
  };

  return (
    <header 
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur transition-shadow duration-200 ${
        isScrolled ? "shadow-md" : ""
      }`}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo and mobile menu */}
        <div className="flex items-center gap-2">
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px]">
                <nav className="flex flex-col gap-4 py-4">
                  <Link 
                    href="/dashboard" 
                    className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/profile" 
                    className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent"
                  >
                    My Profile
                  </Link>
                  {/* Add more mobile navigation links here */}
                </nav>
              </SheetContent>
            </Sheet>
          )}
          
          <Link href="/dashboard" className="flex items-center gap-2">
            <img 
              src="/logos/X Icon Blue.svg" 
              alt="xFoundry Logo" 
              className="h-8 w-8"
            />
            <span className="text-xl font-semibold hidden md:inline-block">
              xFoundry
            </span>
          </Link>
        </div>
        
        {/* Search bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full pl-8 bg-accent/50 border-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        
        {/* Right side navigation */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.picture} alt={user?.name || "User"} />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userProfile?.firstName} {userProfile?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">My Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/api/auth/logout">Sign Out</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}