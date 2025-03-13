"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, UserPlus, Users } from "lucide-react"
import TeamSelectPanel from './TeamSelectPanel'
import TeamCreatePanel from './TeamCreatePanel'

/**
 * Form component for team applications
 * This is used in the application page to handle team selection or creation
 */
const TeamApplicationForm = ({ profile, cohort, onSubmit, isPage = false }) => {
  const [activeTab, setActiveTab] = useState('select')
  const [isLoading, setIsLoading] = useState(false)
  const [userTeams, setUserTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  
  // Fetch user's teams
  useEffect(() => {
    const fetchUserTeams = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/teams')
        if (response.ok) {
          const data = await response.json()
          setUserTeams(data.teams || [])
        }
      } catch (error) {
        console.error('Error fetching teams:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUserTeams()
  }, [])
  
  // Handle team selection
  const handleTeamSelect = (team) => {
    setSelectedTeam(team)
  }
  
  // Handle team creation
  const handleTeamCreated = (newTeam) => {
    // Add the new team to the user's teams
    setUserTeams(prev => [...prev, newTeam])
    
    // Select the newly created team
    setSelectedTeam(newTeam)
    
    // Switch to the select tab
    setActiveTab('select')
  }
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedTeam) {
      alert('Please select a team')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Prepare submission data
      const submissionData = {
        teamId: selectedTeam.id,
        participationType: 'Team',
        joinTeamMessage: message // Include message if provided
      }
      
      // Call onSubmit handler with data
      if (onSubmit) {
        await onSubmit(submissionData)
      }
    } catch (error) {
      console.error('Error submitting team application:', error)
      alert('Failed to submit application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Card className={isPage ? 'border-0 shadow-none' : ''}>
        <CardContent className={isPage ? 'px-0' : ''}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="select" disabled={isLoading || userTeams.length === 0}>
                <Users className="mr-2 h-4 w-4" />
                Select Existing Team
              </TabsTrigger>
              <TabsTrigger value="create">
                <UserPlus className="mr-2 h-4 w-4" />
                Create New Team
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="select" className="pt-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2">Loading your teams...</p>
                </div>
              ) : (
                <>
                  {userTeams.length > 0 ? (
                    <TeamSelectPanel 
                      teams={userTeams}
                      selectedTeam={selectedTeam}
                      onSelectTeam={handleTeamSelect}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        You don't have any teams yet. Create a new team to continue.
                      </p>
                      <Button 
                        type="button" 
                        onClick={() => setActiveTab('create')}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Team
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="create" className="pt-2">
              <TeamCreatePanel 
                onTeamCreated={handleTeamCreated}
                profile={profile}
                cohortId={cohort?.id}
              />
            </TabsContent>
          </Tabs>
          
          {selectedTeam && activeTab === 'select' && (
            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="message" className="text-base font-medium">
                  Why do you want to join this program with your team?
                </Label>
                <Textarea
                  id="message"
                  placeholder="Share your team's motivation and goals for joining this program..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="mt-2"
                  required
                />
              </div>
              
              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </form>
  )
}

export default TeamApplicationForm