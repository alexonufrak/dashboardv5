"use client"

import Link from "next/link"
import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useState, useEffect } from "react"
import ProfileEditModal from "./ProfileEditModal"
import { Button } from "./ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from "./ui/dropdown-menu"
import { ThemeToggle } from "./ui/theme-toggle"
import { LogOut, User, LayoutDashboard } from "lucide-react"

const Navbar = () => {
  const router = useRouter()
  const { user, isLoading } = useUser()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const [isProfileLoading, setIsProfileLoading] = useState(false)

  // Fetch user profile when needed
  useEffect(() => {
    const fetchProfile = async () => {
      if (user && isProfileModalOpen && !profile) {
        setIsProfileLoading(true)
        try {
          const response = await fetch("/api/user/profile")
          if (response.ok) {
            const data = await response.json()
            setProfile(data)
          }
        } catch (error) {
          console.error("Error fetching profile:", error)
        } finally {
          setIsProfileLoading(false)
        }
      }
    }
    
    fetchProfile()
  }, [user, isProfileModalOpen, profile])

  const handleOpenProfileModal = (e) => {
    e && e.preventDefault()
    setIsProfileModalOpen(true)
  }

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false)
  }

  const handleProfileUpdate = async (updatedData) => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }
      
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      
      // If we're on the dashboard, refresh the page to show updated data
      if (router.pathname === "/dashboard") {
        router.reload();
      }
      
      return updatedProfile;
    } catch (err) {
      console.error("Error updating profile:", err);
      throw err;
    }
  };

  return (
    <>
      <nav className="w-full h-16 border-b border-border bg-background">
        <div className="container h-full flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">
            xFoundry
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {isLoading ? (
              <span className="text-sm text-muted-foreground">Loading...</span>
            ) : user ? (
              <>
                <div className="hidden sm:flex items-center gap-4">
                  <Link href="/dashboard" className={router.pathname === "/dashboard" ? "text-primary font-medium" : "text-foreground hover:text-primary transition-colors"}>
                    Dashboard
                  </Link>
                  <Button variant="ghost" onClick={handleOpenProfileModal} className={router.pathname === "/profile" ? "text-primary font-medium" : ""}>
                    Profile
                  </Button>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-0 h-8 w-8 rounded-full">
                      <Avatar>
                        {user.picture ? (
                          <AvatarImage src={user.picture} alt={user.name || "User"} />
                        ) : (
                          <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
                        )}
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="px-2 py-1.5 text-sm font-medium">{user.name || user.email}</div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="sm:hidden">
                      <Link href="/dashboard" className="flex items-center cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleOpenProfileModal} className="sm:hidden cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="sm:hidden" />
                    <DropdownMenuItem asChild>
                      <Link href="/api/auth/logout" className="flex items-center cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign Out</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild variant="default">
                <Link href="/login">
                  Log In
                </Link>
              </Button>
            )}
          </div>
        </div>
      </nav>
      
      {isProfileModalOpen && (
        <ProfileEditModal 
          isOpen={isProfileModalOpen} 
          onClose={handleCloseProfileModal} 
          profile={profile}
          onSave={handleProfileUpdate}
        />
      )}
    </>
  )
}

export default Navbar