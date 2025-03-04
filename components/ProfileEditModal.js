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
    major: profile?.programId || "", // Use programId for the value (should be Airtable record ID)
    majorName: profile?.major || "", // Store the name for display purposes
    graduationYear: profile?.graduationYear || "",
    educationId: profile?.educationId || null,
    institutionId: profile?.institution?.id || null,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Use our custom hook to fetch and cache majors
  const { 
    data: majors = [], 
    isLoading: isLoadingMajors, 
    error: majorsError 
  } = useMajors();
  
  // Log majors when they load to debug
  useEffect(() => {
    if (majors && majors.length > 0) {
      console.log(`Loaded ${majors.length} majors, first 3:`, majors.slice(0, 3));
      
      // Check if any majors have invalid IDs (not starting with 'rec')
      const invalidMajors = majors.filter(m => !m.id.startsWith('rec'));
      if (invalidMajors.length > 0) {
        console.warn(`Found ${invalidMajors.length} majors with invalid ID format:`, 
          invalidMajors.slice(0, 3));
      }
    }
  }, [majors]);
  
  // Reset form when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        degreeType: profile.degreeType || "",
        major: profile.programId || "", // Record ID format
        majorName: profile.major || "", // Display name format
        graduationYear: profile.graduationYear || "",
        educationId: profile.educationId || null,
        institutionId: profile.institution?.id || null,
      });
      
      // Validate profile data for debugging
      if (profile.programId && !profile.programId.startsWith('rec')) {
        console.warn(`Profile contains invalid major ID format: "${profile.programId}"`);
      }
    }
  }, [profile]);

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
      console.log(`Setting major value: "${value}" (${typeof value})`);
      
      // Check if this is a valid Airtable ID format
      if (!value.startsWith('rec') && value) {
        console.warn(`Warning: Major value doesn't appear to be a valid Airtable record ID: ${value}`);
      }
      
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate graduation year
      const graduationYear = formData.graduationYear;
      if (graduationYear) {
        // Make sure it's 4 digits and a valid year
        const yearPattern = /^[0-9]{4}$/;
        if (!yearPattern.test(graduationYear)) {
          throw new Error("Please enter a valid 4-digit graduation year (e.g., 2025)");
        }
        
        const yearValue = parseInt(graduationYear, 10);
        const currentYear = new Date().getFullYear();
        
        // Check if it's a reasonable graduation year (not too far in past or future)
        if (yearValue < currentYear - 10 || yearValue > currentYear + 10) {
          throw new Error(`Graduation year ${yearValue} seems unusual. Please verify and try again.`);
        }
      }
      
      // Validate major field format - must be a valid Airtable record ID
      if (formData.major && typeof formData.major === 'string' && !formData.major.startsWith('rec')) {
        console.error(`Invalid major ID format: "${formData.major}"`);
        
        // Try to find the correct record ID based on the name
        const majorName = formData.major;
        const matchingMajor = majors.find(m => m.name === majorName);
        
        if (matchingMajor) {
          console.log(`Found matching major record ID for "${majorName}": ${matchingMajor.id}`);
          // Replace the text value with the record ID
          formData.major = matchingMajor.id;
        } else {
          throw new Error(`Invalid major format. Please select a major from the dropdown.`);
        }
      }
      
      // Add contact ID and institution ID to the data
      const updateData = {
        ...formData,
        contactId: profile.contactId,
        institutionId: formData.institutionId || profile.institution?.id
      };
      
      // Log what we're about to submit
      console.log("Submitting profile update:", {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        major: updateData.major,
        majorType: typeof updateData.major
      });
      
      // Use our centralized update function with cache invalidation
      const updatedProfile = await updateProfileData(updateData, queryClient);
      
      // Call the component's onSave callback with the updated profile
      if (onSave) {
        onSave(updatedProfile);
      }
      
      onClose();
    } catch (err) {
      console.error("Error in profile submission:", err);
      setError(err.message || "Failed to update profile");
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
        if (!open) onClose();
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
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
                      <div className="flex flex-col text-xs bg-gray-50 p-2 mt-1 rounded border">
                        <p className="font-medium">Debug Information:</p>
                        <p>
                          Major ID: <code className="bg-gray-100 px-1">{formData.major || '(none selected)'}</code>
                        </p>
                        <p>
                          Selected: <code className="bg-gray-100 px-1">{majors.find(m => m.id === formData.major)?.name || 'None'}</code>
                        </p>
                        <p className="text-xs text-red-600">
                          {!formData.major?.startsWith('rec') && formData.major 
                            ? '⚠️ Warning: Major ID does not appear to be a valid Airtable record ID!' 
                            : ''}
                        </p>
                      </div>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditModal;