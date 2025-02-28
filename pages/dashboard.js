"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useEffect, useState } from "react"
import dynamic from 'next/dynamic'
import { toast } from "sonner"

// Import components
import Layout from "../components/Layout"
import ProfileCard from "../components/ProfileCard"
import ProfileEditModal from "../components/ProfileEditModal"
import TeamCard from "../components/TeamCard"
import { FilloutPopupEmbed } from "@fillout/react"

// Import UI components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

// Import icons
import { 
  BookOpen, 
  Users, 
  UserCircle, 
  BellRing, 
  Terminal, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle 
} from "lucide-react"

// Import the OnboardingChecklist component dynamically to avoid hook issues
const OnboardingChecklist = dynamic(
  () => import('../components/OnboardingChecklist'),
  { ssr: false }
)

const Dashboard = () => {
  // All React hooks must be called at the top level
  const { user, isLoading: isUserLoading } = useUser()
  const [profile, setProfile] = useState(null)
  const [teamData, setTeamData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTeamLoading, setIsTeamLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [activeFilloutForm, setActiveFilloutForm] = useState(null)
  const [dashboardContent, setDashboardContent] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/user/profile")
        if (!response.ok) {
          throw new Error("Failed to fetch profile")
        }
        const data = await response.json()
        setProfile(data)
      } catch (err) {
        setError(err.message)
        toast.error("Failed to load your profile")
      } finally {
        setIsLoading(false)
      }
    }

    const fetchTeamData = async () => {
      try {
        const response = await fetch("/api/user/team")
        if (!response.ok) {
          throw new Error("Failed to fetch team data")
        }
        const data = await response.json()
        setTeamData(data.team)
      } catch (err) {
        console.error("Error fetching team data:", err)
        toast.error("Failed to load team information")
      } finally {
        setIsTeamLoading(false)
      }
    }

    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch("/api/user/metadata")
        if (response.ok) {
          const metadata = await response.json()
          if (metadata.onboardingCompleted || metadata.onboardingSkipped) {
            setDashboardContent(true)
          }
        }
      } catch (err) {
        console.error("Error checking onboarding status:", err)
        // If there's an error, we'll default to showing the onboarding
      }
    }

    if (user) {
      fetchProfile()
      fetchTeamData()
      checkOnboardingStatus()
    }
  }, [user])

  // Show loading screen while data is loading
  if (isUserLoading || isLoading) {
    return (
      <Layout title="xFoundry Dashboard">
        <div className="flex flex-col gap-6 mt-10">
          <Skeleton className="h-[50px] w-[250px]" />
          
          <div className="flex flex-col gap-6">
            <Skeleton className="h-[250px] w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-[150px] rounded-xl" />
              <Skeleton className="h-[150px] rounded-xl" />
              <Skeleton className="h-[150px] rounded-xl" />
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Show error message if there's an error
  if (error) {
    return (
      <Layout title="xFoundry Dashboard">
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}. Please try refreshing the page or contact support if the issue persists.
          </AlertDescription>
        </Alert>
      </Layout>
    )
  }
  
  // Handler functions
  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };
  
  const handleEditClose = () => {
    setIsEditModalOpen(false);
  };
  
  const handleProfileUpdate = async (updatedData) => {
    try {
      setIsUpdating(true);
      
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
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(err.message || "Failed to update profile");
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to render individual cohort cards
  const renderCohortCard = (cohort) => {
    const initiativeName = cohort.initiativeDetails?.name || "Unknown Initiative";
    const topics = cohort.topicNames || [];
    const classes = cohort.classNames || [];
    const status = cohort["Status"] || "Unknown";
    const actionButtonText = cohort["Action Button"] || "Apply Now";
    const filloutFormId = cohort["Application Form ID (Fillout)"];
    const isOpen = status === "Applications Open";
    
    const handleButtonClick = () => {
      if (isOpen && filloutFormId) {
        setActiveFilloutForm({
          formId: filloutFormId,
          cohortId: cohort.id,
          initiativeName: initiativeName
        });
      }
    };
    
    return (
      <Card key={cohort.id} className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{initiativeName}</CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            {Array.isArray(topics) && topics.length > 0 && 
              topics.map((topic, index) => (
                <Badge key={`topic-${index}`} variant="secondary" className="bg-cyan-50 text-cyan-800">
                  {topic}
                </Badge>
              ))
            }
            
            {Array.isArray(classes) && classes.length > 0 && 
              classes.map((className, index) => (
                <Badge key={`class-${index}`} variant="outline" className="bg-amber-50 text-amber-800">
                  {className}
                </Badge>
              ))
            }
            
            <Badge variant={isOpen ? "success" : "destructive"} 
              className={isOpen ? 
                "bg-green-50 text-green-800" : 
                "bg-red-50 text-red-800"
              }>
              {status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardFooter className="pt-2 pb-4">
          <Button 
            className="w-full" 
            variant={isOpen ? "default" : "secondary"}
            disabled={!isOpen || !filloutFormId}
            onClick={handleButtonClick}
          >
            {actionButtonText}
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  // Main JSX content
  return (
    <Layout title="xFoundry Dashboard" profile={profile}>
      {/* Fillout form popup */}
      {activeFilloutForm && (
        <FilloutPopupEmbed
          filloutId={activeFilloutForm.formId}
          onClose={() => setActiveFilloutForm(null)}
          parameters={{
            cohortId: activeFilloutForm.cohortId,
            initiativeName: activeFilloutForm.initiativeName,
            userEmail: user?.email,
            userName: user?.name,
            userContactId: profile?.contactId
          }}
        />
      )}
      
      {/* Onboarding Checklist - Only render when we have profile data */}
      {profile && (
        <OnboardingChecklist 
          profile={profile}
          onComplete={() => setDashboardContent(true)}
        />
      )}
      
      {/* Dashboard Content - Only shown after onboarding is completed or skipped */}
      {dashboardContent && (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {profile?.firstName || user?.name?.split(' ')[0] || 'Student'}
              </p>
            </div>
            
            <Tabs 
              defaultValue="overview" 
              className="w-full md:w-auto"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full md:w-auto grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="teams">Team</TabsTrigger>
                <TabsTrigger value="programs">Programs</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div>
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="col-span-2" id="profile">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-5 w-5 text-primary" />
                          <CardTitle className="text-xl">Profile Information</CardTitle>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleEditClick}>
                          Edit Profile
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ProfileCard profile={profile} onEditClick={handleEditClick} />
                    </CardContent>
                  </Card>
                  
                  <Card id="notifications">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <BellRing className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">Notifications</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 rounded-lg border p-3">
                        <div className="rounded-full bg-primary/10 p-1">
                          <CheckCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">Application Complete</p>
                          <p className="text-xs text-muted-foreground">
                            Your program application has been received
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-4 rounded-lg border p-3">
                        <div className="rounded-full bg-amber-100 p-1">
                          <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">Complete Your Profile</p>
                          <p className="text-xs text-muted-foreground">
                            Add your education details to see more programs
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card id="team-overview">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">Team Status</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isTeamLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Skeleton className="h-32 w-full rounded-xl" />
                        </div>
                      ) : (
                        teamData ? (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-medium text-primary">{teamData.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {teamData.members?.filter(m => m.status === "Active").length || 0} active members
                                </p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => setActiveTab("teams")}>
                                View Details
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>You're not part of any team yet.</p>
                            <Button variant="outline" className="mt-4">Join a Team</Button>
                          </div>
                        )
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card id="program-overview">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">Available Programs</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {profile.cohorts && profile.cohorts.length > 0 ? (
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            You have {profile.cohorts.length} programs available to join
                          </p>
                          <Button onClick={() => setActiveTab("programs")}>
                            Browse Programs
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No programs are currently available for your institution.</p>
                          <p className="text-sm mt-2">Check back later for updates.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            
            {activeTab === "teams" && (
              <div className="space-y-6" id="teams">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <CardTitle className="text-xl">Your Team</CardTitle>
                    </div>
                    <CardDescription>
                      View and manage your team information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isTeamLoading ? (
                      <Skeleton className="h-48 w-full" />
                    ) : (
                      <TeamCard team={teamData} />
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeTab === "programs" && (
              <div className="space-y-6" id="programs">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <CardTitle className="text-xl">Available Programs</CardTitle>
                    </div>
                    <CardDescription>
                      Browse and apply for programs available to you
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {profile.cohorts && profile.cohorts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {profile.cohorts.map(cohort => renderCohortCard(cohort))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground italic">
                        No programs are currently available for your institution. Check back later for updates.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
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
      )}
    </Layout>
  )
}

export const getServerSideProps = withPageAuthRequired()

export default Dashboard