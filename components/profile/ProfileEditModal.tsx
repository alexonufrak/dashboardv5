import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Alert,
  Button
} from "@heroui/react";

import { useMajors, updateProfileData } from "@/lib/useDataFetching";

// Define the major type
interface Major {
  id: string;
  name: string;
  [key: string]: any;
}

// Define the profile type
interface ProfileType {
  firstName?: string;
  lastName?: string;
  degreeType?: string;
  major?: string;
  programId?: string;
  graduationYear?: string;
  educationId?: string | null;
  institution?: {
    id?: string;
    name?: string;
  };
  institutionName?: string;
  needsInstitutionConfirm?: boolean;
  suggestedInstitution?: {
    id: string;
    name: string;
  };
  showMajor?: boolean;
  contactId?: string;
}

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileType | null;
  onSave?: (updatedProfile: ProfileType) => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ 
  isOpen, 
  onClose, 
  profile, 
  onSave 
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    degreeType: "",
    major: "",
    majorName: "",
    graduationYear: "",
    educationId: null as string | null,
    institutionId: null as string | null,
    programId: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use our custom hook to fetch and cache majors
  const { 
    data: majors = [] as Major[], 
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
        major: profile.programId && profile.programId.startsWith('rec') ? profile.programId : "", 
        majorName: profile.major || "",
        graduationYear: profile.graduationYear || "",
        educationId: profile.educationId || null,
        institutionId: profile.institution?.id || null,
        programId: profile.programId || "" // Keep original programId as a backup
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        const selectedMajor = majors.find((m: Major) => m.id === value);
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

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      if (formData.major && typeof formData.major === 'string') {
        if (!formData.major.startsWith('rec')) {
          console.error(`Invalid major ID format: "${formData.major}"`);
          
          // Try to find the correct record ID based on the name
          const majorName = formData.major;
          const matchingMajor = majors.find((m: Major) => m.name === majorName);
          
          if (matchingMajor) {
            console.log(`Found matching major record ID for "${majorName}": ${matchingMajor.id}`);
            // Replace the text value with the record ID
            formData.major = matchingMajor.id;
          } else if (formData.programId && formData.programId.startsWith('rec')) {
            // Fall back to the programId from the profile if it's valid
            console.log(`Falling back to profile programId: ${formData.programId}`);
            formData.major = formData.programId;
          } else if (formData.major.trim() === '') {
            // If it's an empty string, set to null to clear the field
            formData.major = "";
          } else {
            // Last resort - if we can't resolve it, don't send an invalid value
            console.warn(`Unable to resolve major field: "${formData.major}". Setting to null.`);
            formData.major = "";
          }
        }
      }
      
      // Add contact ID and institution ID to the data
      const updateData = {
        ...formData,
        contactId: profile?.contactId,
        institutionId: formData.institutionId || profile?.institution?.id
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
    } catch (err: any) {
      console.error("Error in profile submission:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl"
    >
      <ModalContent>
        <ModalHeader>
          <h2 className="text-xl font-semibold">Edit Profile</h2>
        </ModalHeader>
        
        <ModalBody>
          {error && (
            <Alert 
              color="danger" 
              className="mb-4" 
              title="Error"
              description={error} 
            />
          )}
          
          {majorsError && profile?.showMajor && (
            <Alert 
              color="danger" 
              className="mb-4"
              title="Data Loading Error"
              description={`Failed to load majors: ${majorsError.message}`} 
            />
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold border-b pb-2">Personal Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="block text-sm font-medium">
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="block text-sm font-medium">
                    Last Name
                  </label>
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
                <label htmlFor="institution" className="block text-sm font-medium">
                  Institution
                </label>
                {profile?.needsInstitutionConfirm && profile.suggestedInstitution ? (
                  <div className="bg-primary-50 p-3 rounded-md border border-primary-100 space-y-2">
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
                      <label htmlFor="suggestedInstitution" className="font-medium cursor-pointer">
                        {profile.suggestedInstitution.name}
                      </label>
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
                      <label htmlFor="noInstitution" className="font-medium cursor-pointer">
                        None of the above / Other Institution
                      </label>
                    </div>
                    
                    <p className="text-xs text-default-500">
                      Please confirm your institution to see relevant programs.
                    </p>
                  </div>
                ) : (
                  <div>
                    <Input
                      id="institution"
                      value={profile?.institutionName || profile?.institution?.name || "Not specified"}
                      isDisabled
                      className="bg-default-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-default-500 mt-1">
                      Institution cannot be changed. Contact support if needed.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="degreeType" className="block text-sm font-medium">
                    Degree Type
                  </label>
                  <Select
                    id="degreeType"
                    selectedKeys={formData.degreeType ? [formData.degreeType] : []}
                    onChange={(keys: any) => handleSelectChange("degreeType", keys.target?.value || Array.from(keys)[0]?.toString() || "")}
                    required
                    items={[
                      { key: "", label: "Select Degree Type" },
                      { key: "Undergraduate", label: "Undergraduate" },
                      { key: "Graduate", label: "Graduate" },
                      { key: "Doctorate", label: "Doctorate" },
                      { key: "Certificate", label: "Certificate" }
                    ]}
                  >
                    {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
                  </Select>
                </div>
                
                {profile?.showMajor && (
                  <div className="space-y-2">
                    <label htmlFor="major" className="block text-sm font-medium">
                      Major/Field of Study
                    </label>
                    {isLoadingMajors ? (
                      <div className="text-sm text-default-500 italic p-2 border rounded-md bg-default-50">
                        Loading majors...
                      </div>
                    ) : (
                      <Select
                        id="major"
                        selectedKeys={formData.major ? [formData.major] : []}
                        onChange={(keys: any) => {
                          // Handle both event-style and Set-style onChange
                          const selectedValue = keys.target?.value || Array.from(keys)[0]?.toString() || "";
                          handleInputChange({
                            target: {
                              name: "major",
                              value: selectedValue
                            }
                          } as React.ChangeEvent<HTMLSelectElement>);
                        }}
                        required={profile.showMajor}
                        items={[
                          { key: "", label: "Select a Major" },
                          ...majors
                            .filter((major: Major) => major.id && major.id.startsWith('rec'))
                            .map((major: Major) => ({ key: major.id, label: major.name }))
                        ]}
                      >
                        {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
                      </Select>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="graduationYear" className="block text-sm font-medium">
                  Expected Graduation Year
                </label>
                <Input
                  id="graduationYear"
                  name="graduationYear"
                  value={formData.graduationYear}
                  onChange={handleInputChange}
                  placeholder="YYYY"
                  maxLength={4}
                  required
                />
                <p className="text-xs text-default-500">
                  Enter 4-digit year (e.g., 2025)
                </p>
              </div>
            </div>
          </form>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="flat" color="default" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            color="primary" 
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ProfileEditModal;