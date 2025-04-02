"use client"

import { createContext, useContext, useMemo } from "react"
import { useUser as useAuth0User } from "@auth0/nextjs-auth0/client"
import { useQueryClient } from "@tanstack/react-query"
import { 
  useProfileData, 
  useUpdateProfile,
  useUpdateOnboardingStatus
} from "@/lib/airtable/hooks"
import usersModule from "@/lib/airtable/entities/users"

/**
 * Context for user-related data and operations
 */
const UserContext = createContext(null)

/**
 * Provider component for user data and operations
 */
export function UserProvider({ children }) {
  // Auth0 user state
  const { user: auth0User, isLoading: isAuth0Loading, error: auth0Error } = useAuth0User()
  const queryClient = useQueryClient()
  
  // Fetch user profile data using domain-specific hooks
  const { 
    data: profile, 
    isLoading: isProfileLoading, 
    error: profileError,
    refetch: refetchProfile
  } = useProfileData()
  
  // Mutation hooks for user operations
  const updateProfileMutation = useUpdateProfile()
  const updateOnboardingStatusMutation = useUpdateOnboardingStatus()
  
  /**
   * Updates the user's profile information
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile
   */
  const updateUserProfile = async (profileData) => {
    try {
      return await updateProfileMutation.mutateAsync(profileData)
    } catch (error) {
      console.error("Failed to update profile:", error)
      throw error
    }
  }
  
  /**
   * Updates the user's onboarding status
   * @param {string} status - New status value
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Updated status
   */
  const updateOnboardingStatus = async (status = "Applied", options = {}) => {
    try {
      return await updateOnboardingStatusMutation.mutateAsync({
        contactId: profile?.contactId,
        status,
        ...options
      })
    } catch (error) {
      console.error("Failed to update onboarding status:", error)
      throw error
    }
  }
  
  /**
   * Enhanced user lookup function that tries multiple paths to find a user
   * @param {Object} identifiers - Object containing available identifiers (email, auth0Id, contactId)
   * @param {boolean} fetchDetails - Whether to fetch additional details
   * @returns {Promise<Object|null>} User object or null if not found
   */
  const findUser = async (identifiers, fetchDetails = false) => {
    try {
      // Use the optimized lookup function from the users entity module
      const user = await usersModule.findUserByAnyIdentifier(identifiers)
      
      if (!user) return null
      
      // If we don't need details, return basic user data
      if (!fetchDetails) return user
      
      // Fetch additional user details
      const userDetails = {
        ...user,
        applications: []
      }
      
      // Add applications if contactId is available
      if (user.contactId && fetchDetails) {
        try {
          const applications = await usersModule.fetchApplicationsByContactId(user.contactId)
          userDetails.applications = applications
          userDetails.hasApplications = applications.length > 0
        } catch (err) {
          console.error("Error fetching applications:", err)
          userDetails.applicationsError = err.message
        }
      }
      
      return userDetails
    } catch (error) {
      console.error("Error finding user:", error)
      return null
    }
  }
  
  /**
   * Determines if the user has completed their basic profile
   */
  const hasCompletedBasicProfile = useMemo(() => {
    if (!profile) return false
    
    // Check for essential profile fields
    return !!(
      profile.name &&
      profile.email &&
      profile.contactId
    )
  }, [profile])
  
  /**
   * Combined loading state for user data
   */
  const isLoading = isAuth0Loading || isProfileLoading
  
  /**
   * Combined error state for user data
   */
  const error = auth0Error || profileError
  
  // Create the context value object
  const contextValue = {
    // User auth data
    user: auth0User,
    isAuthenticated: !!auth0User,
    
    // Profile data
    profile,
    contactId: profile?.contactId,
    hasCompletedBasicProfile,
    
    // Loading and error states
    isLoading,
    error,
    
    // User operations
    updateProfile: updateUserProfile,
    updateOnboardingStatus,
    findUser,
    refetchProfile,
    
    // Mutation states
    isUpdatingProfile: updateProfileMutation.isPending,
    updateProfileError: updateProfileMutation.error,
    
    // Advanced user lookup tools
    userLookupTools: {
      findUser,
      findUserByAnyIdentifier: usersModule.findUserByAnyIdentifier,
      fetchApplicationsByContactId: usersModule.fetchApplicationsByContactId,
      findUserViaLinkedRecords: usersModule.findUserViaLinkedRecords
    }
  }
  
  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  )
}

/**
 * Hook to use the user context
 * @returns {Object} User context value
 */
export function useUserContext() {
  const context = useContext(UserContext)
  if (context === null) {
    throw new Error("useUserContext must be used within a UserProvider")
  }
  return context
}