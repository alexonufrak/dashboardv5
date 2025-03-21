"use client"

import React, { useState, useRef, useEffect, Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PROGRAM_TYPES, getProgramType } from '@/lib/programComponents'
import { ProgramOverview, ProgramMilestones, ProgramActivity, ProgramSettings } from './index'
import { TeamMembersTab } from '@/components/program-dashboard/TeamMembersTab'
import { motion, AnimatePresence } from 'framer-motion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useIsMobile } from "@/hooks/use-mobile"

export default function ProgramTabs({
  programData,
  team,
  milestones = [],
  submissions = [],
  bounties = [],
  programId,
  isTeamProgram,
  initialTab = "overview",
  onInviteClick,
  onEditTeamClick
}) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [contentHeight, setContentHeight] = useState("auto")
  const isMobile = useIsMobile()
  const contentRefs = {
    overview: useRef(null),
    milestones: useRef(null),
    team: useRef(null),
    activity: useRef(null),
    settings: useRef(null)
  }
  
  // Determine program type
  const programType = getProgramType({
    name: programData?.initiativeName || ''
  })
  
  // Get appropriate tab labels based on program type
  const getTabLabels = () => {
    return {
      milestones: programType === PROGRAM_TYPES.XTRAPRENEURS ? 'Bounties' : 'Milestones',
      team: 'Team',
      overview: 'Overview',
      activity: 'Activity',
      settings: 'Settings'
    }
  }
  
  const tabLabels = getTabLabels()
  
  // Handler for tab changes
  const handleTabChange = (value) => {
    setActiveTab(value)
    
    // Force invalidation of relevant caches when switching tabs to prevent stale data
    if (typeof window !== 'undefined' && window._queryClient) {
      console.log(`Tab changed to ${value}, refreshing relevant data`);
      
      // Invalidate caches based on which tab we're switching to
      if (value === 'milestones' || value === 'bounties') {
        window._queryClient.invalidateQueries(['submissions']);
        window._queryClient.invalidateQueries(['milestones']);
      } else if (value === 'overview') {
        window._queryClient.invalidateQueries(['submissions']);
        window._queryClient.invalidateQueries(['milestones']);
      }
    }
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
  
  // Update container height when active tab changes or when view changes within tabs
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

    // Set an initial height immediately
    updateHeight();
    
    // Then update after short delay to allow animations to complete
    const shortTimer = setTimeout(updateHeight, 200);
    
    // Also update after longer delay to catch any delayed content rendering
    // This helps with timeline view which may take longer to fully render
    const longTimer = setTimeout(updateHeight, 500);
    
    // Create a handler for timeline/table view switching
    const handleMilestoneViewChange = (event) => {
      console.log("Milestone view changed:", event.detail.mode);
      
      // Set multiple timeouts to catch the rendering at different points
      // Timeline view especially needs time to fully render
      setTimeout(updateHeight, 50);
      setTimeout(updateHeight, 150);
      setTimeout(updateHeight, 300);
      setTimeout(updateHeight, 500);
      setTimeout(updateHeight, 800);
    };
    
    // Listen for milestone view changes (timeline/table toggle)
    window.addEventListener('milestoneViewChanged', handleMilestoneViewChange);
    
    // Set up mutation observer to detect DOM changes in the content
    // This is especially important for timeline/table view switches within the milestones tab
    const ref = contentRefs[refKey];
    if (ref?.current) {
      const observer = new MutationObserver((mutations) => {
        // When DOM changes, update the height
        updateHeight();
      });
      
      // Observe all changes to the subtree
      observer.observe(ref.current, { 
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });
      
      // Clean up
      return () => {
        clearTimeout(shortTimer);
        clearTimeout(longTimer);
        window.removeEventListener('milestoneViewChanged', handleMilestoneViewChange);
        observer.disconnect();
      };
    }
    
    return () => {
      clearTimeout(shortTimer);
      clearTimeout(longTimer);
      window.removeEventListener('milestoneViewChanged', handleMilestoneViewChange);
    };
  }, [activeTab, programType]);
  
  // Prevent layout shifts by adding overflow handling
  const containerStyle = {
    overflowX: "hidden", // Prevent horizontal scrollbar
    overflowY: "hidden", // Prevent vertical scrollbar flash during transitions
    position: "relative", // Required for absolute positioning of children
    minHeight: "200px",   // Ensure container has minimum size to reduce layout shift
    height: contentHeight, // Dynamic height based on active tab content
    transition: "height 0.25s ease-in-out" // Smooth transition when height changes
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
      {isMobile ? (
        <div className="w-full mb-4">
          <Select value={activeTab} onValueChange={handleTabChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a tab" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">{tabLabels.overview}</SelectItem>
              <SelectItem value={programType === PROGRAM_TYPES.XTRAPRENEURS ? "bounties" : "milestones"}>
                {tabLabels.milestones}
              </SelectItem>
              {isTeamProgram && <SelectItem value="team">{tabLabels.team}</SelectItem>}
              <SelectItem value="activity">{tabLabels.activity}</SelectItem>
              <SelectItem value="settings">{tabLabels.settings}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : (
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="overview">{tabLabels.overview}</TabsTrigger>
          <TabsTrigger value={programType === PROGRAM_TYPES.XTRAPRENEURS ? "bounties" : "milestones"}>
            {tabLabels.milestones}
          </TabsTrigger>
          {isTeamProgram && <TabsTrigger value="team">{tabLabels.team}</TabsTrigger>}
          <TabsTrigger value="activity">{tabLabels.activity}</TabsTrigger>
          <TabsTrigger value="settings">{tabLabels.settings}</TabsTrigger>
        </TabsList>
      )}
      
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
                <TeamMembersTab
                  team={team}
                  onInviteClick={onInviteClick}
                  onEditTeamClick={onEditTeamClick}
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
          
          {activeTab === "settings" && (
            <motion.div
              key="settings-tab"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={tabContentVariants}
              className="w-full"
              ref={contentRefs.settings}
            >
              <Suspense fallback={<div>Loading settings...</div>}>
                <ProgramSettings 
                  programData={programData}
                  team={team}
                  isTeamProgram={isTeamProgram}
                />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Tabs>
  )
}