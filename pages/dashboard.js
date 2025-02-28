"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useEffect, useState } from "react"
import dynamic from 'next/dynamic'
import { toast } from "sonner"

// Import components
import Layout from "../components/Layout"
import ProfileEditModal from "../components/ProfileEditModal"
import TeamCard from "../components/TeamCard"
import { FilloutPopupEmbed } from "@fillout/react"
import OnboardingChecklistCondensed from "../components/OnboardingChecklistCondensed"
import ProgramDetailModal from "../components/ProgramDetailModal"
import EmailMismatchAlert from "../components/EmailMismatchAlert"

// Import UI components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

// Import icons
import { 
  BookOpen, 
  Users, 
  AlertTriangle, 
  Compass,
  ExternalLink,
  Eye,
  ArrowRight
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
  const [showFullOnboarding, setShowFullOnboarding] = useState(false)
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(true)
  const [selectedProgram, setSelectedProgram] = useState(null)

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
          if (metadata.onboardingCompleted) {
            setDashboardContent(true)
            setShowOnboardingBanner(false)
          } else if (metadata.onboardingSkipped) {
            setDashboardContent(true)
            setShowOnboardingBanner(metadata.keepOnboardingVisible === true)
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
      <Layout title="xFoundry Hub">
        <div className="flex flex-col gap-6 mt-10">
          <Skeleton className="h-[30px] w-[280px] rounded" />
          
          <div className="flex flex-col gap-6">
            <Skeleton className="h-[80px] w-full rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-[250px] rounded-lg" />
              <Skeleton className="h-[250px] rounded-lg" />
              <Skeleton className="h-[250px] rounded-lg" />
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Show error message if there's an error
  if (error) {
    return (
      <Layout title="xFoundry Hub">
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

  const handleCompletion = () => {
    setShowFullOnboarding(false);
    setDashboardContent(true);
  };
  
  const handleProgramApply = (cohort) => {
    if (cohort && cohort["Application Form ID (Fillout)"]) {
      setActiveFilloutForm({
        formId: cohort["Application Form ID (Fillout)"],
        cohortId: cohort.id,
        initiativeName: cohort.initiativeDetails?.name || "Program Application"
      })
    }
  }
  
  const handleViewProgramDetails = (cohort) => {
    setSelectedProgram(cohort)
  }

  // Function to render individual cohort cards
  const renderCohortCard = (cohort) => {
    const initiativeName = cohort.initiativeDetails?.name || "Unknown Initiative";
    const topics = cohort.topicNames || [];
    const status = cohort["Status"] || "Unknown";
    const actionButtonText = cohort["Action Button"] || "Apply Now";
    const filloutFormId = cohort["Application Form ID (Fillout)"];
    const isOpen = status === "Applications Open";
    
    return (
      <Card key={cohort.id} className="overflow-hidden h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{initiativeName}</CardTitle>
            <Badge variant={isOpen ? "success" : "destructive"} 
              className={isOpen ? 
                "bg-green-50 text-green-800" : 
                "bg-red-50 text-red-800"
              }>
              {status}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {Array.isArray(topics) && topics.length > 0 && 
              topics.slice(0, 2).map((topic, index) => (
                <Badge key={`topic-${index}`} variant="secondary" className="bg-cyan-50 text-cyan-800">
                  {topic} {cohort.className && index === 0 ? `- ${cohort.className}` : ''}
                </Badge>
              ))
            }
            {topics.length > 2 && (
              <Badge variant="outline">+{topics.length - 2} more</Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {cohort.description || cohort.initiativeDetails?.description || 
             "Join this program to connect with mentors and build career skills."}
          </p>
        </CardContent>
        
        <CardFooter className="pt-2 pb-4 flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline"
            className="w-full sm:w-auto sm:flex-1"
            onClick={() => handleViewProgramDetails(cohort)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Button>
          
          <Button 
            className="w-full sm:w-auto sm:flex-1" 
            variant={isOpen ? "default" : "secondary"}
            disabled={!isOpen || !filloutFormId}
            onClick={() => handleProgramApply(cohort)}
          >
            {actionButtonText}
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  // Main JSX content
  return (
    <Layout title="xFoundry Hub" profile={profile} onEditClick={handleEditClick}>
      {/* Fillout form popup with required parameters */}
      {activeFilloutForm && (
        <FilloutPopupEmbed
          filloutId={activeFilloutForm.formId}
          onClose={() => setActiveFilloutForm(null)}
          data-user_id={user?.sub}
          data-contact={profile?.contactId}
          data-institution={profile?.institution?.id}
          parameters={{
            cohortId: activeFilloutForm.cohortId,
            initiativeName: activeFilloutForm.initiativeName,
            userEmail: user?.email,
            userName: user?.name,
            userContactId: profile?.contactId,
            user_id: user?.sub,
            contact: profile?.contactId,
            institution: profile?.institution?.id
          }}
        />
      )}
      
      {/* Program Detail Modal */}
      <ProgramDetailModal 
        cohort={selectedProgram}
        isOpen={!!selectedProgram}
        onClose={() => setSelectedProgram(null)}
        onApply={handleProgramApply}
      />
      
      {/* Full Onboarding Checklist - Only when shown */}
      {profile && showFullOnboarding && (
        <OnboardingChecklist 
          profile={profile}
          onComplete={handleCompletion}
        />
      )}
      
      {/* Dashboard Content - Either condensed onboarding or full dashboard */}
      {profile && !showFullOnboarding && (
        <div className="space-y-8 pt-4">
          {/* Email mismatch alert - appears if user authenticated with different email than verified */}
          {user?.emailMismatch && <EmailMismatchAlert emailMismatch={user.emailMismatch} />}
          
          {/* Condensed onboarding if not completed */}
          {showOnboardingBanner && (
            <OnboardingChecklistCondensed 
              profile={profile}
              onViewAll={() => setShowFullOnboarding(true)}
              onComplete={handleCompletion}
            />
          )}
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Your Hub</h1>
              <p className="text-muted-foreground">
                Welcome, {profile?.firstName || user?.name?.split(' ')[0] || 'Student'}
              </p>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="space-y-8">
            {/* Programs Section */}
            <section id="programs" className="space-y-4">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Available Programs</h2>
              </div>
              
              {profile.cohorts && profile.cohorts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {profile.cohorts.map(cohort => renderCohortCard(cohort))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12 text-muted-foreground italic">
                    <p>No programs are currently available for your institution.</p>
                    <p className="text-sm mt-2">Check back later for updates.</p>
                  </CardContent>
                </Card>
              )}
            </section>
            
            {/* Team Section */}
            <section id="teams" className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Your Team</h2>
              </div>
              
              {isTeamLoading ? (
                <Skeleton className="h-48 w-full rounded-lg" />
              ) : (
                <TeamCard team={teamData} />
              )}
            </section>
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