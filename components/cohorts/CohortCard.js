"use client"

import { useState, useEffect } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, ExternalLink } from 'lucide-react'
import { FilloutPopupEmbed } from "@fillout/react"
import TeamSelectDialog from '@/components/teams/TeamSelectDialog'
import TeamCreateDialog from '@/components/teams/TeamCreateDialog'
import InitiativeConflictDialog from './InitiativeConflictDialog'
import XtrapreneursApplicationForm from '@/components/program/xtrapreneurs/XtrapreneursApplicationForm'
import TeamJoinHandler from '@/components/program/TeamJoinHandler'

/**
 * A shared cohort card component to display cohort/initiative information
 * Used in both the dashboard and the onboarding checklist
 * @param {Object} cohort - The cohort data
 * @param {Object} profile - The user profile
 * @param {Function} onApplySuccess - Callback when application is successful
 * @param {boolean} condensed - If true, displays a condensed version of the card
 * @param {Array} applications - List of applications to check if user has already applied
 */
const CohortCard = ({ cohort, profile, onApplySuccess, condensed = false, applications = [] }) => {
  const [activeFilloutForm, setActiveFilloutForm] = useState(null)
  const [activeTeamSelectDialog, setActiveTeamSelectDialog] = useState(null)
  const [activeTeamCreateDialog, setActiveTeamCreateDialog] = useState(false)
  const [showXtrapreneursForm, setShowXtrapreneursForm] = useState(false)
  const [showTeamJoinHandler, setShowTeamJoinHandler] = useState(false)
  const [userTeams, setUserTeams] = useState([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState(null)
  const [isApplying, setIsApplying] = useState(false)
  
  // Extract relevant data from cohort
  const initiativeName = cohort.initiativeDetails?.name || "Unknown Initiative"
  const topics = cohort.topicNames || []
  // Access status field consistently - cohort.Status is the correct property
  const status = cohort.Status || "Unknown"
  const actionButtonText = cohort["Action Button"] || "Apply Now"
  const filloutFormId = cohort["Application Form ID (Fillout)"]
  // Check if cohort is open for applications
  const isOpen = status === "Applications Open"
  
  // Find any application for this cohort
  const cohortApplication = Array.isArray(applications) ? 
    applications.find(app => app.cohortId === cohort.id) : null
  
  // Check if user has a pending application - used to disable the Apply button
  const hasAnyApplication = !!cohortApplication
  
  // Check if user has an approved application - only show Connexions for approved applications
  const hasApprovedApplication = cohortApplication?.status === "Approved"
  
  // Check if user has an active participation record for this cohort using the optimized lookup
  const hasActiveParticipation = !!profile?.findParticipationByCohortId?.(cohort.id)
  
  // Show Connexions button only if they have active participation OR approved application
  const showConnexions = hasActiveParticipation || hasApprovedApplication
  
  // Set Connexions URL - always use the same URL
  const connexionsUrl = "https://connexion.xfoundry.org"
  
  // For condensed view in team card, we'll show all statuses
  const statusClass = condensed ? 
    (isOpen ? "bg-green-50 text-green-800" : "bg-blue-50 text-blue-800") : 
    (isOpen ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800")
  
  // Extract participation type
  const participationType = cohort.participationType || 
                           cohort.initiativeDetails?.["Participation Type"] || 
                           "Individual"
  
  // Handle team creation
  const handleTeamCreated = (team) => {
    console.log("Team created successfully:", team)
    
    // Add new team to user's teams
    setUserTeams(prev => {
      const newTeams = [...prev, team]
      console.log("Updated teams list:", newTeams)
      return newTeams
    })
    
    setActiveTeamCreateDialog(false)
    
    // Open team selection dialog with the newly created team
    setActiveTeamSelectDialog({
      cohort: cohort,
      teams: [team]
    })
  }
  
  // Handle team application submission
  const handleTeamApplicationSubmitted = (application) => {
    setActiveTeamSelectDialog(null)
    if (onApplySuccess) {
      onApplySuccess(cohort)
    }
  }
  
  // Handle form completion for individual applications
  const handleFormCompleted = () => {
    setActiveFilloutForm(null)
    setIsApplying(false)
    if (onApplySuccess) {
      onApplySuccess(cohort)
    }
  }
  
  // Handle completion of Xtrapreneurs application
  const handleXtrapreneursFormSubmit = (data) => {
    setShowXtrapreneursForm(false)
    setIsApplying(false)
    if (onApplySuccess) {
      onApplySuccess(cohort)
    }
  }
  
  // State for application restriction dialog
  const [showInitiativeConflictDialog, setShowInitiativeConflictDialog] = useState(false)
  const [conflictDetails, setConflictDetails] = useState(null)
  
  // Reset application state when not actively applying
  // Use a timeout to prevent the dialogs from closing immediately
  // which may cause UI flickers when one dialog is being replaced by another
  useEffect(() => {
    let resetTimer;
    
    if (!isApplying) {
      // Use a small delay before closing dialogs to prevent 
      // UI flickers when another dialog needs to open
      resetTimer = setTimeout(() => {
        // Only close dialogs if we're still not applying
        if (!isApplying) {
          setShowTeamJoinHandler(false)
          setShowXtrapreneursForm(false)
          setActiveTeamSelectDialog(null)
          setActiveTeamCreateDialog(false)
          setActiveFilloutForm(null)
        }
      }, 150); // Short delay to allow any new dialog to open first
    }
    
    // Clean up timer if component unmounts or isApplying changes
    return () => {
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, [isApplying])
  
  // Check if a user is already part of an initiative or if their team is part of a cohort
  const checkInitiativeRestrictions = async () => {
    try {
      // Get the current cohort's initiative
      const currentInitiativeName = cohort.initiativeDetails?.name || "";
      const currentInitiativeId = cohort.initiativeDetails?.id;
      
      console.log("Checking initiative restrictions for:", currentInitiativeName);
      
      // Skip check for Xperiment initiative (which has no restrictions)
      if (currentInitiativeName.includes("Xperiment")) {
        console.log("Skipping restrictions for Xperiment initiative");
        return { allowed: true };
      }
      
      // Check if this is a team-based initiative
      const currentParticipationType = cohort.participationType || 
                                     cohort.initiativeDetails?.["Participation Type"] || 
                                     "Individual";
                                     
      // Standardized team participation detection
      const normalizedType = currentParticipationType.trim().toLowerCase();
      const isTeamProgram = 
        normalizedType === "team" || 
        normalizedType.includes("team") ||
        normalizedType === "teams" ||
        normalizedType === "group" ||
        normalizedType.includes("group") ||
        normalizedType === "collaborative" ||
        normalizedType.includes("collaborative");
      
      console.log(`Is this a team program? ${isTeamProgram ? 'YES' : 'NO'} (${currentParticipationType})`);
      
      // Only check conflicts for team programs
      if (!isTeamProgram) {
        console.log(`Not a team program (${currentParticipationType}), skipping conflict check`);
        return { allowed: true };
      }
      
      // We need to make an API call to check if the user has participation records with conflicting initiatives
      if (!profile?.contactId) {
        console.error("No contact ID available for initiative conflict check");
        return { allowed: true };
      }
      
      console.log(`Calling API to check participation records for contact ${profile.contactId}`);
      const response = await fetch(`/api/user/check-initiative-conflicts?initiative=${encodeURIComponent(currentInitiativeName)}`);
      
      if (!response.ok) {
        console.error("Error checking initiative conflicts:", response.statusText);
        return { allowed: true }; // Allow if we can't check
      }
      
      const data = await response.json();
      
      if (data.hasConflict) {
        console.log("API found conflicting initiative:", data.conflictingInitiative);
        return {
          allowed: false,
          reason: "initiative_conflict",
          details: {
            currentInitiative: currentInitiativeName,
            conflictingInitiative: data.conflictingInitiative,
            teamId: data.teamId,
            teamName: data.teamName
          }
        };
      }
      
      console.log("No conflicts found, allowing application");
      return { allowed: true };
    } catch (error) {
      console.error("Error in initiative restriction check:", error);
      return { allowed: true }; // In case of error, allow the application
    }
  };
  
  // Handle apply button click
  const handleApply = async () => {
    console.log("Applying to cohort:", cohort)
    console.log("Participation type:", participationType)
    
    // Set loading state for the button
    setIsApplying(true)
    
    try {
      // Check for initiative restrictions
      const restrictionCheck = await checkInitiativeRestrictions();
      if (!restrictionCheck.allowed) {
        console.log("Application restricted:", restrictionCheck);
        setConflictDetails(restrictionCheck.details);
        setShowInitiativeConflictDialog(true);
        return;
      }
      
      // Check initiative type for special handling
      const initiativeName = cohort.initiativeDetails?.name?.toLowerCase() || "";
      
      // Handle Xtrapreneurs application differently
      if (initiativeName.includes("xtrapreneurs")) {
        console.log("Xtrapreneurs application detected - using custom form");
        // Show custom Xtrapreneurs application form
        setShowXtrapreneursForm(true);
        return; // Exit early
      }
      
      // Handle Xperience and Horizons Challenge with specialized team join flow
      if (initiativeName.includes("xperience") || initiativeName.includes("horizons challenge")) {
        console.log("Xperience/Horizons Challenge application detected - using specialized team join flow");
        setShowTeamJoinHandler(true);
        return; // Exit early
      }
      
      // For all other initiatives, use the original logic
      const isTeamApplication = 
        participationType.toLowerCase() === "team" || 
        participationType.toLowerCase().includes("team") ||
        participationType.toLowerCase() === "teams";
      
      if (isTeamApplication) {
        console.log("Team participation detected")
        
        // Check if we need to fetch teams
        if (userTeams.length === 0 && !isLoadingTeams) {
          try {
            setIsLoadingTeams(true)
            const response = await fetch('/api/teams')
            if (response.ok) {
              const data = await response.json()
              const fetchedTeams = data.teams || []
              console.log("Fetched teams:", fetchedTeams)
              setUserTeams(fetchedTeams)
              
              if (fetchedTeams.length === 0) {
                // User doesn't have any teams - show team creation dialog
                setActiveTeamCreateDialog(true)
                setSelectedCohort(cohort.id)
              } else {
                // User has teams - show team selection dialog
                setActiveTeamSelectDialog({
                  cohort: cohort,
                  teams: fetchedTeams
                })
              }
            }
          } catch (error) {
            console.error("Error fetching teams:", error)
          } finally {
            setIsLoadingTeams(false)
          }
        } else if (userTeams.length === 0) {
          // User doesn't have any teams - show team creation dialog
          setActiveTeamCreateDialog(true)
          setSelectedCohort(cohort.id)
        } else {
          // User has teams - show team selection dialog
          setActiveTeamSelectDialog({
            cohort: cohort,
            teams: userTeams
          })
        }
      } else {
        // Individual participation - use Fillout form
        console.log("Individual participation detected")
        if (cohort && cohort["Application Form ID (Fillout)"]) {
          console.log(`Using Fillout form ID: ${cohort["Application Form ID (Fillout)"]}`);
          
          setActiveFilloutForm({
            formId: cohort["Application Form ID (Fillout)"],
            cohortId: cohort.id,
            initiativeName: cohort.initiativeDetails?.name || "Program Application"
          });
        } else {
          console.error("No Fillout form ID found for individual participation");
        }
      }
    } catch (error) {
      console.error("Error in application process:", error);
    } finally {
      // Reset loading state after everything is done
      setIsApplying(false);
    }
  }
  
  // Handle view details click
  const handleViewDetails = () => {
    // First check if cohort has custom handler
    if (cohort.onViewDetails) {
      cohort.onViewDetails(cohort)
    } else if (cohort.initiativeDetails?.id) {
      // Navigate to program dashboard using new URL structure
      window.location.href = `/program/${cohort.initiativeDetails.id}`
    }
  }
  
  // Render a condensed version of the card for team sections
  if (condensed) {
    console.log("Rendering condensed cohort card:", {
      id: cohort.id,
      name: initiativeName,
      topics: topics,
      className: cohort.className
    });
    
    return (
      <>
        <div 
          key={cohort.id} 
          className="inline-flex items-center px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800 shadow-sm transition-all mr-2 mb-2 cursor-pointer group"
          onClick={handleViewDetails}
        >
          <div className="flex items-center gap-2 pointer-events-none">
            <span className="font-medium text-sm">{initiativeName}</span>
            
            {(Array.isArray(topics) && topics.length > 0) && (
              <Badge variant="secondary" className="text-xs dark:bg-cyan-900 dark:text-cyan-100 bg-cyan-50 text-cyan-800 border-0">
                {topics[0].length > 15 ? topics[0].substring(0, 15) + '...' : topics[0]}
                {cohort.className && ` - ${cohort.className}`}
              </Badge>
            )}
            
            <Eye className="h-3 w-3 text-muted-foreground ml-1" />
          </div>
        </div>
      </>
    );
  }

  // Regular full card
  return (
    <>
      <Card key={cohort.id} className="overflow-hidden h-full flex flex-col transition-all duration-200 hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{initiativeName}</CardTitle>
            <Badge variant={isOpen ? "success" : "destructive"} 
              className={statusClass}>
              {status}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {Array.isArray(topics) && topics.length > 0 && 
              topics.slice(0, 2).map((topic, index) => (
                <Badge key={`topic-${index}`} variant="secondary" className="bg-cyan-50 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100">
                  {topic} {cohort.className && index === 0 ? `- ${cohort.className}` : ''}
                </Badge>
              ))
            }
            {topics.length > 2 && (
              <Badge variant="outline">+{topics.length - 2} more</Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="grow">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {cohort.description || cohort.initiativeDetails?.description || 
             "Join this program to connect with mentors and build career skills."}
          </p>
          
          {/* Participation Type Badge */}
          <div className="mt-3">
            <Badge variant="outline" className={
              participationType.toLowerCase().includes('team') ? 
              "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-800" : 
              "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800"
            }>
              {participationType}
            </Badge>
          </div>
        </CardContent>
        
        <CardFooter className="pt-2 pb-4 flex gap-2 min-h-[60px]">
          <Button 
            variant="outline"
            size="sm"
            className="flex-1 h-9 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer"
            onClick={handleViewDetails}
          >
            <Eye className="mr-1 h-4 w-4 flex-shrink-0 pointer-events-none" />
            <span className="truncate pointer-events-none">View Details</span>
          </Button>
          
          {showConnexions ? (
            // Show Connexions button if user has active participation or approved application
            <Button 
              size="sm"
              className="flex-1 h-9 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer" 
              variant="secondary"
              onClick={() => window.open(connexionsUrl, '_blank')}
            >
              <ExternalLink className="mr-1 h-4 w-4 flex-shrink-0 pointer-events-none" />
              <span className="truncate pointer-events-none">Connexions</span>
            </Button>
          ) : (
            // Show apply button if user doesn't have active participation or approved application
            <Button 
              size="sm"
              className="flex-1 h-9 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer" 
              variant={isOpen ? "default" : "secondary"}
              // Disable if: 
              // 1. Cohort isn't open for applications
              // 2. Missing form ID for individual applications
              // 3. Currently applying
              // 4. User already has a pending application (any status)
              disabled={!isOpen || (!filloutFormId && !participationType.toLowerCase().includes('team')) || isApplying || hasAnyApplication}
              onClick={handleApply}
            >
              {isApplying ? (
                <span className="flex items-center justify-center pointer-events-none">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Applying...
                </span>
              ) : hasAnyApplication ? (
                // Show application status for existing applications that aren't approved
                <span className="truncate pointer-events-none">
                  {cohortApplication?.status || "Applied"}
                </span>
              ) : (
                <span className="truncate pointer-events-none">{actionButtonText}</span>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Fillout form popup for individual applications */}
      {activeFilloutForm && (
        <FilloutPopupEmbed
          filloutId={activeFilloutForm.formId}
          onClose={() => setActiveFilloutForm(null)}
          onSubmit={handleFormCompleted}
          data-user_id={profile?.userId}
          data-contact={profile?.contactId}
          data-institution={profile?.institution?.id}
          parameters={{
            cohortId: activeFilloutForm.cohortId,
            initiativeName: activeFilloutForm.initiativeName,
            userEmail: profile?.email,
            userName: profile?.name,
            userContactId: profile?.contactId,
            user_id: profile?.userId,
            contact: profile?.contactId,
            institution: profile?.institution?.id
          }}
        />
      )}
      
      {/* Team selection dialog for team applications */}
      <TeamSelectDialog 
        open={!!activeTeamSelectDialog}
        onClose={() => setActiveTeamSelectDialog(null)}
        onSubmit={handleTeamApplicationSubmitted}
        cohort={activeTeamSelectDialog?.cohort}
        teams={activeTeamSelectDialog?.teams || []}
      />
      
      {/* Team creation dialog */}
      <TeamCreateDialog 
        open={activeTeamCreateDialog}
        onClose={() => setActiveTeamCreateDialog(false)}
        onCreateTeam={handleTeamCreated}
      />
      
      {/* Initiative Conflict Dialog (using the new component) */}
      <InitiativeConflictDialog
        open={showInitiativeConflictDialog}
        onClose={() => setShowInitiativeConflictDialog(false)}
        details={conflictDetails}
        conflictType="initiative_conflict"
      />
      
      {/* Xtrapreneurs Application Form */}
      <XtrapreneursApplicationForm
        open={showXtrapreneursForm}
        onClose={() => setShowXtrapreneursForm(false)}
        onSubmit={handleXtrapreneursFormSubmit}
        cohort={cohort}
        profile={profile}
      />
      
      {/* Team Join Handler for Xperience/Horizons Challenge */}
      <TeamJoinHandler
        cohort={cohort}
        profile={profile}
        isActive={showTeamJoinHandler}
        onComplete={onApplySuccess}
        onCancel={() => setShowTeamJoinHandler(false)}
      />
    </>
  )
}

export default CohortCard