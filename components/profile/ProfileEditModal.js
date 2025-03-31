"use client"

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMajors, updateProfileData } from "@/lib/useDataFetching";

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
  });
  
  // Track submission state with multiple flags for better control
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false); // Track if a submission has happened
  const [wasSuccessful, setWasSuccessful] = useState(false); // Track if the submission succeeded
  const [error, setError] = useState(null);
  
  // Use our custom hook to fetch and cache majors
  const { 
    data: majors = [], 
    isLoading: isLoadingMajors, 
    error: majorsError 
  } = useMajors();
  
  // Removed major debugging useEffect
  
  // Reset form and submission state when profile changes or modal is opened/closed
  useEffect(() => {
    if (profile) {
      // Reset form data with profile values
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        degreeType: profile.degreeType || "",
        major: profile.programId && profile.programId.startsWith('rec') ? profile.programId : "", // Validate record ID
        majorName: profile.major || "", // Display name format
        graduationYear: profile.graduationYear || "",
        educationId: profile.educationId || null,
        institutionId: profile.institution?.id || null,
        programId: profile.programId // Keep original programId as a backup
      });
      
      // Reset submission tracking state on each new profile load
      setIsSubmitting(false);
      setHasSubmitted(false);
      setWasSuccessful(false);
      setError(null);
    }
  }, [profile, isOpen]);
  
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

  // Single submission entry point to ensure consistency
  const handleFormSubmission = async (e) => {
    // Immediately prevent any default form behavior
    if (e) e.preventDefault();
    
    // Clear previous submission state on new submission attempt
    setError(null);
    
    // Guard against double submissions or submitting after completion
    if (isSubmitting) {
      console.log(`Ignoring duplicate submission attempt - already submitting`);
      return; 
    }
    
    // If we previously submitted successfully, just close the modal
    if (hasSubmitted && wasSuccessful) {
      console.log('Already submitted successfully, closing modal');
      onClose();
      return;
    }
    
    // Set submission state
    setIsSubmitting(true);
    
    // Log that we're starting a submission attempt
    console.log("Beginning profile update submission...");

    // Define validation function separately for clarity
    const validateForm = () => {
      const validationErrors = [];
      
      // Validate graduation year
      const graduationYear = formData.graduationYear;
      if (graduationYear) {
        // Make sure it's 4 digits and a valid year
        const yearPattern = /^[0-9]{4}$/;
        if (!yearPattern.test(graduationYear)) {
          validationErrors.push("Please enter a valid 4-digit graduation year (e.g., 2025)");
          return false;
        }
        
        const yearValue = parseInt(graduationYear, 10);
        const currentYear = new Date().getFullYear();
        
        // Check if it's a reasonable graduation year
        if (yearValue < currentYear - 10 || yearValue > currentYear + 10) {
          validationErrors.push(`Graduation year ${yearValue} seems unusual. Please verify and try again.`);
          return false;
        }
      }
      
      // All validations passed
      return true;
    };
    
    // Process and normalize the form data to ensure it's in the correct format
    const processFormData = () => {
      // Create a deep copy to avoid mutating the original state object
      const processedFormData = JSON.parse(JSON.stringify(formData));
      
      // Validate major field format - must be a valid Airtable record ID
      if (processedFormData.major && typeof processedFormData.major === 'string') {
        if (!processedFormData.major.startsWith('rec')) {
          console.error(`Invalid major ID format: "${processedFormData.major}"`);
          
          // Try to find the correct record ID based on the name
          const majorName = processedFormData.major;
          const matchingMajor = majors.find(m => m.name === majorName);
          
          if (matchingMajor) {
            console.log(`Found matching major record ID for "${majorName}": ${matchingMajor.id}`);
            processedFormData.major = matchingMajor.id;
          } else if (processedFormData.programId && processedFormData.programId.startsWith('rec')) {
            // Fall back to the programId from the profile if it's valid
            console.log(`Falling back to profile programId: ${processedFormData.programId}`);
            processedFormData.major = processedFormData.programId;
          } else if (processedFormData.major.trim() === '') {
            // If it's an empty string, set to null to clear the field
            processedFormData.major = null;
          } else {
            // Last resort - if we can't resolve it, don't send an invalid value
            console.warn(`Unable to resolve major field: "${processedFormData.major}". Setting to null.`);
            processedFormData.major = null;
          }
        }
      } else if (processedFormData.major === undefined || processedFormData.major === null) {
        // Explicitly set to null for API handling
        processedFormData.major = null;
      }
      
      // Add contact ID and institution ID to the data
      return {
        ...processedFormData,
        contactId: profile.contactId,
        institutionId: processedFormData.institutionId || profile.institution?.id
      };
    };

    try {
      // Run validation
      if (!validateForm()) {
        throw new Error("Please correct the validation errors");
      }
      
      // Process the form data
      const updateData = processFormData();
      
      // Log what we're about to submit
      console.log("Submitting profile update:", {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        major: updateData.major,
        majorType: typeof updateData.major
      });
      
      try {
        // Log detailed profile update attempt
        console.log("Submitting profile update with credentials...", {
          firstName: updateData.firstName,
          lastName: updateData.lastName,
          hasMajor: !!updateData.major,
          majorType: typeof updateData.major
        });
        
        // Mark as submitted to prevent double submissions
        setHasSubmitted(true);
        
        // Use our centralized update function with cache invalidation
        // This now includes credentials: 'include' to ensure cookies are sent
        const updatedProfile = await updateProfileData(updateData, queryClient);
        
        // Mark success state
        setWasSuccessful(true);
        console.log("Profile update successful!");
        
        // Small delay to ensure state updates are processed before proceeding
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Call the component's onSave callback with the updated profile
        if (onSave && typeof onSave === 'function') {
          onSave(updatedProfile);
        }
        
        // Close the modal
        onClose();
      } catch (updateError) {
        console.error("Error updating profile:", updateError);
        
        // Handle authentication errors specially
        if (updateError.message === "Not authenticated" || 
            updateError.message?.includes("Session expired") ||
            updateError.message?.includes("Invalid session") ||
            updateError.message?.includes("401")) {
          
          // Show a specific error for authentication issues
          setError(
            "Your session has expired. Please save your changes, refresh the page, and try again."
          );
          
          // Suggest refreshing the page to fix auth issues
          console.log("Auth error detected, user should refresh the page to restore session");
        } else {
          // For other errors, show the message or a generic fallback
          setError(updateError.message || "Failed to update profile");
        }
        
        // Allow resubmission if the error is recoverable - but only for non-success cases
        setHasSubmitted(false);
        setWasSuccessful(false);
      }
    } catch (validationErr) {
      console.error("Error in profile validation:", validationErr);
      setError(validationErr.message || "Failed to validate profile data");
      
      // Allow resubmission if validation fails
      setHasSubmitted(false);
    } finally {
      setIsSubmitting(false);
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
              disabled={isSubmitting || hasSubmitted}
              className={wasSuccessful ? "bg-green-600 hover:bg-green-700" : ""}
              onClick={handleFormSubmission}
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