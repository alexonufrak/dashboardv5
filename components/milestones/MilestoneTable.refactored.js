import React, { useState } from 'react';
import { useUserParticipation, useTeamSubmissions } from '@/lib/airtable/hooks';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, FileText, Clock, Upload, ExternalLink, Check, X, AlertTriangle } from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';
import { useUser } from '@auth0/nextjs-auth0/client';

/**
 * MilestoneTable Component - Refactored to use the new Airtable hooks
 * Displays a table of milestones with submission status and actions
 * 
 * @param {Object} props - Component props
 * @param {string} props.programId - The ID of the program
 * @param {string} props.cohortId - The ID of the cohort
 */
export default function MilestoneTable({ programId, cohortId }) {
  const { user } = useUser();
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  
  // Get user's participation in this program/cohort
  const { 
    data: participation, 
    isLoading: participationLoading 
  } = useUserParticipation(user?.sub, programId, cohortId);
  
  // Get team submissions if user is in a team
  const teamId = participation?.teamId;
  const { 
    data: submissions, 
    isLoading: submissionsLoading 
  } = useTeamSubmissions(teamId, {
    enabled: !!teamId
  });
  
  // Our data would typically include milestone definitions, but for this example
  // we'll use placeholder data. In a real implementation, you would fetch this from
  // an entity like "milestones".
  const milestones = [
    {
      id: 'mil1',
      name: 'Project Proposal',
      description: 'Submit your initial project proposal',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      points: 50
    },
    {
      id: 'mil2',
      name: 'Progress Update',
      description: 'Provide an update on your project progress',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
      points: 75
    },
    {
      id: 'mil3',
      name: 'Final Presentation',
      description: 'Present your completed project',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      points: 100
    },
    {
      id: 'mil4',
      name: 'Initial Setup',
      description: 'Complete onboarding and initial project setup',
      dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      points: 25
    }
  ];
  
  const isLoading = participationLoading || submissionsLoading;
  
  // Handle loading state
  if (isLoading) {
    return (
      <div className="w-full">
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  // Check if user has a team
  if (!teamId) {
    return (
      <div className="border rounded-md p-8 text-center bg-muted/10">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-40" />
        <h3 className="text-lg font-medium mb-2">No Team Found</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-4">
          You need to join or create a team to see milestones and submit deliverables.
        </p>
        <Button>Join a Team</Button>
      </div>
    );
  }
  
  // Function to check if a milestone has been submitted
  const getSubmissionForMilestone = (milestoneId) => {
    if (!submissions || submissions.length === 0) return null;
    return submissions.find(sub => sub.milestoneId === milestoneId);
  };
  
  // Function to determine status and badge styling
  const getMilestoneStatus = (milestone) => {
    const submission = getSubmissionForMilestone(milestone.id);
    
    if (submission) {
      return {
        status: submission.status || 'Submitted',
        badgeClass: 
          submission.status === 'Approved' ? 'bg-green-100 text-green-800' :
          submission.status === 'Rejected' ? 'bg-red-100 text-red-800' :
          submission.status === 'Needs Revision' ? 'bg-orange-100 text-orange-800' :
          'bg-blue-100 text-blue-800'
      };
    }
    
    // Check if milestone is past due
    const now = new Date();
    const dueDate = new Date(milestone.dueDate);
    
    if (isAfter(now, dueDate)) {
      return {
        status: 'Overdue',
        badgeClass: 'bg-red-100 text-red-800'
      };
    }
    
    return {
      status: 'Not Started',
      badgeClass: 'bg-gray-100 text-gray-800'
    };
  };
  
  // Handle submitting a milestone
  const handleSubmitMilestone = (milestone) => {
    setSelectedMilestone(milestone);
    setIsSubmitOpen(true);
  };
  
  // Sort milestones by due date (earliest first)
  const sortedMilestones = [...milestones].sort((a, b) => {
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Milestone</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Points</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMilestones.map((milestone) => {
            const { status, badgeClass } = getMilestoneStatus(milestone);
            const submission = getSubmissionForMilestone(milestone.id);
            const dueDate = new Date(milestone.dueDate);
            const isOverdue = status === 'Overdue';
            const isCompleted = status === 'Approved';
            
            return (
              <TableRow key={milestone.id}>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-medium">{milestone.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {milestone.description}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Calendar className={`h-4 w-4 mr-2 ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`} />
                    <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                      {format(dueDate, 'MMM d, yyyy')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{milestone.points} pts</TableCell>
                <TableCell>
                  <Badge className={badgeClass}>
                    {status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {submission ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => window.open(submission.link, '_blank')}
                      disabled={!submission.link}
                    >
                      <FileText className="h-4 w-4" />
                      View Submission
                    </Button>
                  ) : (
                    <Button
                      variant={isOverdue ? "destructive" : "default"}
                      size="sm"
                      className="gap-1"
                      onClick={() => handleSubmitMilestone(milestone)}
                    >
                      <Upload className="h-4 w-4" />
                      Submit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent>
          <MilestoneSubmitForm 
            milestone={selectedMilestone} 
            teamId={teamId}
            onSuccess={() => setIsSubmitOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Milestone Submit Form Component
function MilestoneSubmitForm({ milestone, teamId, onSuccess }) {
  const [formData, setFormData] = useState({
    text: '',
    link: ''
  });
  
  // In a real implementation, this would use a mutation hook like useCreateSubmission
  const isSubmitting = false;
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // In a real implementation, you would call the mutation here
    console.log('Submitting milestone:', {
      milestoneId: milestone.id,
      teamId,
      ...formData
    });
    
    // Simulate success
    setTimeout(() => {
      onSuccess?.();
    }, 500);
  };
  
  if (!milestone) return null;
  
  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Submit: {milestone.name}</DialogTitle>
      </DialogHeader>
      
      <div className="grid gap-4 py-4">
        <div className="flex items-center gap-2 text-sm mb-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>
            Due by {format(new Date(milestone.dueDate), 'MMMM d, yyyy')}
          </span>
          
          <div className="ml-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>{milestone.points} points</span>
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="link">Submission Link</Label>
          <Input
            id="link"
            name="link"
            value={formData.link}
            onChange={handleChange}
            placeholder="https://"
            required
          />
          <p className="text-xs text-muted-foreground">
            Link to your presentation, document, or GitHub repository
          </p>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="text">Notes</Label>
          <Textarea
            id="text"
            name="text"
            value={formData.text}
            onChange={handleChange}
            rows={3}
            placeholder="Add any context or notes about your submission..."
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => onSuccess?.()}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || !formData.link}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Milestone'}
        </Button>
      </div>
    </form>
  );
}