"use client"

import { createContext, useContext, useMemo } from "react"
import { useUser } from "@auth0/nextjs-auth0"
import { useQueryClient } from "@tanstack/react-query"
import { 
  useMyEducation, 
  useUpdateEducation,
  useEducation
} from "@/lib/airtable/hooks"

/**
 * Context for education-related data and operations
 */
const EducationContext = createContext(null)

/**
 * Provider component for education data and operations
 */
export function EducationProvider({ children }) {
  const { user } = useUser()
  const queryClient = useQueryClient()
  const userId = user?.sub
  
  // Fetch user's education data using domain-specific hooks
  const { 
    data: education, 
    isLoading: isEducationLoading, 
    error: educationError,
    refetch: refetchEducation
  } = useMyEducation()
  
  // Mutation hook for updating education
  const updateEducationMutation = useUpdateEducation()
  
  /**
   * Updates the user's education information
   * @param {Object} educationData - Education data to update
   * @returns {Promise<Object>} Updated education data
   */
  const updateEducationInfo = async (educationData) => {
    try {
      const result = await updateEducationMutation.mutateAsync(educationData)
      return result?.education || null
    } catch (error) {
      console.error("Failed to update education information:", error)
      throw error
    }
  }
  
  /**
   * Fetches education details for a specific education record
   * @param {string} educationId - Education record ID
   * @returns {Promise<Object>} Education details
   */
  const fetchEducationDetails = async (educationId) => {
    if (!educationId) return null
    
    try {
      // Directly use the query client to fetch education record
      const data = await queryClient.fetchQuery({
        queryKey: ['education', educationId],
        queryFn: async () => {
          const response = await fetch(`/api/education/${educationId}`)
          if (!response.ok) {
            throw new Error(`Failed to fetch education: ${response.status}`)
          }
          const data = await response.json()
          return data.education
        },
        staleTime: 300000 // 5 minutes
      })
      
      return data
    } catch (error) {
      console.error(`Failed to fetch education details for ID ${educationId}:`, error)
      return null
    }
  }
  
  /**
   * Determines if the user has completed their education profile
   */
  const hasCompletedEducationProfile = useMemo(() => {
    if (!education || !education.exists) return false
    
    // Verify essential education fields are present
    const hasInstitution = !!education.institutionName || !!education.institution
    const hasDegree = !!education.degreeType
    const hasMajor = !!education.majorName || !!education.major
    const hasGraduationInfo = !!education.graduationYear
    
    return hasInstitution && hasDegree && hasMajor && hasGraduationInfo
  }, [education])
  
  // Create the context value object
  const contextValue = {
    // Education data
    education,
    educationId: education?.id,
    isEducationLoading,
    educationError,
    hasCompletedEducationProfile,
    
    // Education operations
    updateEducation: updateEducationInfo,
    fetchEducationDetails,
    refetchEducation,
    
    // Mutation state
    isUpdatingEducation: updateEducationMutation.isPending,
    updateEducationError: updateEducationMutation.error
  }
  
  return (
    <EducationContext.Provider value={contextValue}>
      {children}
    </EducationContext.Provider>
  )
}

/**
 * Hook to use the education context
 * @returns {Object} Education context value
 */
export function useEducationContext() {
  const context = useContext(EducationContext)
  if (context === null) {
    throw new Error("useEducationContext must be used within an EducationProvider")
  }
  return context
}