'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { checkInAttendee } from '@/app/actions/events/manage-attendance';
import { Button } from '@/components/ui/button';
import { UserCheck } from 'lucide-react';

export default function CheckInButton({ eventId, contactId, name }) {
  const [isCheckinIn, setIsCheckingIn] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleCheckIn = async () => {
    setIsCheckingIn(true);

    try {
      const formData = new FormData();
      formData.append('eventId', eventId);
      formData.append('contactId', contactId);

      const result = await checkInAttendee(formData);

      if (result.success) {
        toast({
          title: 'Attendee Checked In',
          description: `${name} has been successfully checked in.`,
        });
        router.refresh();
      } else {
        toast({
          variant: 'destructive',
          title: 'Check-in Failed',
          description: result.error || 'Failed to check in attendee.',
        });
      }
    } catch (error) {
      console.error('Error checking in attendee:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="flex items-center gap-1"
      onClick={handleCheckIn}
      disabled={isCheckinIn}
    >
      <UserCheck className="h-3 w-3" />
      {isCheckinIn ? 'Checking in...' : 'Check In'}
    </Button>
  );
}