"use client"

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
// Import all hooks directly from the hooks index file for centralized access
import { 
  useUpdateProfile, 
  useAllMajors, 
  useCompositeProfile 
} from '@/lib/airtable/hooks';

const ProfileEditModal = ({ isOpen, onClose, profile, onSave }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    degreeType: profile?.degreeType || "",
    major: profile?.programId && profile?.programId.startsWith('rec') ? profile.programId : "", // Ensure it's a valid record ID
    majorName: profile?.major || "", // Store the name for display purposes
    graduationYear: profile?.graduationYear || "",
    educationId: profile?.educationId || null,
    institutionId: profile?.institution?.id || null,
    contactId: profile?.contactId || null, // Ensure we have the contact ID for the update
  });
  
  // Use TanStack Query's mutation hook for profile updates
  const updateProfile = useUpdateProfile();
  
  // Track submission state with multiple flags for better control
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false); // Track if a submission has happened
  const [wasSuccessful, setWasSuccessful] = useState(false); // Track if the submission succeeded
  const [error, setError] = useState(null);
  
  // Use the composite profile hook to fetch complete profile data if not provided
  const {
    data: composedProfile,
    isLoading: isLoadingProfile
  } = useCompositeProfile({
    // Only fetch if we're open and don't have a profile provided
    enabled: isOpen && !profile,
    // Stale time of 1 minute for quick refreshes
    staleTime: 60 * 1000
  });

  // Use the DDD hook to fetch majors
  const { 
    data: majors = [], 
    isLoading: isLoadingMajors, 
    error: majorsError 
  } = useAllMajors();
  
  // Removed major debugging useEffect
  
  // Reset form and submission state when profile changes or modal is opened/closed
  useEffect(() => {
    // Use the provided profile or the composed profile from our DDD hook
    const profileData = profile || composedProfile;
    
    if (profileData) {
      // Reset form data with profile values
      setFormData({
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        degreeType: profileData.degreeType || "",
        // Support both profileData.programId and profileData.major (which might be a record ID)
        major: (profileData.programId && profileData.programId.startsWith('rec')) 
          ? profileData.programId 
          : (profileData.major && profileData.major.startsWith('rec') 
            ? profileData.major
            : ""), 
        majorName: profileData.majorName || profileData.major || "", // Store the name for display purposes
        graduationYear: profileData.graduationYear || "",
        educationId: profileData.educationId || profileData.education?.id || null,
        institutionId: profileData.institutionId || profileData.institution?.id || null,
        contactId: profileData.contactId || null, // Ensure we have the contact ID for the update
        programId: profileData.programId // Keep original programId as a backup
      });
      
      // Reset submission tracking state on each new profile load
      setIsSubmitting(false);
      setHasSubmitted(false);
      setWasSuccessful(false);
      setError(null);
    }
  }, [profile, composedProfile, isOpen]);
  
  // Reset submission state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      setHasSubmitted(false);
      setWasSuccessful(false);
      setError(null);
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special validation for graduation year - ensure it's a valid year format
    if (name === "graduationYear") {
      // Only allow digits
      const onlyDigits = value.replace(/\D/g, '');
      
      // Limit to 4 digits
      const yearValue = onlyDigits.slice(0, 4);
      
      setFormData(prev => ({
        ...prev,
        [name]: yearValue
      }));
      return;
    }
    
    // For major field, handle special selection logic
    if (name === "major") {
      // When major is selected, also update majorName for display
      if (value) {
        const selectedMajor = majors.find(m => m.id === value);
        if (selectedMajor) {
          setFormData(prev => ({
            ...prev,
            major: value,
            majorName: selectedMajor.name
          }));
          return; // Skip the general update since we're doing a custom one
        }
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Handle form submission with proper TanStack Query integration
   * 
   * This function:
   * 1. Validates the form data
   * 2. Processes the form data to ensure it's in the correct format
   * 3. Triggers the mutation using TanStack Query
   * 4. Handles success and error states
   */
  const handleFormSubmission = async (e) => {
    // Prevent any default browser form submission behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Reset error state
    setError(null);
    
    // Don't allow submitting if we're already in progress
    if (isSubmitting) {
      console.log(`Ignoring duplicate submission - already in progress`);
      return; 
    }
    
    // If already submitted successfully, just close the modal
    if (hasSubmitted && wasSuccessful) {
      console.log('Already submitted successfully, closing modal');
      onClose();
      return;
    }
    
    // Mark submission as started
    setIsSubmitting(true);
    console.log("Beginning profile update submission...");

    /**
     * Validate the form input values
     * @returns {boolean} Whether the form is valid
     */
    const validateForm = () => {
      // Validate graduation year
      const graduationYear = formData.graduationYear;
      if (graduationYear) {
        // Ensure it's a 4-digit year
        const yearPattern = /^[0-9]{4}$/;
        if (!yearPattern.test(graduationYear)) {
          setError("Please enter a valid 4-digit graduation year (e.g., 2025)");
          return false;
        }
        
        // Ensure the year is within a reasonable range
        const yearValue = parseInt(graduationYear, 10);
        const currentYear = new Date().getFullYear();
        if (yearValue < currentYear - 10 || yearValue > currentYear + 10) {
          setError(`Graduation year ${yearValue} seems unusual. Please verify.`);
          return false;
        }
      }
      
      // Add validation for required fields
      if (!formData.firstName?.trim()) {
        setError("First name is required");
        return false;
      }
      
      if (!formData.lastName?.trim()) {
        setError("Last name is required");
        return false;
      }
      
      // All validations passed
      return true;
    };
    
    /**
     * Process and normalize the form data for the API
     * @returns {Object} Processed form data
     */
    const processFormData = () => {
      // Create a deep copy to avoid mutating state
      const processedFormData = JSON.parse(JSON.stringify(formData));
      
      // Process major field - must be a valid Airtable record ID
      if (processedFormData.major && typeof processedFormData.major === 'string') {
        // Ensure it's a valid Airtable record ID (starts with 'rec')
        if (!processedFormData.major.startsWith('rec')) {
          console.log(`Processing non-standard major: "${processedFormData.major}"`);
          
          // Try to match by name in the majors list
          const majorName = processedFormData.major;
          const matchingMajor = majors.find(m => m.name === majorName);
          
          if (matchingMajor) {
            // Found a match by name
            console.log(`Found matching major ID: ${matchingMajor.id}`);
            processedFormData.major = matchingMajor.id;
          } else if (processedFormData.programId && processedFormData.programId.startsWith('rec')) {
            // Fall back to existing programId
            console.log(`Using existing programId: ${processedFormData.programId}`);
            processedFormData.major = processedFormData.programId;
          } else if (processedFormData.major.trim() === '') {
            // Empty string = null (clear the field)
            processedFormData.major = null;
          } else {
            // Unresolvable value - set to null
            console.warn(`Unable to resolve major: "${processedFormData.major}"`);
            processedFormData.major = null;
          }
        }
      } else {
        // Explicit null for empty major
        processedFormData.major = null;
      }
      
      // Ensure we have the proper IDs for the update
      // Prioritize in this order:
      // 1. Form data
      // 2. Provided profile data
      // 3. Composed profile data (from our DDD hooks)
      return {
        ...processedFormData,
        // Contact ID is required for updates
        contactId: processedFormData.contactId || 
                  profile?.contactId || 
                  composedProfile?.contactId,
        // Institution ID may be needed for some updates
        institutionId: processedFormData.institutionId || 
                      profile?.institution?.id || 
                      composedProfile?.institution?.id
      };
    };

    try {
      // Step 1: Validate the form
      if (!validateForm()) {
        // Validation failed, allow resubmission
        setIsSubmitting(false);
        return;
      }
      
      // Step 2: Process the form data
      const updateData = processFormData();
      
      // Step 3: Mark submission as in progress
      setHasSubmitted(true);
      
      // Log what we're submitting
      console.log("Submitting profile update:", {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        major: updateData.major
      });
      
      // Step 4: Trigger the mutation using TanStack Query's mutation hook
      // The mutation hook handles:
      // - Optimistic updates (updating UI before API completes)
      // - Error handling with automatic rollback
      // - Proper cache invalidation to update all components
      updateProfile.mutate(updateData, {
        // These callbacks apply to this specific mutation call
        // They supplement (not replace) the ones defined in the mutation hook
        onSuccess: (data) => {
          // Update component state on success
          setWasSuccessful(true);
          setIsSubmitting(false);
          console.log("Profile update completed successfully");
          
          // Call the component's onSave callback with the updated profile
          if (onSave && typeof onSave === 'function') {
            onSave(data);
          }
          
          // Invalidate related queries to ensure consistent UI state
          // This is also done in the hook's onSuccess, but we do it here too
          // to ensure proper timing with the modal closing
          queryClient.invalidateQueries({ queryKey: ['profile'] });
          queryClient.invalidateQueries({ queryKey: ['contact', 'current'] });
          queryClient.invalidateQueries({ queryKey: ['education', 'user'] });
          queryClient.invalidateQueries({ queryKey: ['profile', 'composed'] });
          
          // Close the modal after a short delay
          setTimeout(() => onClose(), 100);
        },
        onError: (error) => {
          // Handle errors specific to this component
          console.error("Profile update failed:", error);
          setIsSubmitting(false);
          setHasSubmitted(false);
          setError(error.message || "Failed to update profile");
        }
      });
    } catch (error) {
      // Handle general errors (like validation failures or other JS errors)
      console.error("Error in profile update process:", error);
      
      // Display the error message
      setError(error.message || "An unexpected error occurred");
      
      // Reset submission state to allow retrying
      setIsSubmitting(false);
      setHasSubmitted(false);
    }
  };

  // Log modal state for debugging
  if (isOpen) {
    console.log("ProfileEditModal opened");
  }
  
  // Debug only key profile fields related to the major/programId
  console.log("Profile programId:", profile?.programId);
  
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Only allow closing if we're not in the middle of submitting
        if (!open && !isSubmitting) {
          onClose();
        } else if (!open && isSubmitting) {
          // Don't allow closing during submission
          console.log("Preventing dialog close during submission");
          return false;
        }
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="my-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {majorsError && profile?.showMajor && (
          <Alert variant="destructive" className="my-2">
            <AlertDescription>Failed to load majors: {majorsError.message}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-6">
          {/* Replaced form element with div to eliminate accidental submissions */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold border-b pb-2">Personal Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold border-b pb-2">Academic Information</h4>
            
            <div className="space-y-2">
              <Label htmlFor="institution">Institution</Label>
              {profile.needsInstitutionConfirm && profile.suggestedInstitution ? (
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200 space-y-2">
                  <p className="text-sm">Based on your email domain, we suggest:</p>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="suggestedInstitution"
                      name="institutionId"
                      value={profile.suggestedInstitution.id}
                      checked={formData.institutionId === profile.suggestedInstitution.id}
                      onChange={handleInputChange}
                      className="rounded-sm"
                    />
                    <Label htmlFor="suggestedInstitution" className="font-medium cursor-pointer">
                      {profile.suggestedInstitution.name}
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="noInstitution"
                      name="institutionId"
                      value=""
                      checked={!formData.institutionId}
                      onChange={() => setFormData(prev => ({...prev, institutionId: null}))}
                      className="rounded-sm"
                    />
                    <Label htmlFor="noInstitution" className="font-medium cursor-pointer">
                      None of the above / Other Institution
                    </Label>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Please confirm your institution to see relevant programs.
                  </p>
                </div>
              ) : (
                <div>
                  <Input
                    id="institution"
                    value={profile.institutionName || profile.institution?.name || "Not specified"}
                    className="bg-muted"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Institution cannot be changed. Contact support if needed.
                  </p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="degreeType">Degree Type</Label>
                <select
                  id="degreeType"
                  name="degreeType"
                  value={formData.degreeType}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select Degree Type</option>
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Doctorate">Doctorate</option>
                  <option value="Certificate">Certificate</option>
                </select>
              </div>
              
              {profile.showMajor && (
                <div className="space-y-2">
                  <Label htmlFor="major">Major/Field of Study</Label>
                  {isLoadingMajors ? (
                    <div className="text-sm text-muted-foreground italic p-2">Loading majors...</div>
                  ) : (
                    <div>
                      <select
                        id="major"
                        name="major"
                        value={formData.major || ""}
                        onChange={(e) => {
                          const selectedValue = e.target.value;
                          // Log the selection in detail
                          console.log(`Major selection changed to: "${selectedValue}"`);
                          
                          // Validate the value is a valid Airtable ID
                          if (selectedValue && !selectedValue.startsWith('rec')) {
                            console.warn(`Selected major value is not a valid Airtable ID: ${selectedValue}`);
                          }
                          
                          // Use our existing handler
                          handleInputChange(e);
                        }}
                        className="w-full p-2 border rounded-md"
                        required={profile.showMajor}
                      >
                        <option value="">Select a Major</option>
                        {majors
                          // Only include majors with valid IDs
                          .filter(major => major.id && major.id.startsWith('rec'))
                          .map(major => (
                            <option key={major.id} value={major.id}>
                              {major.name}
                            </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="graduationYear">Expected Graduation Year</Label>
              <Input
                id="graduationYear"
                name="graduationYear"
                value={formData.graduationYear}
                onChange={handleInputChange}
                placeholder="YYYY"
                maxLength="4"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter 4-digit year (e.g., 2025)
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="button" 
              disabled={isSubmitting}
              className={wasSuccessful ? "bg-green-600 hover:bg-green-700" : ""}
              onClick={(e) => {
                // Explicitly prevent any default browser behaviors
                e.preventDefault();
                e.stopPropagation();
                
                // Avoid any form submission, handle everything through TanStack Query
                handleFormSubmission(e);
                
                // Return false to further prevent any default behaviors
                return false;
              }}
            >
              {isSubmitting 
                ? "Saving..." 
                : wasSuccessful 
                  ? "Saved Successfully" 
                  : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditModal;