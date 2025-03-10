"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { useDashboard } from "@/contexts/DashboardContext"
import { Compass, Users, Award, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ROUTES } from "@/lib/routing"
import TeamSelector from "./TeamSelector"

export default function ProgramLayout({ children, programId, activeTab = "overview" }) {
  const router = useRouter()
  const { 
    getActiveProgramData, 
    getAllProgramInitiatives,
    profile,
    setIsEditModalOpen
  } = useDashboard()
  
  const [pageTitle, setPageTitle] = useState("Program Dashboard")
  
  const programData = getActiveProgramData(programId)
  const allInitiatives = getAllProgramInitiatives()
  const initiative = allInitiatives.find(init => init.id === programId)
  
  useEffect(() => {
    if (initiative?.name) {
      setPageTitle(`${initiative.name} Dashboard`)
    } else if (programData?.initiativeName) {
      setPageTitle(`${programData.initiativeName} Dashboard`)
    }
  }, [initiative, programData])
  
  const handleEditProfileClick = () => {
    setIsEditModalOpen(true)
  }
  
  const handleTabChange = (value) => {
    const basePath = ROUTES.PROGRAM.DETAIL(programId)
    
    switch (value) {
      case "overview":
        router.push(basePath)
        break
      case "bounties":
        router.push(ROUTES.PROGRAM.BOUNTIES(programId))
        break
      case "milestones":
        router.push(ROUTES.PROGRAM.MILESTONES(programId))
        break
      case "team":
        router.push(ROUTES.PROGRAM.TEAM(programId))
        break
      default:
        router.push(basePath)
    }
  }
  
  const teamData = programData?.teamData || null
  const isXtrapreneurs = initiative?.name?.toLowerCase().includes("xtrapreneurs")
  
  return (
    <div className="flex flex-col flex-1 w-full h-full overflow-auto pb-8">
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100 w-full sticky top-0 z-10">
        <div className="p-4 w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 w-full">
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                  {initiative?.name || programData?.initiativeName || "Program"}
                </Badge>
                
                {programData?.cohort?.["Current Cohort"] && (
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
                {programData?.cohort?.["Start Date"] && programData?.cohort?.["End Date"] ? (
                  <span>
                    {new Date(programData.cohort["Start Date"]).toLocaleDateString("en-US", {year: "numeric", month: "short", day: "numeric"})}
                    {" - "}
                    {new Date(programData.cohort["End Date"]).toLocaleDateString("en-US", {year: "numeric", month: "short", day: "numeric"})}
                  </span>
                ) : (
                  <span>Active Program • {new Date().toLocaleDateString("en-US", {year: "numeric", month: "long"})}</span>
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
                    <span>{teamData.members?.length || 0} member{teamData.members?.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
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
      
      {programData?.isTeamBased && programData?.userHasMultipleTeams && (
        <div className="mt-4">
          <TeamSelector programId={programId} />
        </div>
      )}
      
      <div className="flex-1 space-y-6 w-full mt-4">
        {children}
      </div>
    </div>
  )
}