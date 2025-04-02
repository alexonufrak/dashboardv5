"use client"

import { useState } from 'react';
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useCompositeProfile } from '@/lib/airtable/hooks';
import ProfileEditModal from './ProfileEditModal.refactored';

/**
 * ProfileDialogButton - Demonstrates the correct way to use the ProfileEditModal
 * with shadcn/ui Dialog component pattern.
 * 
 * This component:
 * 1. Uses the Dialog component from shadcn/ui
 * 2. Maintains local state for dialog open/close
 * 3. Handles profile data fetching
 * 4. Provides proper callbacks for the modal
 */
const ProfileDialogButton = ({ variant = "default", size = "default", children }) => {
  // Local state for dialog open/close - no dependency on context
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Fetch profile data with the composite profile hook
  const { 
    data: profile, 
    isLoading,
    refetch 
  } = useCompositeProfile({
    enabled: true
  });
  
  // Handle profile updates
  const handleProfileSave = () => {
    // Refetch profile data after a successful update
    refetch();
  };
  
  return (
    <>
      {/* Button with children or default content */}
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsDialogOpen(true)}
      >
        {children || (
          <>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </>
        )}
      </Button>
      
      {/* Dialog is controlled by local state */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      >
        {/* The ProfileEditModal renders just the DialogContent */}
        <ProfileEditModal 
          profile={profile}
          onSave={handleProfileSave}
          onClose={() => setIsDialogOpen(false)}
        />
      </Dialog>
    </>
  );
};

export default ProfileDialogButton;