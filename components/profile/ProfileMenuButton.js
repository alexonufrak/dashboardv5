"use client"

import { useState } from "react"
import Link from "next/link"
import { useDashboard } from "@/contexts/DashboardContext"
import { Dialog } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  User, 
  Settings, 
  LogOut, 
  Edit,
  CheckCircle,
  XCircle,
  ExternalLink
} from "lucide-react"
import ProfileEditModal from "./ProfileEditModal.refactored"

const ProfileMenuButton = ({ user, profile, onEditClick }) => {
  // Import dashboard context to access modal state
  const { setIsEditModalOpen } = useDashboard()
  
  const getInitials = () => {
    if (!user?.name) return "U"
    return user.name
      .split(" ")
      .map(n => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }
  
  // State for the local dialog if context is not available
  const [localDialogOpen, setLocalDialogOpen] = useState(false);
  
  // Handle edit profile click - use context if available, otherwise use local state
  const handleEditClick = (e) => {
    e.preventDefault();
    
    // Try context first, then fallback to prop function, then local state
    if (typeof setIsEditModalOpen === 'function') {
      setIsEditModalOpen(true);
    } else if (typeof onEditClick === 'function') {
      onEditClick();
    } else {
      // Use local state as last resort
      setLocalDialogOpen(true);
    }
  }

  const isProfileComplete = profile?.isProfileComplete || false
  const institutionName = profile?.institutionName || profile?.institution?.name || "Your Institution"
  
  // Get institution website URL
  const getInstitutionUrl = () => {
    if (!profile?.institution?.webPages) return null
    const urls = profile.institution.webPages.split(',')
    return urls[0].trim()
  }
  
  const institutionUrl = getInstitutionUrl()

  return (
    <>
      <div className="px-3 pb-5 border-b">
        <div className="flex flex-col items-center pt-5">
          {/* Institution Badge */}
          {profile?.institution && (
            <Badge 
              variant="outline" 
              className="mb-4 py-1 px-3 bg-primary/5 hover:bg-primary/10"
            >
              {institutionUrl ? (
                <a 
                  href={institutionUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  {institutionName}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              ) : (
                institutionName
              )}
            </Badge>
          )}
          
          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0 h-auto rounded-full hover:bg-transparent">
                <Avatar className="h-20 w-20 ring-2 ring-offset-2 ring-background ring-muted cursor-pointer hover:ring-primary">
                  <AvatarImage src={user?.picture} alt={user?.name || "Profile"} />
                  <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.firstName} {profile?.lastName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleEditClick}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit Profile</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="text-center my-3">
            <h3 className="font-semibold">{profile?.firstName} {profile?.lastName}</h3>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          
          <div className="w-full">
            {!isProfileComplete && (
              <div className="flex items-center gap-2 text-xs mb-3">
                <Badge variant="outline" className="flex items-center gap-1 w-full justify-center py-1 bg-amber-50 text-amber-700 border-amber-200">
                  <XCircle className="h-3 w-3" />
                  Profile Incomplete
                </Badge>
              </div>
            )}
            
            <Button 
              onClick={handleEditClick}
              className="w-full"
              size="sm"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </div>
      </div>
      
      {/* Local dialog fallback if context is not available */}
      {profile && (
        <Dialog 
          open={localDialogOpen} 
          onOpenChange={setLocalDialogOpen}
        >
          <ProfileEditModal 
            profile={profile}
            onClose={() => setLocalDialogOpen(false)}
            onSave={() => {
              setLocalDialogOpen(false);
              window.location.reload(); // Simple refresh after saving
            }}
          />
        </Dialog>
      )}
    </>
  )
}

export default ProfileMenuButton