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
    major: profile?.programId || "", // Use programId for the value
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
  
  // Reset form when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        degreeType: profile.degreeType || "",
        major: profile.programId || "",
        graduationYear: profile.graduationYear || "",
        educationId: profile.educationId || null,
        institutionId: profile.institution?.id || null,
      });
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
      
      // Add contact ID and institution ID to the data
      const updateData = {
        ...formData,
        contactId: profile.contactId,
        institutionId: formData.institutionId || profile.institution?.id
      };
      
      // Form is ready to be submitted
      
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
                        value={formData.major}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md"
                        required={profile.showMajor}
                      >
                        <option value="">Select a Major</option>
                        {majors.map(major => (
                          <option key={major.id} value={major.id}>
                            {major.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Major ID: {formData.major || '(none selected)'}
                      </p>
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