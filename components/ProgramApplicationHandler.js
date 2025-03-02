"use client"

import { useState, useEffect } from 'react'
import { FilloutPopupEmbed } from "@fillout/react"
import TeamSelectDialog from './TeamSelectDialog'
import TeamCreateDialog from './TeamCreateDialog'
import InitiativeConflictDialog from './shared/InitiativeConflictDialog'
import XtrapreneursApplicationForm from './XtrapreneursApplicationForm'

/**
 * A reusable component that handles the application process for a cohort.
 * This component doesn't render anything visible directly, but manages the
 * application flow and renders the appropriate dialogs/forms when needed.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.cohort - The cohort data
 * @param {Object} props.profile - The user profile data
 * @param {boolean} props.isActive - Whether the application process is active
 * @param {Function} props.onComplete - Callback when application process is completed
 * @param {Function} props.onCancel - Callback when application process is cancelled
 */
const ProgramApplicationHandler = ({ 
  cohort, 
  profile, 
  isActive = false, 
  onComplete, 
  onCancel 
}) => {
  const [activeFilloutForm, setActiveFilloutForm] = useState(null)
  const [activeTeamSelectDialog, setActiveTeamSelectDialog] = useState(null)
  const [activeTeamCreateDialog, setActiveTeamCreateDialog] = useState(false)
  const [showXtrapreneursForm, setShowXtrapreneursForm] = useState(false)
  const [userTeams, setUserTeams] = useState([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // State for application restriction dialog
  const [showInitiativeConflictDialog, setShowInitiativeConflictDialog] = useState(false)
  const [conflictDetails, setConflictDetails] = useState(null)
  
  // Extract participation type (with null check for cohort)
  const participationType = cohort ? (
    cohort.participationType || 
    cohort.initiativeDetails?.["Participation Type"] || 
    "Individual"
  ) : "Individual"
  
  // Start the application process when isActive changes to true
  useEffect(() => {
    if (isActive && cohort) {
      startApplicationProcess();
    }
  }, [isActive, cohort]);
  
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
    completeApplicationProcess()
  }
  
  // Handle form completion for individual applications
  const handleFormCompleted = () => {
    setActiveFilloutForm(null)
    completeApplicationProcess()
  }
  
  // Handle completion of Xtrapreneurs application
  const handleXtrapreneursFormSubmit = (data) => {
    setShowXtrapreneursForm(false)
    completeApplicationProcess()
  }
  
  // Call the onComplete callback
  const completeApplicationProcess = () => {
    setIsProcessing(false)
    if (onComplete) {
      onComplete(cohort)
    }
  }
  
  // Cancel the application process
  const cancelApplicationProcess = () => {
    // Close all dialogs
    setActiveFilloutForm(null)
    setActiveTeamSelectDialog(null)
    setActiveTeamCreateDialog(false)
    setShowXtrapreneursForm(false)
    setShowInitiativeConflictDialog(false)
    setIsProcessing(false)
    
    if (onCancel) {
      onCancel()
    }
  }
  
  // Check if a user is already part of an initiative or if their team is part of a cohort
  const checkInitiativeRestrictions = async () => {
    try {
      // Get the current cohort's initiative
      const currentInitiativeName = cohort?.initiativeDetails?.name || "";
      const currentInitiativeId = cohort?.initiativeDetails?.id;
      
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
      
      // Check if we have profile data with a contactId
      if (!profile) {
        console.warn("Profile data not available for initiative conflict check");
        return { allowed: true }; // Allow if profile is not available
      }
      
      // We need to make an API call to check if the user has participation records with conflicting initiatives
      if (!profile.contactId) {
        console.warn("No contact ID available for initiative conflict check - profile may not be fully loaded");
        return { allowed: true }; // Allow if contactId is missing
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
  
  // Start the application process
  const startApplicationProcess = async () => {
    console.log("Starting application process for cohort:", cohort)
    console.log("Participation type:", participationType)
    
    setIsProcessing(true)
    
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
        if (cohort?.["Application Form ID (Fillout)"]) {
          console.log(`Using Fillout form ID: ${cohort["Application Form ID (Fillout)"]}`);
          
          setActiveFilloutForm({
            formId: cohort["Application Form ID (Fillout)"],
            cohortId: cohort.id,
            initiativeName: cohort.initiativeDetails?.name || "Program Application"
          });
        } else {
          console.error("No Fillout form ID found for individual participation");
          cancelApplicationProcess();
        }
      }
    } catch (error) {
      console.error("Error in application process:", error);
      cancelApplicationProcess();
    }
  }
  
  return (
    <>
      {/* Fillout form popup for individual applications */}
      {activeFilloutForm && (
        <FilloutPopupEmbed
          filloutId={activeFilloutForm.formId}
          onClose={() => cancelApplicationProcess()}
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
        onClose={() => cancelApplicationProcess()}
        onSubmit={handleTeamApplicationSubmitted}
        cohort={activeTeamSelectDialog?.cohort}
        teams={activeTeamSelectDialog?.teams || []}
      />
      
      {/* Team creation dialog */}
      <TeamCreateDialog 
        open={activeTeamCreateDialog}
        onClose={() => cancelApplicationProcess()}
        onCreateTeam={handleTeamCreated}
      />
      
      {/* Initiative Conflict Dialog */}
      <InitiativeConflictDialog
        open={showInitiativeConflictDialog}
        onClose={() => cancelApplicationProcess()}
        details={conflictDetails}
        conflictType="initiative_conflict"
      />
      
      {/* Xtrapreneurs Application Form */}
      <XtrapreneursApplicationForm
        open={showXtrapreneursForm}
        onClose={() => cancelApplicationProcess()}
        onSubmit={handleXtrapreneursFormSubmit}
        cohort={cohort}
        profile={profile}
      />
    </>
  )
}

export default ProgramApplicationHandler