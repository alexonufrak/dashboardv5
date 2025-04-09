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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { joinTeam } from '@/app/actions/teams/join-team';
import { useRouter } from 'next/navigation';

/**
 * Join Team Button - Client Component
 * Button that opens a dialog for joining a team
 */
export function JoinTeamButton({ team, contactId }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [joinStatus, setJoinStatus] = useState('idle'); // idle, pending, success, error
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  
  const handleDialogOpen = () => {
    setDialogOpen(true);
    setJoinStatus('idle');
  };
  
  const handleDialogClose = () => {
    setDialogOpen(false);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isPending) return;
    
    // Create FormData object for server action
    const formData = new FormData();
    formData.append('teamId', team.id);
    formData.append('message', message);
    
    setJoinStatus('pending');
    
    // Use React transition for improved UX during async operation
    startTransition(async () => {
      const result = await joinTeam(formData);
      
      if (result.success) {
        setJoinStatus('success');
        
        // Show appropriate toast based on whether approval is required
        if (result.requiresApproval) {
          toast({
            title: "Join Request Submitted",
            description: `Your request to join ${team.name} has been submitted for approval.`,
            duration: 5000,
          });
        } else {
          toast({
            title: "Team Joined",
            description: `You have successfully joined ${team.name}.`,
            duration: 5000,
          });
        }
      } else {
        setJoinStatus('error');
        toast({
          title: "Join Failed",
          description: result.error || "There was an error joining the team.",
          variant: "destructive",
          duration: 5000,
        });
      }
    });
  };
  
  const handleViewTeam = () => {
    router.push(`/dashboard/teams/${team.id}`);
    setDialogOpen(false);
  };
  
  const handleViewTeams = () => {
    router.push('/dashboard/teams');
    setDialogOpen(false);
  };
  
  return (
    <>
      <Button onClick={handleDialogOpen} className="w-full">
        Join Team
      </Button>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {joinStatus === 'success' ? (
            // Success state
            <>
              <DialogHeader>
                <DialogTitle>Join Request Submitted</DialogTitle>
                <DialogDescription>
                  {team.recruitmentStatus === 'Open' 
                    ? `You have successfully joined ${team.name}.` 
                    : `Your request to join ${team.name} has been submitted for approval.`}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-6">
                <p className="mb-4">
                  {team.recruitmentStatus === 'Open'
                    ? "You are now a member of this team and can access team resources and submissions."
                    : "The team admin will review your request. You'll be notified when your request is approved."}
                </p>
              </div>
              
              <DialogFooter className="flex justify-between sm:justify-between">
                <Button variant="outline" onClick={handleViewTeams}>
                  All Teams
                </Button>
                <Button onClick={handleViewTeam}>
                  View Team
                </Button>
              </DialogFooter>
            </>
          ) : (
            // Join form state
            <>
              <DialogHeader>
                <DialogTitle>Join {team.name}</DialogTitle>
                <DialogDescription>
                  {team.recruitmentStatus === 'Open'
                    ? "You'll be added to this team immediately."
                    : "Your request will be sent to the team admin for approval."}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <FormLabel htmlFor="message">Message (Optional)</FormLabel>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Introduce yourself to the team..."
                    rows={4}
                  />
                  <FormDescription>
                    Briefly explain why you'd like to join this team and what skills you can contribute.
                  </FormDescription>
                </div>
                
                <DialogFooter className="pt-4">
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
                    disabled={isPending}
                  >
                    {isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}