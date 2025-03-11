"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, User, Users, ExternalLink } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { format, isPast, isFuture, isToday } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

const EventItem = ({ event }) => {
  // Event date and time logic
  const eventDate = event.date ? new Date(event.date) : null
  const isUpcoming = eventDate ? (isToday(eventDate) || isFuture(eventDate)) : false

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 bg-blue-50 p-2 rounded-md text-blue-700 mt-1">
          <Calendar className="h-4 w-4" />
        </div>
        
        <div className="flex-grow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="font-semibold">{event.title}</div>
            
            {isUpcoming && (
              <Badge className="self-start sm:self-auto my-1 sm:my-0 bg-green-50 text-green-800 border-green-200 hover:bg-green-100">
                Upcoming
              </Badge>
            )}
          </div>
          
          {/* Event details */}
          <div className="text-sm space-y-1.5 mt-1">
            {eventDate && (
              <div className="flex items-center text-muted-foreground gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {format(eventDate, "EEEE, MMMM d, yyyy")} at {format(eventDate, "h:mm a")}
                </span>
              </div>
            )}
            
            {event.location && (
              <div className="flex items-center text-muted-foreground gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                <span>{event.location}</span>
              </div>
            )}
            
            {event.host && (
              <div className="flex items-center text-muted-foreground gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>Hosted by {event.host}</span>
              </div>
            )}
          </div>
          
          {/* Event actions */}
          {isUpcoming && event.url && (
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs"
                asChild
              >
                <a 
                  href={event.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  {event.rsvp ? "RSVP" : "Learn More"}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function UpcomingEvents({ events = [], isLoading = false }) {
  const upcomingEvents = events.filter(event => {
    if (!event.date) return true
    const eventDate = new Date(event.date)
    return isToday(eventDate) || isFuture(eventDate)
  }).sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    return new Date(a.date) - new Date(b.date)
  })
  
  // Sample events for empty state
  const sampleEvents = [
    {
      id: "sample1",
      title: "No upcoming events",
      description: "Check back later for new events",
      date: null
    }
  ]
  
  const displayEvents = upcomingEvents.length > 0 ? upcomingEvents : sampleEvents
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Upcoming Events</CardTitle>
        <CardDescription>Events and activities for your program</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // Loading state
          <div className="space-y-4">
            {[1, 2].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-3/5" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {displayEvents.map((event, index) => (
              <div key={event.id || index}>
                <EventItem event={event} />
                {index < displayEvents.length - 1 && <Separator className="my-3" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}