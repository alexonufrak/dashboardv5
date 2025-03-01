"use client"

import { withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useEffect, useState } from "react"
import dynamic from 'next/dynamic'
import { toast } from "sonner"

// Import components
import ProperDashboardLayout from "../components/ProperDashboardLayout"
import ProfileEditModal from "../components/ProfileEditModal"
import TeamCard from "../components/TeamCard"
import OnboardingChecklistCondensed from "../components/OnboardingChecklistCondensed"
import EmailMismatchAlert from "../components/EmailMismatchAlert"
import CohortGrid from "../components/shared/CohortGrid"
import TeamCreateDialog from "../components/TeamCreateDialog"
import TeamSelectDialog from "../components/TeamSelectDialog"
import ProgramDetailModal from "../components/ProgramDetailModal"

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
  ArrowRight,
  Eye
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
        // First check session storage for quick initial UI rendering
        const sessionCompleted = sessionStorage.getItem('xFoundry_onboardingCompleted') === 'true';
        const sessionSkipped = sessionStorage.getItem('xFoundry_onboardingSkipped') === 'true';
        
        // Always fetch from API for the definitive data
        const response = await fetch("/api/user/metadata");
        
        if (response.ok) {
          const metadata = await response.json();
          console.log("User metadata from API:", metadata);
          
          // Determine onboarding steps completed
          const onboardingSteps = metadata.onboarding || [];
          const hasCompletedRegister = Array.isArray(onboardingSteps) && onboardingSteps.includes('register');
          const hasAppliedToProgram = Array.isArray(onboardingSteps) && onboardingSteps.includes('selectCohort');
          
          console.log("Onboarding steps:", {
            steps: onboardingSteps,
            hasCompletedRegister,
            hasAppliedToProgram
          });
          
          // CRITICAL: Only consider onboarding fully complete when user has applied to a program
          if (hasAppliedToProgram) {
            // User has applied to a program - hide all onboarding
            setShowFullOnboarding(false);
            setShowOnboardingBanner(false);
            setDashboardContent(true);
            
            // Update session storage
            sessionStorage.setItem('xFoundry_onboardingCompleted', 'true');
            sessionStorage.removeItem('xFoundry_onboardingSkipped');
            
            // Also update the onboardingCompleted flag in API for persistence
            if (metadata.onboardingCompleted !== true) {
              await fetch('/api/user/metadata', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  onboardingCompleted: true,
                  onboardingSkipped: false,
                  keepOnboardingVisible: false
                })
              });
            }
          } else if (hasCompletedRegister) {
            // User has registered but not applied - show condensed banner
            setShowFullOnboarding(false);
            setShowOnboardingBanner(true);
            setDashboardContent(true);
            
            // Update session storage
            sessionStorage.setItem('xFoundry_onboardingSkipped', 'true');
            sessionStorage.removeItem('xFoundry_onboardingCompleted');
            
            // Update metadata to reflect status
            if (!metadata.onboardingSkipped) {
              await fetch('/api/user/metadata', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  onboardingSkipped: true,
                  keepOnboardingVisible: true
                })
              });
            }
          } else {
            // New user - show full onboarding
            setShowFullOnboarding(true);
            setShowOnboardingBanner(false);
            setDashboardContent(false);
          }
        } else {
          console.warn("Error fetching metadata from API, falling back to session storage");
          
          // Session storage fallback logic
          if (sessionCompleted) {
            setDashboardContent(true);
            setShowFullOnboarding(false);
            setShowOnboardingBanner(false);
          } else if (sessionSkipped) {
            setDashboardContent(true);
            setShowFullOnboarding(false);
            setShowOnboardingBanner(true);
          } else {
            // For new users, show full onboarding
            setDashboardContent(false);
            setShowFullOnboarding(true);
            setShowOnboardingBanner(false);
          }
        }
      } catch (err) {
        console.error("Error checking onboarding status:", err);
        
        // Fallback to session data if available
        const sessionCompleted = sessionStorage.getItem('xFoundry_onboardingCompleted') === 'true';
        const sessionSkipped = sessionStorage.getItem('xFoundry_onboardingSkipped') === 'true';
        
        if (sessionCompleted) {
          setDashboardContent(true);
          setShowFullOnboarding(false);
          setShowOnboardingBanner(false);
        } else if (sessionSkipped) {
          setDashboardContent(true);
          setShowFullOnboarding(false);
          setShowOnboardingBanner(true);
        } else {
          // For new users without session data, show full onboarding
          setDashboardContent(false);
          setShowFullOnboarding(true);
          setShowOnboardingBanner(false);
        }
      }
    }

    if (user) {
      // Start loading profile and team data
      fetchProfile()
      fetchTeamData()
      
      // For initial rendering, show loading state
      // We'll let the checkOnboardingStatus determine what to show
      // based on the API response
      setDashboardContent(false);
      setShowFullOnboarding(true);
      setShowOnboardingBanner(false);
      
      // Check onboarding status right away
      checkOnboardingStatus()
    }
  }, [user])

  // Show loading screen while data is loading
  if (isUserLoading || isLoading) {
    return (
      <ProperDashboardLayout title="xFoundry Hub">
        <div className="flex flex-col gap-6 mt-10">
          <Skeleton className="h-[30px] w-[280px] rounded-sm" />
          
          <div className="flex flex-col gap-6">
            <Skeleton className="h-[80px] w-full rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-[250px] rounded-lg" />
              <Skeleton className="h-[250px] rounded-lg" />
              <Skeleton className="h-[250px] rounded-lg" />
            </div>
          </div>
        </div>
      </ProperDashboardLayout>
    )
  }

  // Show error message if there's an error
  if (error) {
    return (
      <ProperDashboardLayout title="xFoundry Hub">
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}. Please try refreshing the page or contact support if the issue persists.
          </AlertDescription>
        </Alert>
      </ProperDashboardLayout>
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

  const handleCompletion = (skipOnly = false, hasAppliedToProgram = false) => {
    console.log("Handling onboarding completion:", { skipOnly, hasAppliedToProgram });
    
    // IMPORTANT: Only update API and storage if user has actually applied
    // Otherwise just update the UI temporarily
    if (hasAppliedToProgram) {
      // User has completed program application - mark onboarding as fully complete
      sessionStorage.setItem('xFoundry_onboardingCompleted', 'true');
      sessionStorage.removeItem('xFoundry_onboardingSkipped');
      
      // Update the API for persistence
      fetch('/api/user/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          onboardingCompleted: true,
          onboardingSkipped: false,
          keepOnboardingVisible: false
        })
      }).catch(err => console.error("Error updating metadata:", err));
    } else if (skipOnly) {
      // User explicitly skipped - show banner but keep metadata
      sessionStorage.setItem('xFoundry_onboardingSkipped', 'true');
      sessionStorage.removeItem('xFoundry_onboardingCompleted');
      
      // Update API to mark as skipped but keep visible
      fetch('/api/user/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          onboardingSkipped: true,
          keepOnboardingVisible: true
        })
      }).catch(err => console.error("Error updating metadata:", err));
    } else {
      // User clicked "Complete" without applying - just show banner without updating API
      // This ensures they'll still see the full checklist on next page load
      sessionStorage.setItem('xFoundry_onboardingSkipped', 'true');
      sessionStorage.removeItem('xFoundry_onboardingCompleted');
    }
    
    // Animate the checklist closing with CSS transitions
    const fullChecklist = document.querySelector('.onboarding-checklist-wrapper');
    if (fullChecklist) {
      fullChecklist.classList.remove('onboarding-checklist-visible');
      fullChecklist.classList.add('onboarding-checklist-hidden');
    }
    
    // After a short delay to let the animation play, update state
    setTimeout(() => {
      setShowFullOnboarding(false);
      setDashboardContent(true);
      
      // Always show the banner unless the user has applied to a program
      const shouldShowBanner = !hasAppliedToProgram;
      setShowOnboardingBanner(shouldShowBanner);
      
      // If showing the banner, ensure it animates in nicely
      if (shouldShowBanner) {
        const banner = document.querySelector('.onboarding-condensed');
        if (banner) {
          banner.classList.remove('onboarding-condensed-hidden');
          banner.classList.add('onboarding-condensed-visible');
        }
      }
    }, 400);
  };
  
  // These functions are now handled by the CohortGrid component

  // This function is now handled by the shared CohortGrid and CohortCard components
  
  // Main JSX content
  // Debug info - remove in production
  console.log("Render state:", {
    showFullOnboarding,
    dashboardContent,
    showOnboardingBanner,
    hasProfile: !!profile
  });
  
  return (
    <ProperDashboardLayout title="xFoundry Hub" profile={profile} onEditClick={handleEditClick}>
      {profile && (
        <div className="onboarding-container">
          {/* Email mismatch alert (always at top) */}
          {user?.emailMismatch && <EmailMismatchAlert emailMismatch={user.emailMismatch} />}
          
          {/* Full Onboarding Checklist - expands/collapses in place */}
          <div className={`onboarding-checklist-wrapper ${showFullOnboarding ? 'onboarding-checklist-visible' : 'onboarding-checklist-hidden'}`}>
            <OnboardingChecklist 
              profile={profile}
              onComplete={handleCompletion}
            />
          </div>
          
          {/* Condensed Onboarding Banner - only shown when applicable */}
          <div className={`${showOnboardingBanner ? 'onboarding-condensed-visible' : 'onboarding-condensed-hidden'} onboarding-condensed`}>
            {showOnboardingBanner && (
              <OnboardingChecklistCondensed 
                profile={profile}
                onViewAll={() => {
                  // Apply appropriate classes during transition
                  const condensedBanner = document.querySelector('.onboarding-condensed');
                  if (condensedBanner) {
                    condensedBanner.classList.add('onboarding-condensed-hidden');
                  }
                  
                  // Update state after a small delay
                  setTimeout(() => {
                    setShowFullOnboarding(true);
                    setShowOnboardingBanner(false);
                    
                    // Ensure dashboard content is still shown behind the expanded checklist
                    // but don't hide it completely
                    setDashboardContent(true);
                    
                    // Scroll to the top of the checklist with smooth animation
                    setTimeout(() => {
                      const checklist = document.querySelector('.onboarding-checklist-wrapper');
                      if (checklist) {
                        checklist.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start'
                        });
                      }
                    }, 100);
                  }, 200);
                }}
                onComplete={handleCompletion}
              />
            )}
          </div>
          
          {/* Main Dashboard Content - always rendered, just pushed down */}
          <div className="dashboard-main-content space-y-8">
            {/* User welcome */}
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
                
                <CohortGrid 
                  cohorts={profile.cohorts || []}
                  profile={profile}
                  onApplySuccess={(cohort) => {
                    toast.success(`Applied to ${cohort.initiativeDetails?.name || 'program'} successfully!`);
                  }}
                />
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
          </div>
        </div>
      )}
      
      {isEditModalOpen && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={handleEditClose}
          profile={profile}
          onSave={handleProfileUpdate}
        />
      )}
    </ProperDashboardLayout>
  )
}

export const getServerSideProps = withPageAuthRequired()

export default Dashboard