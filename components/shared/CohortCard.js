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
  const [userTeams, setUserTeams] = useState([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState(null)
  
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
    app.cohortId === cohort.id || 
    (cohort.Connexions && app.cohortId === cohort.Connexions)
  )
  
  // Get Connexions URL if available
  const connexionsUrl = cohort.Connexions ? 
    `https://connexion.xfoundry.org/programs/${cohort.Connexions}` : 
    null
  
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
    if (onApplySuccess) {
      onApplySuccess(cohort)
    }
  }
  
  // Handle apply button click
  const handleApply = async () => {
    console.log("Applying to cohort:", cohort)
    console.log("Participation type:", participationType)
    
    const isTeamApplication = 
      participationType.toLowerCase() === "team" || 
      participationType.toLowerCase().includes("team") ||
      participationType.toLowerCase() === "teams"
    
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
          className="inline-flex items-center px-3 py-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 shadow-sm transition-all mr-2 mb-2 cursor-pointer group"
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
        
        <CardFooter className="pt-2 pb-4 flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline"
            className="w-full sm:w-auto sm:flex-1"
            onClick={handleViewDetails}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Button>
          
          {hasApplied ? (
            // Show Connexions button if user has already applied
            <Button 
              className="w-full sm:w-auto sm:flex-1" 
              variant="secondary"
              onClick={() => window.open(connexionsUrl || 'https://connexion.xfoundry.org', '_blank')}
              disabled={!connexionsUrl}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Go to Connexions
            </Button>
          ) : (
            // Show apply button if user hasn't applied yet
            <Button 
              className="w-full sm:w-auto sm:flex-1" 
              variant={isOpen ? "default" : "secondary"}
              disabled={!isOpen || (!filloutFormId && !participationType.toLowerCase().includes('team'))}
              onClick={handleApply}
            >
              {actionButtonText}
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
    </>
  )
}

export default CohortCard