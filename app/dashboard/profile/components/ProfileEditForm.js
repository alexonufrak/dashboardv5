'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { updateProfile } from '@/app/actions/profile/update-profile';

/**
 * Profile Edit Form - Client Component
 * Form for updating user profile information
 * Uses server action for data mutation
 */
export function ProfileEditForm({ contact, onSuccess, onCancel }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  // Set initial form state from contact data
  const [formState, setFormState] = useState({
    firstName: contact?.fields?.['First Name'] || '',
    lastName: contact?.fields?.['Last Name'] || '',
    phone: contact?.fields?.['Phone'] || '',
    bio: contact?.fields?.['Bio'] || '',
    linkedin: contact?.fields?.['LinkedIn'] || '',
    website: contact?.fields?.['Website URL'] || '',
    expertise: contact?.fields?.['Expertise'] || []
  });
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create FormData object for server action
    const formData = new FormData();
    Object.entries(formState).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // Handle arrays like expertise
        value.forEach(item => {
          formData.append(key, item);
        });
      } else {
        formData.append(key, value);
      }
    });
    
    // Use React transition for improved UX during async operation
    startTransition(async () => {
      const result = await updateProfile(formData);
      
      if (result.success) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
          duration: 3000,
        });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "There was an error updating your profile.",
          variant: "destructive",
          duration: 5000,
        });
      }
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            value={formState.firstName}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            value={formState.lastName}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            value={formState.phone}
            onChange={handleChange}
            type="tel"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn</Label>
          <Input
            id="linkedin"
            name="linkedin"
            value={formState.linkedin}
            onChange={handleChange}
            placeholder="https://linkedin.com/in/username"
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            name="website"
            value={formState.website}
            onChange={handleChange}
            placeholder="https://example.com"
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            value={formState.bio}
            onChange={handleChange}
            rows={5}
            placeholder="Tell us about yourself..."
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        
        <Button
          type="submit"
          disabled={isPending}
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}