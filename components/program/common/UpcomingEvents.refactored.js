import React, { useState } from 'react';
import { useAllRelevantEvents, useCreateEvent } from '@/lib/airtable/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, Clock, MapPin, ExternalLink } from 'lucide-react';
import { format, addHours, isAfter } from 'date-fns';
import { useUser } from '@auth0/nextjs-auth0/client';

/**
 * UpcomingEvents Component - Refactored to use the new Airtable hooks
 * Displays upcoming events for a program/cohort with ability to add new events
 */
export default function UpcomingEvents({ programId, cohortId }) {
  const { user } = useUser();
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  
  // Use our custom hook that combines all relevant events
  const { 
    data: events, 
    isLoading, 
    error 
  } = useAllRelevantEvents(user?.sub, programId, cohortId);

  // Handle loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-10 w-24" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Error Loading Events</CardTitle>
          <CardDescription className="text-red-600">
            {error.message || 'Failed to load events'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Filter only upcoming events (happening today or in the future)
  const now = new Date();
  const upcomingEvents = events
    ?.filter(event => event.startDateTime && isAfter(new Date(event.startDateTime), now))
    .slice(0, 5) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
          
          {/* Only show Add Event button for admins */}
          {user && user['https://xfoundry.org/roles']?.includes('admin') && (
            <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <AddEventForm 
                  programId={programId} 
                  cohortId={cohortId} 
                  onSuccess={() => setIsAddEventOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-2 opacity-40" />
            <p className="text-muted-foreground">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Event Card Component
function EventCard({ event }) {
  // Format dates for display
  const startDate = event.startDateTime 
    ? format(new Date(event.startDateTime), 'MMM d, yyyy')
    : 'Date TBD';
    
  const startTime = event.startDateTime 
    ? format(new Date(event.startDateTime), 'h:mm a')
    : '';
    
  const endTime = event.endDateTime 
    ? format(new Date(event.endDateTime), 'h:mm a')
    : '';
    
  const timeDisplay = startTime && endTime 
    ? `${startTime} - ${endTime}` 
    : startTime;

  return (
    <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-base">{event.name}</h4>
          
          {event.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {event.description}
            </p>
          )}
          
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              {startDate}
            </div>
            
            {timeDisplay && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                {timeDisplay}
              </div>
            )}
            
            {event.location && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 mr-1.5" />
                {event.location}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline">{event.type || 'General'}</Badge>
          
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-blue-600 hover:underline"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Event Link
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// Add Event Form Component
function AddEventForm({ programId, cohortId, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endDateTime: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
    location: '',
    url: '',
    type: 'General'
  });
  
  const createEventMutation = useCreateEvent();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await createEventMutation.mutateAsync({
        ...formData,
        programId,
        cohortId
      });
      
      onSuccess?.();
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add New Event</DialogTitle>
      </DialogHeader>
      
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Event Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="startDateTime">Start Date & Time</Label>
            <Input
              id="startDateTime"
              name="startDateTime"
              type="datetime-local"
              value={formData.startDateTime}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="endDateTime">End Date & Time</Label>
            <Input
              id="endDateTime"
              name="endDateTime"
              type="datetime-local"
              value={formData.endDateTime}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Virtual or physical location"
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="url">Event URL</Label>
          <Input
            id="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            placeholder="https://"
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="type">Event Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => handleSelectChange('type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="General">General</SelectItem>
              <SelectItem value="Workshop">Workshop</SelectItem>
              <SelectItem value="Webinar">Webinar</SelectItem>
              <SelectItem value="Deadline">Deadline</SelectItem>
              <SelectItem value="Office Hours">Office Hours</SelectItem>
              <SelectItem value="Social">Social</SelectItem>
            </SelectContent>
          </Select>
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
          disabled={createEventMutation.isPending || !formData.name || !formData.startDateTime}
        >
          {createEventMutation.isPending ? 'Adding...' : 'Add Event'}
        </Button>
      </div>
    </form>
  );
}