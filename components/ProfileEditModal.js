"use client"

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { AlertCircle, Loader2 } from "lucide-react";

const ProfileEditModal = ({ isOpen, onClose, profile, onSave }) => {
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
  const [majors, setMajors] = useState([]);
  const [isLoadingMajors, setIsLoadingMajors] = useState(false);

  // Fetch majors if this is for a UMD student (showMajor is true)
  useEffect(() => {
    if (isOpen && profile?.showMajor) {
      const fetchMajors = async () => {
        setIsLoadingMajors(true);
        try {
          const response = await fetch('/api/user/majors');
          if (!response.ok) {
            throw new Error('Failed to fetch majors');
          }
          const data = await response.json();
          setMajors(data.majors || []);
        } catch (err) {
          console.error('Error fetching majors:', err);
          setError('Failed to load majors. Please try again.');
        } finally {
          setIsLoadingMajors(false);
        }
      };
      
      fetchMajors();
    }
  }, [isOpen, profile?.showMajor]);

  if (!isOpen) return null;

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
      
      // Call the callback with the updated data
      await onSave(updateData);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <h4 className="text-base font-semibold border-b border-border pb-2">Personal Information</h4>
            <div className="grid gap-4 sm:grid-cols-2">
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
          
          <div className="space-y-5">
            <h4 className="text-base font-semibold border-b border-border pb-2">Academic Information</h4>
            
            <div className="space-y-2">
              <Label htmlFor="institution">Institution</Label>
              {profile.needsInstitutionConfirm && profile.suggestedInstitution ? (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3 space-y-3">
                  <p className="text-sm text-blue-800 dark:text-blue-300">Based on your email domain, we suggest:</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="suggestedInstitution"
                        name="institutionId"
                        value={profile.suggestedInstitution.id}
                        checked={formData.institutionId === profile.suggestedInstitution.id}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary"
                      />
                      <Label htmlFor="suggestedInstitution" className="text-sm font-medium">
                        {profile.suggestedInstitution.name}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="noInstitution"
                        name="institutionId"
                        value=""
                        checked={!formData.institutionId}
                        onChange={() => setFormData(prev => ({...prev, institutionId: null}))}
                        className="h-4 w-4 text-primary"
                      />
                      <Label htmlFor="noInstitution" className="text-sm font-medium">
                        None of the above / Other Institution
                      </Label>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Please confirm your institution to see relevant programs.
                  </p>
                </div>
              ) : (
                <>
                  <Input
                    id="institution"
                    value={profile.institutionName || profile.institution?.name || "Not specified"}
                    disabled
                    className="bg-muted text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Institution cannot be changed. Contact support if needed.
                  </p>
                </>
              )}
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="degreeType">Degree Type</Label>
                <select
                  id="degreeType"
                  name="degreeType"
                  value={formData.degreeType}
                  onChange={handleInputChange}
                  required
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                    <div className="flex h-10 items-center gap-2 text-muted-foreground text-sm italic">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading majors...
                    </div>
                  ) : (
                    <select
                      id="major"
                      name="major"
                      value={formData.major}
                      onChange={handleInputChange}
                      required={profile.showMajor}
                      className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select a Major</option>
                      {majors.map(major => (
                        <option key={major.id} value={major.id}>
                          {major.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="graduationYear">Expected Graduation Year</Label>
              <Input
                type="text"
                id="graduationYear"
                name="graduationYear"
                value={formData.graduationYear}
                onChange={handleInputChange}
                placeholder="YYYY"
                pattern="[0-9]{4}"
                inputMode="numeric"
                maxLength="4"
                title="Please enter a valid 4-digit year (e.g., 2025)"
                required
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditModal;