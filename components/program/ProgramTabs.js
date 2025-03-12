"use client"

import React, { useState, useRef, useEffect, Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PROGRAM_TYPES, getProgramType } from '@/lib/programComponents'
import { ProgramOverview, ProgramTeam, ProgramMilestones, ProgramActivity } from './index'
import { motion, AnimatePresence } from 'framer-motion'

export default function ProgramTabs({
  programData,
  team,
  milestones = [],
  submissions = [],
  bounties = [],
  programId,
  isTeamProgram,
  initialTab = "overview"
}) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [contentHeight, setContentHeight] = useState("auto")
  const contentRefs = {
    overview: useRef(null),
    milestones: useRef(null),
    team: useRef(null),
    activity: useRef(null)
  }
  
  // Determine program type
  const programType = getProgramType({
    name: programData?.initiativeName || ''
  })
  
  // Get appropriate tab labels based on program type
  const getTabLabels = () => {
    return {
      milestones: programType === PROGRAM_TYPES.XTRAPRENEURS ? 'Bounties' : 'Milestones',
      team: 'Team Members',
      overview: 'Overview',
      activity: 'Activity'
    }
  }
  
  const tabLabels = getTabLabels()
  
  // Handler for tab changes
  const handleTabChange = (value) => {
    setActiveTab(value)
  }
  
  // Handler for navigation between tabs
  const handleViewMilestones = () => {
    setActiveTab(programType === PROGRAM_TYPES.XTRAPRENEURS ? "bounties" : "milestones")
  }
  
  const handleViewMembers = () => {
    setActiveTab("team")
  }
  
  // Animation variants for smooth tab transitions
  const tabContentVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.15, ease: "easeOut" } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.1, ease: "easeIn" } }
  }
  
  // Update container height when active tab changes
  useEffect(() => {
    // Get the right ref key based on active tab
    let refKey = activeTab;
    
    // Handle the milestones/bounties case which uses a dynamic key
    if (activeTab === (programType === PROGRAM_TYPES.XTRAPRENEURS ? "bounties" : "milestones")) {
      refKey = "milestones";
    }
    
    // Update height with a slight delay to allow DOM to render
    const updateHeight = () => {
      const ref = contentRefs[refKey];
      if (ref?.current) {
        const height = ref.current.offsetHeight;
        if (height > 0) {
          setContentHeight(`${height}px`);
        }
      }
    };

    // Set an initial height immediately and then update after animation completes
    updateHeight();
    const timer = setTimeout(updateHeight, 200);
    
    return () => clearTimeout(timer);
  }, [activeTab, programType]);
  
  // Prevent layout shifts by adding overflow handling
  const containerStyle = {
    overflowX: "hidden", // Prevent horizontal scrollbar
    overflowY: "hidden", // Prevent vertical scrollbar flash during transitions
    position: "relative", // Required for absolute positioning of children
    minHeight: "200px",   // Ensure container has minimum size to reduce layout shift
    height: contentHeight // Dynamic height based on active tab content
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
      <TabsList className="w-full md:w-auto">
        <TabsTrigger value="overview">{tabLabels.overview}</TabsTrigger>
        <TabsTrigger value={programType === PROGRAM_TYPES.XTRAPRENEURS ? "bounties" : "milestones"}>
          {tabLabels.milestones}
        </TabsTrigger>
        {isTeamProgram && <TabsTrigger value="team">{tabLabels.team}</TabsTrigger>}
        <TabsTrigger value="activity">{tabLabels.activity}</TabsTrigger>
      </TabsList>
      
      <div style={containerStyle} className="relative">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview-tab"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={tabContentVariants}
              className="w-full"
              ref={contentRefs.overview}
            >
              <Suspense fallback={<div>Loading overview...</div>}>
                <ProgramOverview
                  programData={programData}
                  milestones={milestones}
                  submissions={submissions}
                  bounties={bounties}
                  team={team}
                  onViewMilestones={handleViewMilestones}
                  onViewMembers={handleViewMembers}
                />
              </Suspense>
            </motion.div>
          )}
          
          {activeTab === (programType === PROGRAM_TYPES.XTRAPRENEURS ? "bounties" : "milestones") && (
            <motion.div
              key="milestones-tab"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={tabContentVariants}
              className="w-full"
              ref={contentRefs.milestones}
            >
              <Suspense fallback={<div>Loading milestones...</div>}>
                <ProgramMilestones
                  programData={programData}
                  milestones={milestones}
                  submissions={submissions}
                  bounties={bounties}
                  team={team}
                  programId={programId}
                />
              </Suspense>
            </motion.div>
          )}
          
          {isTeamProgram && activeTab === "team" && (
            <motion.div
              key="team-tab"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={tabContentVariants}
              className="w-full"
              ref={contentRefs.team}
            >
              <Suspense fallback={<div>Loading team...</div>}>
                <ProgramTeam
                  programData={programData}
                  team={team}
                  bounties={bounties}
                  milestones={milestones}
                  onInviteMember={() => console.log('Invite member')} // Replace with actual handler
                />
              </Suspense>
            </motion.div>
          )}
          
          {activeTab === "activity" && (
            <motion.div
              key="activity-tab"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={tabContentVariants}
              className="w-full"
              ref={contentRefs.activity}
            >
              <Suspense fallback={<div>Loading activity...</div>}>
                <ProgramActivity team={team} />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Tabs>
  )
}