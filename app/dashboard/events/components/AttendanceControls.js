'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { toggleAttendanceTracking } from '@/app/actions/events/manage-attendance';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { UserCheck, DownloadIcon } from 'lucide-react';

export default function AttendanceControls({ event }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleToggleAttendance = async () => {
    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append('eventId', event.id);

      const result = await toggleAttendanceTracking(formData);

      if (result.success) {
        toast({
          title: result.data.attendanceOpen ? 'Attendance Opened' : 'Attendance Closed',
          description: result.data.attendanceOpen 
            ? 'Attendees can now be checked in to this event.' 
            : 'Attendance tracking has been paused.',
        });
        router.refresh();
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to update attendance tracking',
          description: result.error || 'An error occurred.',
        });
      }
    } catch (error) {
      console.error('Error toggling attendance tracking:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportAttendance = () => {
    // Convert attendee data to CSV
    const downloadAttendanceCSV = () => {
      // This will be implemented for real export
      alert('CSV export is not implemented yet');
    };
    
    downloadAttendanceCSV();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <Switch 
            id="attendance-mode" 
            checked={event.attendanceOpen}
            onCheckedChange={handleToggleAttendance}
            disabled={isUpdating}
          />
          <Label htmlFor="attendance-mode">
            {event.attendanceOpen ? 'Attendance Open' : 'Attendance Closed'}
          </Label>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleExportAttendance}
          className="flex items-center gap-2"
        >
          <DownloadIcon className="h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}