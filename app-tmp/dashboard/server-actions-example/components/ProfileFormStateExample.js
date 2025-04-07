"use client"

import { useFormState, useFormStatus } from 'react-dom'
import { useEffect } from 'react'
import { useCompositeProfile, useAllMajors } from '@/lib/airtable/hooks'
import { updateProfileWithFormState } from '@/app/actions/profile/update-profile-with-formstate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

// Define initial state for useFormState
const initialState = {
  success: false,
  message: null,
  fieldErrors: {},
  data: null
}

// SubmitButton component with loading state
function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit" 
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        "Save Changes"
      )}
    </Button>
  )
}

/**
 * ProfileFormStateExample - Client component that demonstrates useFormState pattern
 * Shows how to use the useFormState hook with Server Actions
 */
export default function ProfileFormStateExample() {
  // Use useFormState to manage form state with Server Action
  const [state, formAction] = useFormState(updateProfileWithFormState, initialState)
  
  // Fetch profile data with the composite profile hook
  const { 
    data: profile, 
    isLoading: isProfileLoading
  } = useCompositeProfile({
    enabled: true,
    staleTime: 30 * 1000 // 30 seconds
  })
  
  // Fetch majors for dropdown
  const { 
    data: majors = [], 
    isLoading: isLoadingMajors 
  } = useAllMajors()
  
  // Show success message if the update succeeded
  useEffect(() => {
    if (state.success) {
      // We could trigger a toast notification here
      console.log('Profile updated successfully:', state.data)
    }
  }, [state.success, state.data])
  
  // Loading state
  if (isProfileLoading && !profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
          <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
          <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
          <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>Update your personal information with useFormState</CardDescription>
      </CardHeader>
      <CardContent>
        {state.message && (
          <Alert 
            variant={state.success ? "default" : "destructive"} 
            className="mb-4"
          >
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}
        
        <form action={formAction} className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold border-b pb-2">Personal Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  defaultValue={profile?.firstName || ""}
                  className={state.fieldErrors.firstName ? "border-red-500" : ""}
                  required
                />
                {state.fieldErrors.firstName && (
                  <p className="text-xs text-red-500 mt-1">{state.fieldErrors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  defaultValue={profile?.lastName || ""}
                  className={state.fieldErrors.lastName ? "border-red-500" : ""}
                  required
                />
                {state.fieldErrors.lastName && (
                  <p className="text-xs text-red-500 mt-1">{state.fieldErrors.lastName}</p>
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
                <Select defaultValue={profile?.degreeType || ""} name="degreeType">
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
                    defaultValue={profile?.major || profile?.programId || ""} 
                    name="major"
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
                defaultValue={profile?.graduationYear || ""}
                placeholder="YYYY"
                maxLength="4"
                className={state.fieldErrors.graduationYear ? "border-red-500" : ""}
              />
              {state.fieldErrors.graduationYear ? (
                <p className="text-xs text-red-500 mt-1">{state.fieldErrors.graduationYear}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Enter 4-digit year (e.g., 2025)
                </p>
              )}
            </div>
          </div>
          
          {/* Hidden fields for education data */}
          {profile?.educationId && (
            <input type="hidden" name="educationId" value={profile.educationId} />
          )}
          {profile?.institutionId && (
            <input type="hidden" name="institutionId" value={profile.institutionId} />
          )}
          
          <CardFooter className="px-0 pt-4">
            <div className="w-full flex justify-end gap-2">
              <Button
                type="reset"
                variant="outline"
              >
                Reset
              </Button>
              <SubmitButton />
            </div>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  )
}