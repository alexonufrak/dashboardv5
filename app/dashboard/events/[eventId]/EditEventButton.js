'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import EditEventForm from '../components/EditEventForm';

export default function EditEventButton({ event, programs = [] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-2"
        onClick={() => setIsDialogOpen(true)}
      >
        <Edit className="h-4 w-4" />
        Edit Event
      </Button>
      
      <EditEventForm 
        event={event} 
        programs={programs} 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
      />
    </>
  );
}