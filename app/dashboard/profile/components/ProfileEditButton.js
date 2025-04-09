'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProfileEditForm } from './ProfileEditForm';
import { useRouter } from 'next/navigation';

/**
 * Profile Edit Button - Client Component
 * Button that opens a dialog for editing profile information
 * Uses the ProfileEditForm component and handles dialog state
 */
export function ProfileEditButton({ userId, contact }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();
  
  const handleDialogOpen = () => {
    setDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setDialogOpen(false);
  };
  
  const handleSuccess = () => {
    // Close the dialog
    setDialogOpen(false);
    
    // Refresh the page to show updated data
    // This is a fallback; the page should automatically
    // update from the revalidatePath in the server action
    router.refresh();
  };
  
  return (
    <>
      <Button onClick={handleDialogOpen}>
        Edit Profile
      </Button>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          
          <ProfileEditForm 
            contact={contact} 
            onSuccess={handleSuccess} 
            onCancel={handleDialogClose} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}