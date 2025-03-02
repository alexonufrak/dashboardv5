"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Calendar, MapPin, Clock, Users, BookOpen, ExternalLink } from "lucide-react"

const ProgramDetailModal = ({ cohort, isOpen, onClose, onApply, applications = [] }) => {
  if (!cohort) return null

  const initiativeName = cohort.initiativeDetails?.name || "Unknown Initiative"
  const topics = cohort.topicNames || []
  const classes = cohort.classNames || []
  const status = cohort["Status"] || "Unknown"
  const actionButtonText = cohort["Action Button"] || "Apply Now"
  const filloutFormId = cohort["Application Form ID (Fillout)"]
  const isOpen24 = status === "Applications Open"
  
  // Check if user has already applied to this cohort
  const hasApplied = Array.isArray(applications) && applications.some(app => 
    app.cohortId === cohort.id || 
    (cohort.Connexions && app.cohortId === cohort.Connexions)
  )
  
  // Get Connexions URL if available
  const connexionsUrl = cohort.Connexions ? 
    `https://connexion.xfoundry.org/programs/${cohort.Connexions}` : 
    null
  const description = cohort.description || cohort.initiativeDetails?.description || 
    "Join this program to connect with mentors and develop valuable career skills. This opportunity will help you grow professionally and expand your network."
    
  // Extract participation type
  const participationType = cohort.participationType || 
                          cohort.initiativeDetails?.["Participation Type"] || 
                          "Individual"
  
  // Format date if available
  const formatDate = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    if (isNaN(date)) return null
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }
  
  const startDate = formatDate(cohort["Start Date"])
  const endDate = formatDate(cohort["End Date"])
  const deadlineDate = formatDate(cohort["Application Deadline"])
  
  const location = cohort["Location"] || "Varies"
  const format = cohort["Format"] || null

  return (
    <Dialog open={isOpen} onOpenChange={onClose} className="transition-all duration-300 ease-in-out">
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <div className="flex flex-wrap gap-2 mb-1">
            <Badge variant={isOpen24 ? "success" : "destructive"} 
              className={isOpen24 ? 
                "bg-green-50 text-green-800" : 
                "bg-red-50 text-red-800"
              }>
              {status}
            </Badge>
            
            {Array.isArray(topics) && topics.length > 0 && 
              topics.map((topic, index) => (
                <Badge key={`topic-${index}`} variant="secondary" className="bg-cyan-50 text-cyan-800">
                  {topic}
                </Badge>
              ))
            }
          </div>
          
          <DialogTitle className="text-xl">
            {initiativeName}
          </DialogTitle>
          
          <DialogDescription>
            {cohort.initiativeDetails?.tagline || "Explore opportunities with this program"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-2">
          {/* Program Description */}
          <div>
            <h4 className="text-sm font-semibold mb-2">About This Program</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {description}
            </p>
          </div>
          
          <Separator />
          
          {/* Program Details */}
          <div className="grid gap-3">
            {(startDate || endDate) && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold">Dates</h4>
                  <p className="text-sm text-muted-foreground">
                    {startDate && endDate ? `${startDate} to ${endDate}` : 
                     startDate ? `Starting ${startDate}` : 
                     endDate ? `Ending ${endDate}` : "Dates to be announced"}
                  </p>
                </div>
              </div>
            )}
            
            {deadlineDate && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold">Application Deadline</h4>
                  <p className="text-sm text-muted-foreground">
                    {deadlineDate}
                  </p>
                </div>
              </div>
            )}
            
            {location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold">Location</h4>
                  <p className="text-sm text-muted-foreground">
                    {location}
                  </p>
                </div>
              </div>
            )}
            
            {format && (
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold">Format</h4>
                  <p className="text-sm text-muted-foreground">
                    {format}
                  </p>
                </div>
              </div>
            )}
            
            {Array.isArray(classes) && classes.length > 0 && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold">Eligible Classes</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {classes.map((className, index) => (
                      <Badge key={`class-${index}`} variant="outline" className="bg-amber-50 text-amber-800">
                        {className}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {cohort.initiativeDetails?.website && (
              <div className="flex items-start gap-3">
                <ExternalLink className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold">More Information</h4>
                  <a 
                    href={cohort.initiativeDetails.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Visit website
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="sm:mr-auto"
          >
            Close
          </Button>
          
          {hasApplied ? (
            // Show Connexions button if user has already applied
            <Button 
              variant="secondary"
              onClick={() => window.open(connexionsUrl || 'https://connexion.xfoundry.org', '_blank')}
              disabled={!connexionsUrl}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Go to Connexions
            </Button>
          ) : (
            // Show apply button if user hasn't applied yet
            <Button 
              variant={isOpen24 ? "default" : "secondary"}
              disabled={!isOpen24 || (!filloutFormId && !participationType?.toLowerCase().includes('team'))}
              onClick={() => {
                onApply(cohort)
                onClose()
              }}
            >
              {actionButtonText}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ProgramDetailModal