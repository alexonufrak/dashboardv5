'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ProgramApplicationForm } from './ProgramApplicationForm';

/**
 * Program Application Dialog - Client Component
 * Dialog for applying to a program cohort
 * Contains the ProgramApplicationForm component
 */
export function ProgramApplicationDialog({ programId, cohortId, cohortName, buttonLabel = "Apply Now" }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const router = useRouter();
  
  const handleDialogOpen = () => {
    setDialogOpen(true);
    setApplicationSubmitted(false);
  };
  
  const handleDialogClose = () => {
    setDialogOpen(false);
  };
  
  const handleApplicationSuccess = (applicationId) => {
    setApplicationSubmitted(true);
  };
  
  const handleViewApplications = () => {
    router.push('/dashboard/applications');
    setDialogOpen(false);
  };
  
  const handleDashboard = () => {
    router.push('/dashboard');
    setDialogOpen(false);
  };
  
  return (
    <>
      <Button onClick={handleDialogOpen}>
        {buttonLabel}
      </Button>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {applicationSubmitted ? (
            // Success state
            <>
              <DialogHeader>
                <DialogTitle>Application Submitted!</DialogTitle>
                <DialogDescription>
                  Thank you for applying to {cohortName}. Your application has been received and is now under review.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-6">
                <p className="mb-4">
                  You will receive updates on your application status via email. 
                  You can also check the status of your application in your dashboard.
                </p>
              </div>
              
              <DialogFooter className="flex justify-between sm:justify-between">
                <Button variant="outline" onClick={handleDashboard}>
                  Return to Dashboard
                </Button>
                <Button onClick={handleViewApplications}>
                  View My Applications
                </Button>
              </DialogFooter>
            </>
          ) : (
            // Application form state
            <>
              <DialogHeader>
                <DialogTitle>Apply to {cohortName}</DialogTitle>
                <DialogDescription>
                  Please complete the application form below. All fields marked with * are required.
                </DialogDescription>
              </DialogHeader>
              
              <ProgramApplicationForm
                programId={programId}
                cohortId={cohortId}
                cohortName={cohortName}
                onSuccess={handleApplicationSuccess}
                onCancel={handleDialogClose}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}