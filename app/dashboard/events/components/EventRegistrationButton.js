'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ExternalLink } from 'lucide-react';
import { registerForEvent } from '@/app/actions/events/register-for-event';

/**
 * Event Registration Button component
 * Client component for event registration
 */
export default function EventRegistrationButton({ 
  event, 
  isRegistered = false,
  onRegister 
}) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // If there's a registration URL (external registration), use that
  if (event.registrationUrl) {
    return (
      <Button 
        asChild 
        className="w-full"
      >
        <a
          href={event.registrationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center"
        >
          Register <ExternalLink className="ml-2 h-4 w-4" />
        </a>
      </Button>
    );
  }
  
  // Otherwise, handle registration through our system
  const handleRegister = async () => {
    if (isRegistered) {
      toast({
        title: "Already Registered",
        description: "You've already registered for this event.",
        variant: "default",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await registerForEvent(event.id);
      
      if (result.success) {
        toast({
          title: "Registration Successful",
          description: "You've been registered for this event.",
          variant: "default",
        });
        
        if (onRegister) {
          onRegister();
        }
        
        // Refresh the page to show updated registration status
        window.location.reload();
      } else {
        toast({
          title: "Registration Failed",
          description: result.error || "There was an error registering for this event.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error registering for event:", error);
      toast({
        title: "Registration Failed",
        description: "There was an error registering for this event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isRegistered) {
    return (
      <Button variant="outline" className="w-full" disabled>
        Registered
      </Button>
    );
  }
  
  return (
    <Button 
      onClick={handleRegister} 
      className="w-full" 
      disabled={isLoading || !event.isRegistrationOpen}
    >
      {isLoading ? "Registering..." : "Register"}
    </Button>
  );
}