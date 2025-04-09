'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { applyToProgram } from '@/app/actions/programs/apply-to-program';

/**
 * Program Application Form - Client Component
 * Form for submitting applications to programs
 * Uses server action for data submission
 */
export function ProgramApplicationForm({ programId, cohortId, cohortName, onSuccess, onCancel }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  // Form state
  const [formState, setFormState] = useState({
    motivation: '',
    experience: '',
    goals: '',
    backgroundInfo: ''
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
    formData.append('programId', programId);
    formData.append('cohortId', cohortId);
    
    // Add form fields
    Object.entries(formState).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    // Use React transition for improved UX during async operation
    startTransition(async () => {
      const result = await applyToProgram(formData);
      
      if (result.success) {
        toast({
          title: "Application Submitted",
          description: `Your application to ${cohortName} has been successfully submitted.`,
          duration: 5000,
        });
        
        if (onSuccess) {
          onSuccess(result.applicationId);
        }
      } else {
        toast({
          title: "Submission Failed",
          description: result.error || "There was an error submitting your application.",
          variant: "destructive",
          duration: 5000,
        });
      }
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="motivation" className="text-base">Why are you interested in this program?</Label>
          <Textarea
            id="motivation"
            name="motivation"
            value={formState.motivation}
            onChange={handleChange}
            placeholder="Share your motivation for applying to this program..."
            rows={4}
            required
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="experience" className="text-base">Relevant Experience</Label>
          <Textarea
            id="experience"
            name="experience"
            value={formState.experience}
            onChange={handleChange}
            placeholder="Describe any relevant experience you have..."
            rows={4}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="goals" className="text-base">What do you hope to achieve through this program?</Label>
          <Textarea
            id="goals"
            name="goals"
            value={formState.goals}
            onChange={handleChange}
            placeholder="Outline your goals for participating in this program..."
            rows={4}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="backgroundInfo" className="text-base">Additional Background Information</Label>
          <Textarea
            id="backgroundInfo"
            name="backgroundInfo"
            value={formState.backgroundInfo}
            onChange={handleChange}
            placeholder="Share any additional information that might support your application..."
            rows={4}
            className="mt-1"
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
          {isPending ? 'Submitting...' : 'Submit Application'}
        </Button>
      </div>
    </form>
  );
}