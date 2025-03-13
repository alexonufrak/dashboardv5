"use client"

import { useState } from "react"
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
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/components/ui/table"
import { Calendar, MapPin, Clock, Users, BookOpen, ExternalLink } from "lucide-react"
import ProgramApplicationHandler from "./ProgramApplicationHandler"

const ProgramDetailModal = ({ cohort, isOpen, onClose, onApply, profile, applications = [] }) => {
  if (!cohort) return null

  const [showApplicationHandler, setShowApplicationHandler] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  const initiativeName = cohort.initiativeDetails?.name || "Unknown Initiative"
  const topics = cohort.topicNames || []
  const classes = cohort.classNames || []
  const status = cohort["Status"] || "Unknown"
  const actionButtonText = cohort["Action Button"] || "Apply Now"
  const filloutFormId = cohort["Application Form ID (Fillout)"]
  const isOpen24 = status === "Applications Open"
  
  // Find any application for this cohort
  const cohortApplication = Array.isArray(applications) ? 
    applications.find(app => app.cohortId === cohort.id) : null
  
  // Check if user has a pending application - used to disable the Apply button
  const hasAnyApplication = !!cohortApplication
  
  // Check if user has an approved application - only show Connexions for approved applications
  const hasApprovedApplication = cohortApplication?.status === "Approved"
  
  // Check if user has an active participation record for this cohort
  const hasActiveParticipation = profile?.findParticipationByCohortId?.(cohort.id)
  
  // Show Connexions button only if they have active participation OR approved application
  const showConnexions = hasActiveParticipation || hasApprovedApplication
  
  // Set Connexions URL - always use the same URL
  const connexionsUrl = "https://connexion.xfoundry.org"
  const description = cohort.description || cohort.initiativeDetails?.description || 
    "Join this program to connect with mentors and develop valuable career skills. This opportunity will help you grow professionally and expand your network."
    
  // Extract participation type
  const participationType = cohort.participationType || 
                          cohort.initiativeDetails?.["Participation Type"] || 
                          "Individual"
  
  // Handle the apply button click
  const handleApplyClick = () => {
    // Check if we should use the fillout form in a popup or navigate to application page
    const useFilloutPopup = cohort?.["Application Form ID (Fillout)"] && 
                          cohort?.filloutDisplayMode === "popup";
    
    if (useFilloutPopup) {
      // Use popup dialog for fillout forms that should display in popups
      setIsApplying(true)
      setShowApplicationHandler(true)
    } else {
      // Otherwise navigate to the application page using the programs/apply route
      // Import next/router for client-side navigation
      import('next/router').then(({ useRouter }) => {
        const router = useRouter();
        // Navigate to application URL without the initiative name in query params
        router.push(`/dashboard/programs/apply/${encodeURIComponent(cohort.id)}`);
      });
    }
  }
  
  // Handle the application process completion
  const handleApplicationComplete = (appliedCohort) => {
    setIsApplying(false)
    setShowApplicationHandler(false)
    if (onApply) {
      onApply(appliedCohort)
    }
    onClose()
  }
  
  // Handle the application process cancellation
  const handleApplicationCancel = () => {
    setIsApplying(false)
    setShowApplicationHandler(false)
  }
  
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
    <>
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
            
            {/* Application Status (if any) */}
            {hasAnyApplication && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Your Application Status</h4>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date Applied</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          {cohortApplication?.appliedDate ? 
                            new Date(cohortApplication.appliedDate).toLocaleDateString() : 
                            "Unknown date"}
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            cohortApplication?.status === "Approved" ? 
                              "bg-green-100 text-green-800" : 
                            cohortApplication?.status === "Pending" ?
                              "bg-amber-100 text-amber-800" :
                            cohortApplication?.status === "Rejected" ?
                              "bg-red-100 text-red-800" :
                              "bg-slate-100 text-slate-800"
                          }`}>
                            {cohortApplication?.status || "Pending Review"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {cohortApplication?.updatedDate ? 
                            new Date(cohortApplication.updatedDate).toLocaleDateString() : 
                            "Pending"}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                {cohortApplication?.status === "Rejected" && cohortApplication?.notes && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium">Feedback: </span>
                    {cohortApplication.notes}
                  </div>
                )}
              </div>
            )}
            
            {hasAnyApplication && <Separator />}
            
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
            
            {showConnexions ? (
              // Show Connexions button if user has active participation or approved application
              <Button 
                variant="secondary"
                onClick={() => window.open(connexionsUrl, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Go to Connexions
              </Button>
            ) : (
              // Show apply button if user doesn't have active participation or approved application
              <Button 
                variant={isOpen24 ? "default" : "secondary"}
                // Disable if: 
                // 1. Cohort isn't open for applications
                // 2. Missing form ID for individual applications
                // 3. Currently applying
                // 4. User already has a pending application (any status)
                disabled={!isOpen24 || (!filloutFormId && !participationType?.toLowerCase().includes('team')) || isApplying || hasAnyApplication}
                onClick={handleApplyClick}
              >
                {isApplying ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Applying...
                  </span>
                ) : hasAnyApplication ? (
                  // Show application status for existing applications that aren't approved
                  <span>
                    {cohortApplication?.status || "Applied"}
                  </span>
                ) : (
                  actionButtonText
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Application Handler Component */}
      <ProgramApplicationHandler 
        cohort={cohort}
        profile={profile}
        isActive={showApplicationHandler}
        onComplete={handleApplicationComplete}
        onCancel={handleApplicationCancel}
      />
    </>
  )
}

export default ProgramDetailModal