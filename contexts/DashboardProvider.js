"use client"

import { useState } from "react"
import { UserProvider } from "./UserContext"
import { ProgramProvider } from "./ProgramContext"
import { TeamProvider } from "./TeamContext"
import { EducationProvider } from "./EducationContext"

/**
 * Composite provider that composes all domain-specific contexts
 * This maintains backwards compatibility while allowing gradual migration to domain contexts
 */
export function DashboardProvider({ children }) {
  // UI state management (shared across contexts)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  // Track data refresh timestamps
  const [lastUpdatedTimestamps, setLastUpdatedTimestamps] = useState({
    teams: null,
    milestones: null,
    submissions: null,
    profile: null,
    participations: null,
    applications: null,
    education: null
  })
  
  // Get the latest update timestamp across all data types
  const getLastUpdatedTimestamp = () => {
    const timestamps = Object.values(lastUpdatedTimestamps).filter(Boolean)
    if (timestamps.length === 0) return null
    
    // Sort timestamps in descending order and get the most recent
    return timestamps.sort((a, b) => new Date(b) - new Date(a))[0]
  }
  
  // Update a specific timestamp
  const updateTimestamp = (dataType) => {
    if (!dataType) return
    
    setLastUpdatedTimestamps(prev => ({ 
      ...prev, 
      [dataType]: new Date().toISOString() 
    }))
  }
  
  // Update all timestamps
  const updateAllTimestamps = () => {
    const now = new Date().toISOString()
    setLastUpdatedTimestamps({
      teams: now,
      milestones: now,
      submissions: now,
      profile: now,
      participations: now,
      applications: now,
      education: now
    })
  }
  
  // Compose providers with proper nesting order
  return (
    <UserProvider>
      <ProgramProvider>
        <TeamProvider>
          <EducationProvider>
            {children}
          </EducationProvider>
        </TeamProvider>
      </ProgramProvider>
    </UserProvider>
  )
}