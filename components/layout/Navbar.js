"use client"

import Link from "next/link"
import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0"
import { useState } from "react"
// ProfileEditModal is now included in MainDashboardLayout
import Logo from "@/components/common/Logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useProfileData, useUpdateProfile } from "@/lib/airtable/hooks/useProfile"
import { toast } from "sonner"

const Navbar = () => {
  const router = useRouter()
  const { user, isLoading: userLoading } = useUser()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  
  // Use the React Query hook for profile data
  const { 
    data: profile, 
    isLoading: profileLoading,
    error: profileError 
  } = useProfileData()
  
  // Use the mutation hook for profile updates
  const updateProfileMutation = useUpdateProfile()
  
  // Combined loading state
  const isLoading = userLoading || profileLoading

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

  const handleOpenProfileModal = (e) => {
    e.preventDefault()
    setIsProfileModalOpen(true)
  }

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false)
  }

  const handleProfileUpdate = async (updatedData) => {
    try {
      // Use the mutation hook to update the profile
      await updateProfileMutation.mutateAsync(updatedData);
      
      // Close the modal on success
      setIsProfileModalOpen(false);
      
      // If we're on the dashboard, use a gentle approach - don't reload the whole page
      if (router.pathname === "/dashboard") {
        // Use router.replace for a shallow update
        router.replace(router.asPath, undefined, { shallow: true });
      }
      
      return updatedData;
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(err.message || "Failed to update profile");
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
                <Button 
                  onClick={(e) => {
                    e.preventDefault();
                    // Use a direct navigation instead of a link to prevent prefetching
                    window.location.href = "/auth/logout";
                  }}
                  variant="destructive" 
                  size="sm"
                >
                  Sign Out
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