"use client"

import { useState, useEffect } from 'react'
import CohortCard from './CohortCard'
import ProgramDetailModal from '../program/ProgramDetailModal'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { useQueryClient } from '@tanstack/react-query'

/**
 * A grid of cohort cards that can be used in various parts of the app
 */
const CohortGrid = ({ 
  cohorts = [], 
  profile, 
  isLoading = false,
  isLoadingApplications = false,
  applications = [],
  onApply, // Add the onApply prop for handling application sheet in onboarding
  onApplySuccess,
  columns = {
    default: 1,
    md: 2,
    lg: 3
  },
  emptyMessage = "No programs are currently available for your institution."
}) => {
  const [selectedProgram, setSelectedProgram] = useState(null)
  const queryClient = useQueryClient()
  
  // We've removed the intensive prefetching that was causing performance issues
  // Instead, we rely on the caching headers and React Query's cache settings
  // When a user clicks "Apply", the conflict check will be cached for future use
  // The cache will persist during page navigation, but refresh on actual page reload
  
  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 ${columns.md > 1 ? `md:grid-cols-${columns.md}` : ''} ${columns.lg > 1 ? `lg:grid-cols-${columns.lg}` : ''} gap-5 w-full`}>
        {[...Array(columns.lg || 2)].map((_, index) => (
          <Skeleton key={index} className="h-[250px] rounded-lg" />
        ))}
      </div>
    )
  }
  
  // If no cohorts, show empty message
  if (!cohorts || cohorts.length === 0) {
    return (
      <Card className="border-border bg-card text-card-foreground">
        <CardContent className="text-center py-12 text-muted-foreground italic">
          <p>{emptyMessage}</p>
          <p className="text-sm mt-2">Check back later for updates.</p>
        </CardContent>
      </Card>
    )
  }
  
  // Add view details capability to each cohort
  const enhancedCohorts = cohorts.map(cohort => ({
    ...cohort,
    onViewDetails: (c) => setSelectedProgram(c)
  }))
  
  // Handle apply
  const handleProgramApply = (cohort) => {
    setSelectedProgram(null) // Close modal if open
    
    if (onApplySuccess) {
      onApplySuccess(cohort)
    }
  }
  
  return (
    <>
      <div className={`grid grid-cols-1 ${columns.md > 1 ? `md:grid-cols-${columns.md}` : ''} ${columns.lg > 1 ? `lg:grid-cols-${columns.lg}` : ''} gap-5 w-full`}>
        {enhancedCohorts.map(cohort => (
          <CohortCard 
            key={cohort.id} 
            cohort={cohort} 
            profile={profile}
            applications={applications}
            onApply={onApply} // Pass the onApply callback through to the CohortCard
            onApplySuccess={onApplySuccess}
          />
        ))}
      </div>
      
      {/* Program Detail Modal */}
      <ProgramDetailModal 
        cohort={selectedProgram}
        profile={profile}
        isOpen={!!selectedProgram}
        onClose={() => setSelectedProgram(null)}
        onApply={handleProgramApply}
        applications={applications}
      />
    </>
  )
}

export default CohortGrid