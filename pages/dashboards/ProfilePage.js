"use client"

import { useState } from "react"
import { useDashboard } from "@/contexts/DashboardContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Mail, School, MapPin, Smartphone } from "lucide-react"
import ProfileEditModal from "@/components/ProfileEditModal"

export default function ProfilePage({ onNavigate }) {
  const { profile, user, isLoading, error, handleProfileUpdate, refreshData } = useDashboard()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <h3 className="text-xl font-medium">Loading profile information...</h3>
          <p className="text-muted-foreground">Please wait while we fetch your data</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4">
            <h3 className="text-lg font-medium">Error Loading Profile</h3>
            <p>{error}</p>
          </div>
          <Button onClick={() => refreshData('profile')}>Retry</Button>
          <Button variant="outline" className="ml-2" onClick={() => onNavigate('dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }
  
  const handleEditClick = () => {
    setIsEditModalOpen(true)
  }
  
  const handleEditClose = () => {
    setIsEditModalOpen(false)
  }
  
  return (
    <div className="profile-page space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information and preferences
          </p>
        </div>
        <Button onClick={handleEditClick}>
          Edit Profile
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <div className="col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Profile Summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4 border-2 border-primary">
                <AvatarImage src={user?.picture} alt={profile?.firstName} />
                <AvatarFallback>
                  {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <h2 className="text-xl font-semibold mb-1">
                {profile?.firstName} {profile?.lastName}
              </h2>
              
              <p className="text-muted-foreground mb-4">
                {profile?.role || "Student"}
              </p>
              
              <div className="space-y-3 w-full text-left">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user?.email}</span>
                </div>
                
                {profile?.institutionName && (
                  <div className="flex items-center gap-2">
                    <School className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.institutionName}</span>
                  </div>
                )}
                
                {profile?.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.location}</span>
                  </div>
                )}
                
                {profile?.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.phoneNumber}</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                {profile?.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
                {!profile?.tags?.length && (
                  <Badge variant="outline">No tags added</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Profile Details */}
        <div className="col-span-1 md:col-span-2">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="programs">Programs</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>
            
            {/* Details Tab */}
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                  <CardDescription>
                    Your personal information and academic details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">First Name</div>
                        <div>{profile?.firstName || "Not provided"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Last Name</div>
                        <div>{profile?.lastName || "Not provided"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Email</div>
                        <div>{user?.email || "No email available"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Phone Number</div>
                        <div>{profile?.phoneNumber || "Not provided"}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium mb-2">Academic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Institution</div>
                        <div>{profile?.institutionName || "Not provided"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Major</div>
                        <div>{profile?.major || "Not provided"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Graduation Year</div>
                        <div>{profile?.graduationYear || "Not provided"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Student ID</div>
                        <div>{profile?.studentId || "Not provided"}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium mb-2">Bio</h3>
                    <p className="text-sm text-muted-foreground">{profile?.bio || "No bio provided"}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Programs Tab */}
            <TabsContent value="programs">
              <Card>
                <CardHeader>
                  <CardTitle>Programs & Participation</CardTitle>
                  <CardDescription>
                    Programs you're enrolled in and your participation records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile?.cohorts && profile.cohorts.length > 0 ? (
                      profile.cohorts.map((cohort, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{cohort.initiativeDetails?.name || "Program"}</h3>
                            <Badge>{cohort.status || "Active"}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {cohort.description || "No description available"}
                          </p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => onNavigate('program')}>
                              View Program
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>You're not enrolled in any programs yet.</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => onNavigate('dashboard')}
                        >
                          Browse Available Programs
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Account Preferences</CardTitle>
                  <CardDescription>
                    Manage your notification settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium mb-3">Notification Preferences</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm">Email Notifications</div>
                          <Button size="sm" variant="outline">Manage</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm">SMS Notifications</div>
                          <Button size="sm" variant="outline">Manage</Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-medium mb-3">Privacy Settings</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm">Profile Visibility</div>
                          <Button size="sm" variant="outline">Manage</Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm">Data Sharing Preferences</div>
                          <Button size="sm" variant="outline">Manage</Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-medium mb-3">Account Management</h3>
                      <div className="space-y-4">
                        <Button variant="outline" className="w-full">
                          Change Password
                        </Button>
                        <Button variant="destructive" className="w-full">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {isEditModalOpen && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={handleEditClose}
          profile={profile}
          onSave={handleProfileUpdate}
        />
      )}
    </div>
  )
}