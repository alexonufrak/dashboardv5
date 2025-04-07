"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Edit } from 'lucide-react'
import ProfileEditForm from './ProfileEditForm'

/**
 * ProfileDialogButton - Client component that opens the profile edit dialog
 * Uses the Server Action pattern for form submission
 */
export default function ProfileDialogButton({ variant = "default", size = "default", children }) {
  // Local state for dialog open/close
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
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
        <ProfileEditForm 
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      </Dialog>
    </>
  )
}