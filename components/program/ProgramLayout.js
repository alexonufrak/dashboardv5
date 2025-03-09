"use client"

import React, { useEffect, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useRouter } from 'next/router'
import { Compass, Users, Award, Calendar } from 'lucide-react'
import TeamSelector from './TeamSelector'
import { ROUTES } from '@/lib/routing'

const ProgramLayout = ({ children, programId, activeTab = 'overview' }) => {
  const router = useRouter()
  const { 
    getActiveProgramData, 
    getAllProgramInitiatives,
    profile,
    setIsEditModalOpen
  } = useDashboard()
  
  // State for page title
  const [pageTitle, setPageTitle] = useState("Program Dashboard")
  
  // Get program-specific data
  const programData = getActiveProgramData(programId)
  const allInitiatives = getAllProgramInitiatives()
  
  // Find the current initiative name
  const initiative = allInitiatives.find(init => init.id === programId)
  
  // Set page title based on initiative name
  useEffect(() => {
    if (initiative?.name) {
      setPageTitle(`${initiative.name} Dashboard`)
    } else if (programData?.initiativeName) {
      setPageTitle(`${programData.initiativeName} Dashboard`)
    }
  }, [initiative, programData])
  
  // Handle profile edit click
  const handleEditProfileClick = () => {
    console.log("Opening profile edit modal")
    setIsEditModalOpen(true)
  }
  
  // Handle tab navigation
  const handleTabChange = (value) => {
    // Use routing constants from routing utility
    const basePath = ROUTES.PROGRAM.DETAIL(programId)
    
    // Navigate to the selected tab
    switch (value) {
      case 'overview':
        router.push(basePath)
        break
      case 'bounties':
        router.push(ROUTES.PROGRAM.BOUNTIES(programId))
        break
      case 'milestones':
        router.push(ROUTES.PROGRAM.MILESTONES(programId))
        break
      case 'team':
        router.push(ROUTES.PROGRAM.TEAM(programId))
        break
      default:
        router.push(basePath)
    }
  }
  
  // Get team data
  const teamData = programData?.teamData || null
  const isXtrapreneurs = initiative?.name?.toLowerCase().includes('xtrapreneurs')
  
  return (
    <div className="space-y-6 w-full h-full overflow-auto pb-8">
      {/* Program Header Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100 w-full">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                  {initiative?.name || programData?.initiativeName || "Program"}
                </Badge>
                
                {programData?.cohort?.['Current Cohort'] && (
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                    Active Cohort
                  </Badge>
                )}
              </div>
              
              <h2 className="text-xl font-semibold mb-1">
                {programData?.cohort?.name || "Active Program"}
                {programData?.cohort?.Short_Name && ` - ${programData.cohort.Short_Name}`}
              </h2>
              
              <div className="text-sm text-muted-foreground flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                {programData?.cohort?.['Start Date'] && programData?.cohort?.['End Date'] ? (
                  <span>
                    {new Date(programData.cohort['Start Date']).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
                    {' - '}
                    {new Date(programData.cohort['End Date']).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}
                  </span>
                ) : (
                  <span>Active Program • {new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'long'})}</span>
                )}
              </div>
            </div>
            
            {teamData && (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={teamData.image} alt={teamData.name} />
                  <AvatarFallback>{teamData.name?.substring(0, 2).toUpperCase() || "TM"}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{teamData.name || "Your Team"}</h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5 mr-1" />
                    <span>{teamData.members?.length || 0} member{teamData.members?.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {isXtrapreneurs && <TabsTrigger value="bounties">Bounties</TabsTrigger>}
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Card>
      
      {/* Team Selector - if user has multiple teams */}
      {programData?.isTeamBased && programData?.userHasMultipleTeams && (
        <TeamSelector programId={programId} />
      )}
      
      {/* Content Area */}
      <div className="space-y-6 w-full">
        {children}
      </div>
    </div>
  )
}

export default ProgramLayout