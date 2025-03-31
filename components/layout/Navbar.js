"use client"

import Link from "next/link"
import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0"
import { useState, useEffect } from "react"
// ProfileEditModal is now included in MainDashboardLayout
import Logo from "@/components/common/Logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

const Navbar = () => {
  const router = useRouter()
  const { user, isLoading } = useUser()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const [isProfileLoading, setIsProfileLoading] = useState(false)

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map(n => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

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
    e.preventDefault()
    setIsProfileModalOpen(true)
  }

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false)
  }

  const handleProfileUpdate = async (updatedData) => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH", // Use PATCH instead of PUT to only update specified fields
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Explicitly include credentials for session auth
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }
      
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      
      // If we're on the dashboard, use a gentle approach - don't reload the whole page
      if (router.pathname === "/dashboard") {
        // Use queryClient to refetch data instead of full page reload
        // This is less disruptive than router.reload()
        router.replace(router.asPath, undefined, { shallow: true });
      }
      
      return updatedProfile;
    } catch (err) {
      console.error("Error updating profile:", err);
      throw err;
    }
  };

  return (
    <>
      <nav className="h-[70px] bg-background border-b w-full">
        <div className="max-w-[1200px] mx-auto px-4 h-full flex items-center justify-between">
          <Logo variant="horizontal" color="eden" height={36} />
          
          <div className="flex items-center gap-6">
            {isLoading ? (
              <span className="text-muted-foreground">Loading...</span>
            ) : user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className={`text-sm font-medium ${router.pathname.startsWith("/dashboard") && router.pathname !== "/dashboard/programs" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Dashboard
                </Link>
                <a 
                  href="#" 
                  onClick={handleOpenProfileModal} 
                  className={`text-sm font-medium ${router.pathname === "/profile" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Profile
                </a>
                <Button asChild variant="destructive" size="sm">
                  <Link href="/auth/logout">Sign Out</Link>
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={user.picture} 
                    alt={user.name || "Profile"} 
                  />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </>
            ) : (
              <Button asChild variant="default">
                <Link href="/login">Log In</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>
      
      {/* Modal is now handled by MainDashboardLayout */}
    </>
  )
}

export default Navbar