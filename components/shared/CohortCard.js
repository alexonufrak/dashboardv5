"use client"

import { useState } from 'react'
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
import TeamSelectDialog from '../TeamSelectDialog'
import TeamCreateDialog from '../TeamCreateDialog'
import InitiativeConflictDialog from './InitiativeConflictDialog'
import XtrapreneursApplicationForm from '../XtrapreneursApplicationForm'

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
  const [userTeams, setUserTeams] = useState([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState(null)
  const [isApplying, setIsApplying] = useState(false)
  
  // Extract relevant data from cohort
  const initiativeName = cohort.initiativeDetails?.name || "Unknown Initiative"
  const topics = cohort.topicNames || []
  const status = cohort["Status"] || "Unknown"
  const actionButtonText = cohort["Action Button"] || "Apply Now"
  const filloutFormId = cohort["Application Form ID (Fillout)"]
  // Check if cohort is open for applications
  const isOpen = status === "Applications Open"
  
  // Check if user has already applied to this cohort
  const hasApplied = Array.isArray(applications) && applications.some(app => 
    app.cohortId === cohort.id
  )
  
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
      
      // Check if current initiative is Xperience or Xtrapreneurs
      const isXperience = currentInitiativeName.toLowerCase().includes("xperience");
      const isXtrapreneurs = currentInitiativeName.toLowerCase().includes("xtrapreneurs");
      
      if (!isXperience && !isXtrapreneurs) {
        console.log("No restrictions for initiative:", currentInitiativeName);
        return { allowed: true }; // No restrictions for other initiatives
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
            conflictingInitiative: data.conflictingInitiative
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
      
      // Check if this is Xtrapreneurs initiative
      const isXtrapreneurs = cohort.initiativeDetails?.name?.toLowerCase().includes("xtrapreneurs");
      
      // Handle Xtrapreneurs application differently
      if (isXtrapreneurs) {
        console.log("Xtrapreneurs application detected - using custom form");
        // Show custom Xtrapreneurs application form
        setShowXtrapreneursForm(true);
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
    // This would usually involve a modal but for this component we assume the parent will handle this
    if (cohort.onViewDetails) {
      cohort.onViewDetails(cohort)
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
          className="inline-flex items-center px-3 py-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 shadow-sm transition-all mr-2 mb-2 cursor-default group"
          onClick={handleViewDetails}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{initiativeName}</span>
            
            <Badge variant="outline" className={`text-xs ${statusClass} border-0`} size="sm">
              {status}
            </Badge>
            
            {(Array.isArray(topics) && topics.length > 0) && (
              <span className="text-xs text-muted-foreground hidden group-hover:inline-block">
                {topics[0].length > 15 ? topics[0].substring(0, 15) + '...' : topics[0]}
              </span>
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
        
        <CardContent className="grow">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {cohort.description || cohort.initiativeDetails?.description || 
             "Join this program to connect with mentors and build career skills."}
          </p>
          
          {/* Participation Type Badge */}
          <div className="mt-3">
            <Badge variant="outline" className={
              participationType.toLowerCase().includes('team') ? 
              "bg-purple-50 text-purple-800 border-purple-200" : 
              "bg-blue-50 text-blue-800 border-blue-200"
            }>
              {participationType}
            </Badge>
          </div>
        </CardContent>
        
        <CardFooter className="pt-2 pb-4 flex gap-2 min-h-[60px]">
          <Button 
            variant="outline"
            size="sm"
            className="flex-1 h-9 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis"
            onClick={handleViewDetails}
          >
            <Eye className="mr-1 h-4 w-4 flex-shrink-0" />
            <span className="truncate">View Details</span>
          </Button>
          
          {hasApplied ? (
            // Show Connexions button if user has already applied
            <Button 
              size="sm"
              className="flex-1 h-9 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis" 
              variant="secondary"
              onClick={() => window.open(connexionsUrl, '_blank')}
            >
              <ExternalLink className="mr-1 h-4 w-4 flex-shrink-0" />
              <span className="truncate">Connexions</span>
            </Button>
          ) : (
            // Show apply button if user hasn't applied yet
            <Button 
              size="sm"
              className="flex-1 h-9 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis" 
              variant={isOpen ? "default" : "secondary"}
              disabled={!isOpen || (!filloutFormId && !participationType.toLowerCase().includes('team')) || isApplying}
              onClick={handleApply}
            >
              {isApplying ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Applying...
                </span>
              ) : (
                <span className="truncate">{actionButtonText}</span>
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
    </>
  )
}

export default CohortCard