"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@auth0/nextjs-auth0/client'
import { FilloutPopupEmbed } from "@fillout/react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, Users, UserRound } from "lucide-react"
import TeamSelectDialog from './TeamSelectDialog'
import TeamCreateDialog from './TeamCreateDialog'

const OnboardingChecklist = ({ profile, onComplete }) => {
  const { user } = useUser()
  const router = useRouter()
  const [steps, setSteps] = useState([
    { id: 'register', title: 'Create an account', completed: true, description: 'Sign up with your institutional email' },
    { id: 'selectCohort', title: 'Get involved', completed: false, description: 'Select a program to join' },
    { id: 'connexions', title: 'Join ConneXions', completed: false, description: 'Connect with the community' }
  ])
  const [activeFilloutForm, setActiveFilloutForm] = useState(null)
  const [activeTeamSelectDialog, setActiveTeamSelectDialog] = useState(null)
  const [activeTeamCreateDialog, setActiveTeamCreateDialog] = useState(false)
  const [checkedCohortSubmission, setCheckedCohortSubmission] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCohort, setSelectedCohort] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [expandedAccordion, setExpandedAccordion] = useState({})
  const [userTeams, setUserTeams] = useState([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  
  // Setup expanded state initially based on completion status
  useEffect(() => {
    const newExpandedState = {};
    steps.forEach(step => {
      // Auto-expand incomplete sections (except the first one which is already completed)
      newExpandedState[step.id] = !step.completed && step.id !== 'register';
    });
    setExpandedAccordion(newExpandedState);
  }, []);

  // Check if user came from a specific cohort link
  useEffect(() => {
    const checkUserMetadata = async () => {
      try {
        // Fetch user metadata to see if steps are already completed
        const response = await fetch('/api/user/metadata')
        if (response.ok) {
          const metadata = await response.json()
          
          // Update steps based on metadata
          if (metadata.onboarding) {
            const updatedSteps = steps.map(step => ({
              ...step,
              completed: metadata.onboarding.includes(step.id)
            }));
            
            setSteps(updatedSteps);
            
            // Update accordion expanded state based on completion
            const newExpandedState = {};
            updatedSteps.forEach(step => {
              // Auto-collapse completed sections
              newExpandedState[step.id] = !step.completed && step.id !== 'register';
            });
            setExpandedAccordion(newExpandedState);
          }
          
          // Check if onboarding is completed or skipped
          if (metadata.onboardingCompleted || metadata.onboardingSkipped) {
            setShowOnboarding(false)
            if (onComplete) onComplete()
          }
          
          // Set selected cohort if any
          if (metadata.selectedCohort) {
            setSelectedCohort(metadata.selectedCohort)
          }
        }
      } catch (error) {
        console.error('Error fetching user metadata:', error)
      }
    }

    // Check URL params for cohort ID
    const cohortId = router.query.cohortId
    if (cohortId && !selectedCohort) {
      // Save cohort ID to user metadata
      saveCohortToMetadata(cohortId)
      setSelectedCohort(cohortId)
    }
    
    checkUserMetadata()
  }, [router.query, user])

  // Check if user has already submitted an application for the selected cohort
  useEffect(() => {
    const checkCohortSubmission = async () => {
      if (selectedCohort && !checkedCohortSubmission && profile?.contactId) {
        setIsLoading(true)
        try {
          const response = await fetch(`/api/user/check-application?cohortId=${selectedCohort}&contactId=${profile.contactId}`)
          if (response.ok) {
            const data = await response.json()
            if (data.hasApplied) {
              // Mark the selectCohort step as completed
              completeStep('selectCohort')
            }
          }
        } catch (error) {
          console.error('Error checking cohort submission:', error)
        } finally {
          setCheckedCohortSubmission(true)
          setIsLoading(false)
        }
      }
    }
    
    checkCohortSubmission()
  }, [selectedCohort, profile, checkedCohortSubmission])

  // Fetch user's teams when needed
  useEffect(() => {
    const fetchUserTeams = async () => {
      if (!profile?.contactId || isLoadingTeams) return
      
      setIsLoadingTeams(true)
      try {
        const response = await fetch('/api/teams')
        if (response.ok) {
          const data = await response.json()
          setUserTeams(data.teams || [])
        }
      } catch (error) {
        console.error('Error fetching user teams:', error)
      } finally {
        setIsLoadingTeams(false)
      }
    }
    
    fetchUserTeams()
  }, [profile])

  // Save selected cohort to user metadata
  const saveCohortToMetadata = async (cohortId) => {
    try {
      await fetch('/api/user/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          selectedCohort: cohortId
        })
      })
    } catch (error) {
      console.error('Error saving cohort to metadata:', error)
    }
  }

  // Complete a step
  const completeStep = async (stepId) => {
    // Update local state
    const updatedSteps = steps.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    );
    
    setSteps(updatedSteps);
    
    // Auto-collapse completed section
    setExpandedAccordion(prev => ({
      ...prev,
      [stepId]: false
    }));
    
    // Save to user metadata
    try {
      await fetch('/api/user/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          onboarding: [...steps.filter(s => s.completed).map(s => s.id), stepId]
        })
      })
    } catch (error) {
      console.error('Error saving step completion to metadata:', error)
    }
  }

  // Handle accordion value change
  const handleAccordionChange = (value) => {
    setExpandedAccordion(prev => ({
      ...prev,
      [value]: !prev[value]
    }));
  };

  // Handle clicking a cohort card to apply
  const handleCohortApply = (cohort) => {
    console.log("Applying to cohort:", cohort);
    console.log("Cohort initiative details:", cohort.initiativeDetails);
    
    // Check if initiative has participation type 
    // First try the direct property added in enhanced cohorts
    // Then try the nested path, and finally fall back to Individual
    const participationType = cohort.participationType || 
                             cohort.initiativeDetails?.["Participation Type"] || 
                             "Individual";
                             
    console.log(`Participation type for cohort ${cohort.id}: ${participationType}`);
    console.log("Full cohort object:", JSON.stringify(cohort, null, 2));
    
    // Team applications require a different flow
    if (participationType.toLowerCase() === "team") {
      console.log("Team participation type detected");
      console.log("User teams:", userTeams);
      
      if (userTeams.length === 0) {
        // User doesn't have a team, show team creation dialog
        console.log("No teams found, opening team creation dialog");
        setActiveTeamCreateDialog(true);
        
        // Store the cohort for later use after team creation
        setSelectedCohort(cohort.id);
      } else {
        // User has teams, show team selection dialog
        console.log("User has teams, opening team selection dialog");
        setActiveTeamSelectDialog({
          cohort: cohort,
          teams: userTeams
        });
      }
    } else {
      // Individual participation - use Fillout form
      console.log("Individual participation type, using Fillout form");
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

  // Handle team creation
  const handleTeamCreated = (team) => {
    console.log("Team created successfully:", team);
    
    // Add new team to user's teams
    setUserTeams(prev => {
      const newTeams = [...prev, team];
      console.log("Updated teams list:", newTeams);
      return newTeams;
    });
    
    setActiveTeamCreateDialog(false);
    
    // If we have a pending team application, open the team selection dialog with the newly created team
    if (activeTeamSelectDialog) {
      console.log("Updating existing team selection dialog with new team");
      setActiveTeamSelectDialog({
        ...activeTeamSelectDialog,
        teams: [team] // Prioritize the newly created team
      });
    } else if (selectedCohort) {
      // If no active dialog but we have a selected cohort, find the cohort and open the team selection dialog
      console.log(`Finding cohort with ID ${selectedCohort} to continue application`);
      const cohort = profile.cohorts?.find(c => c.id === selectedCohort);
      
      if (cohort) {
        console.log("Found cohort, opening team selection dialog:", cohort);
        setActiveTeamSelectDialog({
          cohort: cohort,
          teams: [team]
        });
      } else {
        console.error(`No cohort found with ID ${selectedCohort}`);
      }
    } else {
      console.log("No pending cohort application to continue with");
    }
  }

  // Handle completion of form submission
  const handleFormCompleted = () => {
    setActiveFilloutForm(null)
    completeStep('selectCohort')
  }

  // Handle team application submission
  const handleTeamApplicationSubmitted = (application) => {
    setActiveTeamSelectDialog(null)
    completeStep('selectCohort')
  }

  // Complete onboarding
  const completeOnboarding = async () => {
    try {
      await fetch('/api/user/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          onboardingCompleted: true
        })
      })
      
      setShowOnboarding(false)
      if (onComplete) onComplete()
    } catch (error) {
      console.error('Error completing onboarding:', error)
    }
  }

  // Skip onboarding
  const skipOnboarding = async () => {
    try {
      await fetch('/api/user/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          onboardingSkipped: true
        })
      })
      
      setShowOnboarding(false)
      if (onComplete) onComplete()
    } catch (error) {
      console.error('Error skipping onboarding:', error)
    }
  }

  // Function to render individual cohort cards
  const renderCohortCard = (cohort) => {
    const initiativeName = cohort.initiativeDetails?.name || "Unknown Initiative"
    const topics = cohort.topicNames || []
    const status = cohort["Status"] || "Unknown"
    const actionButtonText = cohort["Action Button"] || "Apply Now"
    const filloutFormId = cohort["Application Form ID (Fillout)"]
    const participationType = cohort.initiativeDetails?.["Participation Type"] || "Individual"
    
    const isOpen = status === "Applications Open"
    const isDisabled = !isOpen || (participationType === "Individual" && !filloutFormId)
    
    return (
      <Card key={cohort.id} className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{initiativeName}</CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            {Array.isArray(topics) && topics.length > 0 && 
              topics.map((topic, index) => (
                <Badge key={`topic-${index}`} variant="secondary" className="bg-cyan-50 text-cyan-800 hover:bg-cyan-100">
                  {topic}
                </Badge>
              ))
            }
            
            <Badge variant={isOpen ? "success" : "destructive"} 
              className={isOpen ? 
                "bg-green-50 text-green-800 hover:bg-green-100" : 
                "bg-red-50 text-red-800 hover:bg-red-100"
              }>
              {status}
            </Badge>
            
            <Badge variant="outline" className="flex items-center gap-1">
              {participationType === "Team" ? (
                <>
                  <Users className="h-3 w-3" />
                  <span>Team</span>
                </>
              ) : (
                <>
                  <UserRound className="h-3 w-3" />
                  <span>Individual</span>
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        
        <CardFooter className="pt-3 pb-5">
          <Button 
            className="w-full" 
            variant={isOpen ? "default" : "secondary"}
            disabled={isDisabled}
            onClick={() => handleCohortApply(cohort)}
          >
            {actionButtonText}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // If onboarding is hidden, don't render anything
  if (!showOnboarding) {
    return null
  }

  const allStepsCompleted = steps.every(step => step.completed)

  return (
    <Card className="mb-8">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl text-primary">Welcome to xFoundry!</CardTitle>
        <p className="text-muted-foreground">Complete these steps to get started</p>
      </CardHeader>
      
      {/* Fillout form popup with required parameters */}
      {activeFilloutForm && (
        <FilloutPopupEmbed
          filloutId={activeFilloutForm.formId}
          onClose={() => setActiveFilloutForm(null)}
          onSubmit={handleFormCompleted}
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
      
      {/* Team selection dialog */}
      {activeTeamSelectDialog && (
        <TeamSelectDialog
          open={!!activeTeamSelectDialog}
          onClose={() => setActiveTeamSelectDialog(null)}
          onSubmit={handleTeamApplicationSubmitted}
          cohort={activeTeamSelectDialog.cohort}
          teams={activeTeamSelectDialog.teams || userTeams}
        />
      )}
      
      {/* Team creation dialog */}
      <TeamCreateDialog
        open={activeTeamCreateDialog}
        onClose={() => setActiveTeamCreateDialog(false)}
        onCreateTeam={handleTeamCreated}
      />
      
      <CardContent>
        <Accordion type="multiple" value={Object.keys(expandedAccordion).filter(key => expandedAccordion[key])}>
          {steps.map((step, index) => {
            // Skip rendering content area for register step as it's already completed
            const hasContent = !(step.id === 'register');
            
            return (
              <AccordionItem 
                key={step.id} 
                value={step.id}
                className="border rounded-md mb-4 overflow-hidden"
                disabled={step.id === 'register'}
              >
                <div className="flex items-center p-4 bg-muted/30">
                  <div className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full mr-3 
                    ${step.completed ? 'text-green-600' : 'text-primary'}`}>
                    {step.completed ? <CheckCircle className="h-7 w-7" /> : <Circle className="h-7 w-7" />}
                  </div>
                  
                  <div className="grow">
                    <h3 className="text-base font-medium">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  
                  {hasContent && !step.completed && (
                    <AccordionTrigger 
                      onClick={() => handleAccordionChange(step.id)} 
                      className="ml-2 shrink-0 p-0"
                    />
                  )}
                </div>
                
                {hasContent && (
                  <AccordionContent>
                    <div className="p-4 border-t">
                      {step.id === 'selectCohort' && !step.completed && (
                        <>
                          <p className="text-base mb-4">
                            Select a program to apply for:
                          </p>
                          
                          {isLoading ? (
                            <div className="text-center py-4 text-muted-foreground">
                              <p>Loading available programs...</p>
                            </div>
                          ) : profile.cohorts && profile.cohorts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {profile.cohorts.map(cohort => renderCohortCard(cohort))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground italic">
                              No programs are currently available for your institution.
                            </div>
                          )}
                        </>
                      )}
                      
                      {step.id === 'connexions' && (
                        <div className="text-center py-4">
                          <p className="mb-4">
                            Join ConneXions to connect with students, mentors, and faculty in your program.
                          </p>
                          <Button 
                            onClick={() => {
                              completeStep('connexions');
                              window.open("https://connexions.app", "_blank");
                            }}
                          >
                            Go to ConneXions
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                )}
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
      
      <CardFooter className="justify-center">
        {allStepsCompleted ? (
          <Button
            variant="success" 
            className="bg-green-600 hover:bg-green-700"
            onClick={completeOnboarding}
          >
            Complete Onboarding
          </Button>
        ) : (
          <Button 
            variant="outline"
            onClick={skipOnboarding}
          >
            Skip for Now
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default OnboardingChecklist