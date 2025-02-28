"use client"

import { useState } from "react"
import Link from "next/link"
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

const ProfileMenuButton = ({ user, profile, onEditClick }) => {
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
  const institutionName = profile?.institutionName || profile?.institution?.name || "Your Institution"
  
  // Get institution website URL
  const getInstitutionUrl = () => {
    if (!profile?.institution?.webPages) return null
    const urls = profile.institution.webPages.split(',')
    return urls[0].trim()
  }
  
  const institutionUrl = getInstitutionUrl()

  return (
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
            <DropdownMenuItem onClick={onEditClick}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              <Link href="/api/auth/logout" className="w-full">
                Sign Out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="text-center my-3">
          <h3 className="font-semibold">{profile?.firstName} {profile?.lastName}</h3>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        
        <div className="w-full">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium">Profile Status</span>
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onEditClick}>
              <Edit className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Edit</span>
            </Button>
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
}

export default ProfileMenuButton