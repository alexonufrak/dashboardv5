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
import { useRouter } from 'next/router'
import TeamSelectDialog from '@/components/teams/TeamSelectDialog'
import TeamCreateDialog from '@/components/teams/TeamCreateDialog'
import InitiativeConflictDialog from './InitiativeConflictDialog'
import XtrapreneursApplicationForm from '@/components/program/xtrapreneurs/XtrapreneursApplicationForm'
import { useProfileData } from '@/lib/airtable/hooks'
import { useHasAppliedToCohort, useCreateApplication, useParticipation } from '@/lib/airtable/hooks'
import {
  isTeamBasedProgram,
  isXperimentProgram,
  isXtrapreneursProgram,
  getActionButtonText,
  getStatusBadgeClass,
  getParticipationTypeBadgeClass
} from '@/lib/airtable/utils/program-utils'

/**
 * A shared cohort card component to display cohort/initiative information
 * Used in both the dashboard and the onboarding checklist
 * Refactored to use the domain-driven Airtable hooks
 * 
 * @param {Object} cohort - The cohort data
 * @param {Function} onApply - Callback when apply button is clicked
 * @param {Function} onApplySuccess - Callback when application is successful
 * @param {boolean} condensed - If true, displays a condensed version of the card
 */
const CohortCard = ({ cohort, onApply, onApplySuccess, condensed = false }) => {
  const router = useRouter()
  
  // Use the profile data hook from the DDD library
  const { data: profile, isLoading: profileLoading } = useProfileData()
  
  // Use the application status hook for this cohort
  const { 
    hasApplied, 
    application, 
    isLoading: applicationLoading 
  } = useHasAppliedToCohort(cohort.id, {
    enabled: !!cohort.id && !!profile?.contactId
  })
  
  // Use the participation hook to check if user is participating in this cohort
  const {
    data: participation,
    isLoading: participationLoading
  } = useParticipation(profile?.contactId, cohort.id, {
    enabled: !!profile?.contactId && !!cohort.id
  })
  
  // Create application mutation hook
  const { mutate: createApplication, isPending: isCreatingApplication } = useCreateApplication()
  
  // Component state
  const [activeFilloutForm, setActiveFilloutForm] = useState(null)
  const [activeTeamSelectDialog, setActiveTeamSelectDialog] = useState(null)
  const [activeTeamCreateDialog, setActiveTeamCreateDialog] = useState(false)
  const [showXtrapreneursForm, setShowXtrapreneursForm] = useState(false)
  const [userTeams, setUserTeams] = useState([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [showInitiativeConflictDialog, setShowInitiativeConflictDialog] = useState(false)
  const [conflictDetails, setConflictDetails] = useState(null)
  
  // Loading state - show skeleton while data is loading
  const isLoading = profileLoading || applicationLoading || participationLoading
  if (isLoading) {
    return (
      <Card className="overflow-hidden h-full flex flex-col transition-all duration-200">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="h-7 w-3/4 bg-muted/50 dark:bg-muted/30 rounded-md animate-pulse"></div>
            <div className="h-6 w-20 bg-muted/50 dark:bg-muted/30 rounded-md animate-pulse"></div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <div className="h-5 w-24 bg-muted/50 dark:bg-muted/30 rounded-md animate-pulse"></div>
            <div className="h-5 w-24 bg-muted/50 dark:bg-muted/30 rounded-md animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent className="grow">
          <div className="h-12 w-full bg-muted/50 dark:bg-muted/30 rounded-md animate-pulse"></div>
          <div className="mt-3">
            <div className="h-6 w-24 bg-muted/50 dark:bg-muted/30 rounded-md animate-pulse"></div>
          </div>
        </CardContent>
        <CardFooter className="pt-2 pb-4 flex gap-2 min-h-[60px]">
          <div className="h-9 w-full bg-muted/50 dark:bg-muted/30 rounded-md animate-pulse"></div>
        </CardFooter>
      </Card>
    )
  }
  
  // Extract relevant data from cohort
  const initiativeName = cohort.initiativeDetails?.name || cohort.programName || "Unknown Initiative"
  const topics = cohort.topicNames || []
  const status = cohort.Status || cohort.status || "Unknown"
  const participationType = cohort.participationType || 
                          cohort.initiativeDetails?.["Participation Type"] || 
                          "Individual"
                          
  // Use utility functions to standardize behavior
  const actionButtonText = getActionButtonText(
    initiativeName, 
    participationType,
    cohort["Action Button"] // Optional custom button text
  )
  
  const filloutFormId = cohort["Application Form ID (Fillout)"]
  
  // Check if cohort is open for applications
  const isOpen = status === "Applications Open" || status === "Open"
  
  // Check if user has a pending application - used to disable the Apply button
  const hasAnyApplication = hasApplied
  
  // Check if user has an approved application - only show Connexions for approved applications
  const hasApprovedApplication = application?.status === "Approved"
  
  // Check if user has an active participation record for this cohort
  const hasActiveParticipation = !!participation
  
  // Show Connexions button only if they have active participation OR approved application
  const showConnexions = hasActiveParticipation || hasApprovedApplication
  
  // Set Connexions URL - always use the same URL
  const connexionsUrl = "https://connexion.xfoundry.org"
  
  // Use utility function to get status badge styling
  const statusClass = getStatusBadgeClass(status, condensed)
  
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
    if (onApplySuccess) {
      onApplySuccess(cohort)
    }
  }
  
  // Handle completion of Xtrapreneurs application
  const handleXtrapreneursFormSubmit = (data) => {
    // Create Xtrapreneurs application using our domain-driven hook
    createApplication({
      contactId: profile.contactId,
      cohortId: cohort.id,
      reason: data.reason,
      commitment: data.commitment,
      applicationType: 'xtrapreneurs'
    }, {
      onSuccess: () => {
        setShowXtrapreneursForm(false)
        if (onApplySuccess) {
          onApplySuccess(cohort)
        }
      }
    })
  }
  
  // Check if a user is already part of an initiative or if their team is part of a cohort
  const checkInitiativeRestrictions = async () => {
    try {
      // Get the current cohort's initiative
      const currentInitiativeName = cohort.initiativeDetails?.name || cohort.programName || ""
      const currentInitiativeId = cohort.initiativeDetails?.id || cohort.programId
      
      console.log("Checking initiative restrictions for:", currentInitiativeName)
      
      // Skip check for Xperiment initiative (which has no restrictions)
      if (isXperimentProgram(currentInitiativeName)) {
        console.log("Skipping restrictions for Xperiment initiative")
        return { allowed: true }
      }
      
      // Use utility function to determine if this is a team program
      const isTeamProgram = isTeamBasedProgram(participationType)
      
      console.log(`Is this a team program? ${isTeamProgram ? 'YES' : 'NO'} (${participationType})`)
      
      // Only check conflicts for team programs
      if (!isTeamProgram) {
        console.log(`Not a team program (${participationType}), skipping conflict check`)
        return { allowed: true }
      }
      
      // We need to make an API call to check if the user has participation records with conflicting initiatives
      if (!profile?.contactId) {
        console.error("No contact ID available for initiative conflict check")
        return { allowed: true }
      }
      
      console.log(`Calling API to check participation records for contact ${profile.contactId}`)
      
      // Use cache normally - only add timestamp if we need to force refresh
      // This will leverage the cached data during page navigation
      const url = `/api/user/check-initiative-conflicts?initiative=${encodeURIComponent(currentInitiativeName)}`
      const response = await fetch(url)
      
      if (!response.ok) {
        console.error("Error checking initiative conflicts:", response.statusText)
        return { allowed: true } // Allow if we can't check
      }
      
      const data = await response.json()
      
      if (data.hasConflict) {
        console.log("API found conflicting initiative:", data.conflictingInitiative)
        return {
          allowed: false,
          reason: "initiative_conflict",
          details: {
            currentInitiative: currentInitiativeName,
            conflictingInitiative: data.conflictingInitiative,
            teamId: data.teamId,
            teamName: data.teamName
          }
        }
      }
      
      console.log("No conflicts found, allowing application")
      return { allowed: true }
    } catch (error) {
      console.error("Error in initiative restriction check:", error)
      return { allowed: true } // In case of error, allow the application
    }
  }
  
  // Handle apply button click
  const handleApply = async () => {
    console.log("Applying to cohort:", cohort)
    console.log("Participation type:", participationType)
    
    try {
      // Check for initiative restrictions
      const restrictionCheck = await checkInitiativeRestrictions()
      if (!restrictionCheck.allowed) {
        console.log("Application restricted:", restrictionCheck)
        setConflictDetails(restrictionCheck.details)
        setShowInitiativeConflictDialog(true)
        return
      }

      // Use utility functions to determine program type
      const isTeamBased = isTeamBasedProgram(participationType)
      const isXtrapreneurs = isXtrapreneursProgram(initiativeName)
      
      // If onApply callback exists, let the parent component handle the application flow
      if (onApply && typeof onApply === 'function') {
        console.log("Delegating application flow to parent component")
        onApply(cohort)
        return // Let the parent component handle the application
      }
      
      // For team-based applications, show the team creation dialog
      if (isTeamBased) {
        console.log("Team-based application, showing team dialog")
        setActiveTeamCreateDialog(true)
        return
      }
      
      // For individual applications with a form, show the fillout form
      if (filloutFormId) {
        console.log("Individual application with form, showing fillout form")
        setActiveFilloutForm({
          formId: filloutFormId,
          cohortId: cohort.id,
          initiativeName: initiativeName
        })
        return
      }
      
      // For Xtrapreneurs applications, show the custom form
      if (isXtrapreneurs) {
        console.log("Xtrapreneurs application, showing custom form")
        setShowXtrapreneursForm(true)
        return
      }
      
      // Default fallback behavior - create direct application
      console.log("Creating direct application")
      createApplication({
        contactId: profile.contactId,
        cohortId: cohort.id,
        applicationType: 'individual'
      }, {
        onSuccess: () => {
          if (onApplySuccess) {
            onApplySuccess(cohort)
          }
        }
      })
      
    } catch (error) {
      console.error("Error in application process:", error)
    }
  }
  
  // Handle view details click
  const handleViewDetails = () => {
    // First check if cohort has custom handler
    if (cohort.onViewDetails) {
      cohort.onViewDetails(cohort)
    } else if (cohort.initiativeDetails?.id || cohort.programId) {
      // Navigate to program dashboard using new URL structure
      const programId = cohort.initiativeDetails?.id || cohort.programId
      router.push(`/dashboard/programs/${programId}`)
    }
  }
  
  // Render a condensed version of the card for team sections
  if (condensed) {
    return (
      <>
        <Card 
          key={cohort.id} 
          className="inline-flex items-center px-3 py-1.5 mr-2 mb-2 cursor-pointer group hover:shadow-sm"
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
        </Card>
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
            {cohort.shortName || cohort.Short_Name ? (
              <div className="mt-1 text-sm text-muted-foreground">
                {cohort.shortName || cohort.Short_Name}
              </div>
            ) : null}
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
            <Badge variant="outline" className={getParticipationTypeBadgeClass(participationType)}>
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
              // 2. Missing form ID for individual applications (only for individual non-xtrapreneurs)
              // 3. Currently creating application
              // 4. User already has a pending application (any status)
              disabled={
                !isOpen || 
                (!filloutFormId && 
                 !participationType.toLowerCase().includes('team') && 
                 !initiativeName.toLowerCase().includes('xtrapreneurs')) || 
                isCreatingApplication || 
                hasAnyApplication
              }
              onClick={handleApply}
            >
              {isCreatingApplication ? (
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
                  {application?.status || "Applied"}
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
      
      {/* Team creation/join dialog */}
      <TeamCreateDialog 
        open={activeTeamCreateDialog}
        onClose={() => setActiveTeamCreateDialog(false)}
        onCreateTeam={handleTeamCreated}
        onJoinTeam={handleTeamApplicationSubmitted}
        cohortId={cohort.id}
        profile={profile}
        cohort={cohort}
      />
      
      {/* Initiative Conflict Dialog */}
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