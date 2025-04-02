"use client"

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Import all hooks directly from the hooks index file for centralized access
import { useUpdateProfile, useAllMajors, useCompositeProfile } from '@/lib/airtable/hooks';

/**
 * ProfileEditModal Component - Fully refactored to use shadcn/ui Dialog pattern
 * 
 * This component follows best practices for modal dialogs:
 * 1. Uses uncontrolled Dialog pattern from shadcn/ui
 * 2. Pulls data using React Query hooks
 * 3. Handles form state and submissions properly
 * 
 * @param {Object} props Component props
 * @param {Object} props.profile User profile data (optional, will fetch if not provided)
 * @param {Function} props.onSave Callback when profile is saved successfully 
 * @param {Function} props.onClose Callback when dialog is closed
 */
const ProfileEditModal = ({ profile: providedProfile, onSave, onClose }) => {
  const queryClient = useQueryClient();
  
  // Use the composite profile hook to ensure we have complete profile data
  const {
    data: fetchedProfile,
    isLoading: isProfileLoading,
    error: profileError
  } = useCompositeProfile({
    // Always enabled to ensure we have the latest data
    enabled: true,
    staleTime: 30 * 1000 // 30 seconds
  });
  
  // Use provided profile or fetched profile
  const profile = providedProfile || fetchedProfile;
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    degreeType: "",
    major: "",
    majorName: "", 
    graduationYear: "",
    educationId: null,
    institutionId: null,
    contactId: null,
  });
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Use the mutation hook
  const updateProfile = useUpdateProfile();
  
  // Fetch majors
  const { 
    data: majors = [], 
    isLoading: isLoadingMajors 
  } = useAllMajors();
  
  // Update form when profile data changes
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        degreeType: profile.degreeType || "",
        major: (profile.programId && profile.programId.startsWith('rec')) 
          ? profile.programId 
          : (profile.major && profile.major.startsWith('rec') 
            ? profile.major
            : ""), 
        majorName: profile.majorName || profile.major || "",
        graduationYear: profile.graduationYear || "",
        educationId: profile.educationId || profile.education?.id || null,
        institutionId: profile.institutionId || profile.institution?.id || null,
        contactId: profile.contactId || null
      });
      
      // Reset submission state
      setIsSubmitting(false);
      setError(null);
    }
  }, [profile]);
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special validation for graduation year
    if (name === "graduationYear") {
      const onlyDigits = value.replace(/\D/g, '');
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
  
  // Handle select changes
  const handleSelectChange = (name, value) => {
    if (name === "major") {
      const selectedMajor = majors.find(m => m.id === value);
      if (selectedMajor) {
        setFormData(prev => ({
          ...prev,
          major: value,
          majorName: selectedMajor.name
        }));
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Form validation
  const validateForm = () => {
    // Validate graduation year
    const { graduationYear } = formData;
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
    
    // Required fields
    if (!formData.firstName?.trim()) {
      setError("First name is required");
      return false;
    }
    
    if (!formData.lastName?.trim()) {
      setError("Last name is required");
      return false;
    }
    
    return true;
  };
  
  // Form submission
  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    // Don't allow multiple submissions
    if (isSubmitting) return;
    
    setError(null);
    setIsSubmitting(true);
    
    // Validate the form
    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Process form data (esp. handle major field)
      const processedData = { ...formData };
      
      // Process major field - must be a valid Airtable record ID
      if (processedData.major && !processedData.major.startsWith('rec')) {
        // Try to match by name
        const matchingMajor = majors.find(m => m.name === processedData.major);
        
        if (matchingMajor) {
          processedData.major = matchingMajor.id;
        } else if (profile?.programId && profile.programId.startsWith('rec')) {
          processedData.major = profile.programId;
        } else {
          processedData.major = null;
        }
      }
      
      // Ensure we have the contact ID
      const updateData = {
        ...processedData,
        contactId: processedData.contactId || profile?.contactId
      };
      
      // Submit the update
      await updateProfile.mutateAsync(updateData);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['contact', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['education', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'composed'] });
      
      // Call onSave callback with the updated data
      onSave?.(updateData);
      
      // Close the modal
      onClose?.();
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Loading state
  if (isProfileLoading && !profile) {
    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
          <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
          <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
          <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
        </div>
      </DialogContent>
    );
  }
  
  // Error state
  if (profileError && !profile) {
    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Error Loading Profile</DialogTitle>
        </DialogHeader>
        <Alert variant="destructive">
          <AlertDescription>
            {profileError.message || "Failed to load profile data"}
          </AlertDescription>
        </Alert>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    );
  }
  
  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Edit Profile</DialogTitle>
      </DialogHeader>
      
      {error && (
        <Alert variant="destructive" className="my-2">
          <AlertDescription>{error}</AlertDescription>
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
            <Input
              id="institution"
              value={profile?.institutionName || profile?.institution?.name || "Not specified"}
              className="bg-muted"
              disabled
            />
            <p className="text-xs text-muted-foreground">
              Institution cannot be changed. Contact support if needed.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="degreeType">Degree Type</Label>
              <Select 
                value={formData.degreeType} 
                onValueChange={(value) => handleSelectChange("degreeType", value)}
              >
                <SelectTrigger id="degreeType">
                  <SelectValue placeholder="Select Degree Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                  <SelectItem value="Graduate">Graduate</SelectItem>
                  <SelectItem value="Doctorate">Doctorate</SelectItem>
                  <SelectItem value="Certificate">Certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="major">Major/Field of Study</Label>
              {isLoadingMajors ? (
                <div className="text-sm text-muted-foreground italic p-2">Loading majors...</div>
              ) : (
                <Select
                  value={formData.major}
                  onValueChange={(value) => handleSelectChange("major", value)}
                >
                  <SelectTrigger id="major">
                    <SelectValue placeholder="Select a Major" />
                  </SelectTrigger>
                  <SelectContent>
                    {majors
                      .filter(major => major.id && major.id.startsWith('rec'))
                      .map(major => (
                        <SelectItem key={major.id} value={major.id}>
                          {major.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              )}
            </div>
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
            />
            <p className="text-xs text-muted-foreground">
              Enter 4-digit year (e.g., 2025)
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default ProfileEditModal;