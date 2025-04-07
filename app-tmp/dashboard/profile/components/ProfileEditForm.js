"use client"

import { useState, useEffect, useTransition, useOptimistic } from 'react'
import { updateProfile } from '@/app/actions/profile/update-profile'
import { useCompositeProfile, useAllMajors } from '@/lib/airtable/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

/**
 * ProfileEditForm - Client component that uses Server Actions for form submission
 * Demonstrates the proper pattern for forms with Server Actions in Next.js 14
 */
export default function ProfileEditForm({ isOpen, onClose }) {
  // Use the composite profile hook to fetch profile data
  const {
    data: profile,
    isLoading: isProfileLoading,
    refetch
  } = useCompositeProfile({
    enabled: isOpen,
    staleTime: 30 * 1000 // 30 seconds
  })

  // Fetch majors
  const { 
    data: majors = [], 
    isLoading: isLoadingMajors 
  } = useAllMajors()

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
  })

  // Server action state
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  // Set up optimistic UI (show immediate feedback before server responds)
  const [optimisticProfile, updateOptimisticProfile] = useOptimistic(
    profile,
    (state, newData) => ({
      ...state,
      ...newData,
    })
  )

  // Update form when profile data changes
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        degreeType: profile.degreeType || "",
        major: (profile.programId && typeof profile.programId === 'string' && profile.programId.startsWith('rec')) 
          ? profile.programId 
          : (profile.major && typeof profile.major === 'string' && profile.major.startsWith('rec') 
            ? profile.major
            : ""), 
        majorName: profile.majorName || profile.major || "",
        graduationYear: profile.graduationYear || "",
        educationId: profile.educationId || profile.education?.id || null,
        institutionId: profile.institutionId || profile.institution?.id || null,
        contactId: profile.contactId || null
      })
      
      // Reset error state
      setFormError(null)
      setFieldErrors({})
    }
  }, [profile])

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // Special validation for graduation year
    if (name === "graduationYear") {
      const onlyDigits = value.replace(/\D/g, '')
      const yearValue = onlyDigits.slice(0, 4)
      
      setFormData(prev => ({
        ...prev,
        [name]: yearValue
      }))
      return
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle select changes
  const handleSelectChange = (name, value) => {
    if (name === "major") {
      const selectedMajor = majors.find(m => m.id === value)
      if (selectedMajor) {
        setFormData(prev => ({
          ...prev,
          major: value,
          majorName: selectedMajor.name
        }))
        return
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Client-side form validation
  const validateForm = () => {
    const errors = {}
    let isValid = true

    // Validate required fields
    if (!formData.firstName?.trim()) {
      errors.firstName = "First name is required"
      isValid = false
    }
    
    if (!formData.lastName?.trim()) {
      errors.lastName = "Last name is required"
      isValid = false
    }

    // Validate graduation year
    if (formData.graduationYear) {
      // Ensure it's a 4-digit year
      const yearPattern = /^[0-9]{4}$/
      if (!yearPattern.test(formData.graduationYear)) {
        errors.graduationYear = "Please enter a valid 4-digit year (e.g., 2025)"
        isValid = false
      } else {
        // Ensure the year is within a reasonable range
        const yearValue = parseInt(formData.graduationYear, 10)
        const currentYear = new Date().getFullYear()
        if (yearValue < currentYear - 10 || yearValue > currentYear + 10) {
          errors.graduationYear = `Year ${yearValue} seems unusual. Please verify.`
          isValid = false
        }
      }
    }

    setFieldErrors(errors)
    return isValid
  }

  // Form submission using Server Action
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Clear previous errors
    setFormError(null)
    setFieldErrors({})
    
    // Client-side validation
    if (!validateForm()) {
      return
    }
    
    // Create form data for the server action
    const formDataObj = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formDataObj.append(key, value)
      }
    })

    // Show optimistic UI update
    updateOptimisticProfile({
      firstName: formData.firstName,
      lastName: formData.lastName,
      degreeType: formData.degreeType,
      major: formData.major,
      majorName: formData.majorName,
      graduationYear: formData.graduationYear
    })
    
    // Execute the server action
    startTransition(async () => {
      try {
        const result = await updateProfile(formDataObj)
        
        if (result.success) {
          // Success path
          refetch() // Refresh data to get updated values
          onClose() // Close the dialog
        } else {
          // Error path
          setFormError(result.error || "Failed to update profile")
          if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors)
          }
        }
      } catch (error) {
        console.error("Error updating profile:", error)
        setFormError(error.message || "An unexpected error occurred")
      }
    })
  }

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
    )
  }

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Edit Profile</DialogTitle>
      </DialogHeader>
      
      {formError && (
        <Alert variant="destructive" className="my-2">
          <AlertDescription>{formError}</AlertDescription>
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
                className={fieldErrors.firstName ? "border-red-500" : ""}
              />
              {fieldErrors.firstName && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className={fieldErrors.lastName ? "border-red-500" : ""}
              />
              {fieldErrors.lastName && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.lastName}</p>
              )}
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
              className={fieldErrors.graduationYear ? "border-red-500" : ""}
            />
            {fieldErrors.graduationYear ? (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.graduationYear}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Enter 4-digit year (e.g., 2025)
              </p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
          >
            {isPending ? (
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
  )
}