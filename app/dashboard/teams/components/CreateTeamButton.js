'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

/**
 * Create Team Button - Client Component
 * Button that opens a dialog for creating a new team
 * Uses a server action for team creation (to be implemented)
 */
export function CreateTeamButton({ contactId }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  
  // Form state
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    cohortId: '',
    recruitmentStatus: 'Open'
  });
  
  const handleDialogOpen = () => {
    setDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setDialogOpen(false);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // For now, just show a mock success notification
    // In real implementation, we would call a server action
    toast({
      title: "Team Created",
      description: `Your team "${formState.name}" has been created.`,
      duration: 5000,
    });
    
    // Close the dialog
    setDialogOpen(false);
    
    // Refresh the page to show updated data
    router.refresh();
  };
  
  return (
    <>
      <Button onClick={handleDialogOpen}>
        Create Team
      </Button>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create a New Team</DialogTitle>
            <DialogDescription>
              Create a team to collaborate with other students on program milestones.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-4">
              <div>
                <FormLabel htmlFor="name">Team Name</FormLabel>
                <Input
                  id="name"
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter team name"
                  className="mt-1"
                />
              </div>
              
              <div>
                <FormLabel htmlFor="description">Description</FormLabel>
                <Textarea
                  id="description"
                  name="description"
                  value={formState.description}
                  onChange={handleChange}
                  placeholder="Describe your team and its goals..."
                  rows={4}
                  className="mt-1"
                />
              </div>
              
              <div>
                <FormLabel htmlFor="cohortId">Program Cohort</FormLabel>
                <Select
                  value={formState.cohortId}
                  onValueChange={(value) => handleSelectChange('cohortId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a program cohort" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Normally this would be populated from the API */}
                    <SelectItem value="cohort1">Fall 2024 Entrepreneurship</SelectItem>
                    <SelectItem value="cohort2">Spring 2025 Innovation Lab</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the program cohort your team is part of.
                </FormDescription>
              </div>
              
              <div>
                <FormLabel htmlFor="recruitmentStatus">Recruitment Status</FormLabel>
                <Select
                  value={formState.recruitmentStatus}
                  onValueChange={(value) => handleSelectChange('recruitmentStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open (Anyone can join)</SelectItem>
                    <SelectItem value="Approval">Requires Approval</SelectItem>
                    <SelectItem value="Closed">Closed (No new members)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Control how new members can join your team.
                </FormDescription>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleDialogClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={isPending || !formState.name || !formState.cohortId}
              >
                {isPending ? 'Creating...' : 'Create Team'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}