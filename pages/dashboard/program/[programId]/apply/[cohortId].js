"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@auth0/nextjs-auth0/client'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { FilloutStandardEmbed } from '@fillout/react'
import { ChevronLeft, AlertCircle, Check, Loader2, HomeIcon, ChevronRight } from "lucide-react"
import XtrapreneursApplicationForm from '@/components/program/xtrapreneurs/XtrapreneursApplicationForm'
import TeamApplicationForm from '@/components/teams/TeamApplicationForm'
import Link from 'next/link'
import { ROUTES } from '@/lib/routing'

// Animation variants for the page transitions
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}

/**
 * Program application page component
 * This handles all types of applications (Individual, Team, Xtrapreneurs) 
 * similar to the ProgramApplicationHandler but as a dedicated page
 */
const ProgramApplicationPage = () => {
  const router = useRouter()
  const { user, error: userError, isLoading: userLoading } = useUser()
  const { programId, cohortId } = router.query
  
  // State to manage application data and UI
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [cohort, setCohort] = useState(null)
  const [profile, setProfile] = useState(null)
  const [showXtrapreneursForm, setShowXtrapreneursForm] = useState(false)
  const [applicationType, setApplicationType] = useState('standard')
  
  // Fetch cohort and profile data
  useEffect(() => {
    // Only fetch data when both programId and cohortId are available
    if (programId && cohortId && user) {
      setIsLoading(true)
      
      // Fetch profile data
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => {
          if (data.profile) {
            setProfile(data.profile)
          } else {
            setError('Failed to load user profile')
          }
        })
        .catch(err => {
          console.error('Error fetching profile:', err)
          setError('Failed to load user profile')
        })
      
      // Fetch program data to get the cohort
      fetch(`/api/cohorts/${cohortId}/details`)
        .then(res => res.json())
        .then(data => {
          if (data.cohort) {
            setCohort(data.cohort)
            
            // Determine application type
            const initiativeName = data.cohort.initiativeDetails?.name || ''
            const participationType = data.cohort.participationType || 
                                     data.cohort.initiativeDetails?.["Participation Type"] || 
                                     "Individual"
            
            // Check for Xtrapreneurs
            if (initiativeName.toLowerCase().includes('xtrapreneur')) {
              setApplicationType('xtrapreneurs')
              setShowXtrapreneursForm(true)
            }
            // Check for team-based application
            else if (
              participationType.toLowerCase() === 'team' || 
              participationType.toLowerCase().includes('team') ||
              participationType.toLowerCase() === 'teams'
            ) {
              setApplicationType('team')
            }
            // Default to standard application (Fillout or custom form)
            else {
              setApplicationType('standard')
            }
          } else {
            setError('Failed to load cohort data')
          }
        })
        .catch(err => {
          console.error('Error fetching cohort:', err)
          setError('Failed to load cohort data')
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [programId, cohortId, user])
  
  // Handle Fillout form submission
  const handleFilloutSubmit = async (submissionId) => {
    try {
      setIsSubmitting(true)
      
      // Call API to record application
      const response = await fetch('/api/applications/fillout-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submissionId,
          filloutId: cohort["Application Form ID (Fillout)"],
          cohortId: cohort.id,
          userId: user?.sub,
          contactId: profile?.contactId
        })
      })
      
      if (response.ok) {
        setSuccess(true)
        
        // Redirect back to program page after short delay
        setTimeout(() => {
          router.push(ROUTES.PROGRAM.DETAIL(programId))
        }, 3000)
      } else {
        throw new Error(await response.text())
      }
    } catch (error) {
      console.error("Error submitting application:", error)
      setError("Failed to submit application. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle application submission (for non-Fillout forms)
  const handleSubmitApplication = async (data) => {
    try {
      setIsSubmitting(true)
      
      // Create payload for API
      const payload = {
        cohortId: cohort.id,
        applicationType: applicationType,
        ...data
      }
      
      // Make API call to create application
      const response = await fetch('/api/applications/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit application')
      }
      
      // Application submitted successfully
      setSuccess(true)
      
      // Redirect back to program page after short delay
      setTimeout(() => {
        router.push(ROUTES.PROGRAM.DETAIL(programId))
      }, 3000)
    } catch (error) {
      console.error("Error submitting application:", error)
      setError("Failed to submit application. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle going back to the program page
  const handleGoBack = () => {
    router.push(ROUTES.PROGRAM.DETAIL(programId))
  }
  
  // Determine initiative name for breadcrumb and title
  const initiativeName = cohort?.initiativeDetails?.name || 'Program'
  const initiativeSlug = initiativeName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="container py-6 max-w-4xl"
    >
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">
                <HomeIcon className="h-3.5 w-3.5 mr-1" />
                Home
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          <BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-3.5 w-3.5" />
            </BreadcrumbSeparator>
            <BreadcrumbLink asChild>
              <Link href={ROUTES.PROGRAMS}>
                Programs
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          <BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-3.5 w-3.5" />
            </BreadcrumbSeparator>
            <BreadcrumbLink asChild>
              <Link href={ROUTES.PROGRAM.SLUG(programId, initiativeSlug)}>
                {initiativeName}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          <BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-3.5 w-3.5" />
            </BreadcrumbSeparator>
            <BreadcrumbLink className="font-medium">
              Apply
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      {/* Back button */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleGoBack} 
        className="mb-4"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Program
      </Button>
      
      {/* Loading state */}
      {isLoading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Error state */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Success state */}
      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Application Submitted</AlertTitle>
          <AlertDescription className="text-green-700">
            Your application has been submitted successfully. You will be redirected back to the program page.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Application Form */}
      {!isLoading && !error && !success && (
        <div>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Apply to {initiativeName}</CardTitle>
              <CardDescription>
                Complete the application form below to apply for this program
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Form content based on application type */}
              {applicationType === 'standard' && (
                <>
                  {cohort?.["Application Form ID (Fillout)"] ? (
                    <div className="fillout-container min-h-[500px]">
                      <FilloutStandardEmbed
                        formId={cohort["Application Form ID (Fillout)"]}
                        prefill={{
                          cohortId: cohort.id,
                          initiativeName: initiativeName,
                          userEmail: profile?.email,
                          userName: profile?.name,
                          userContactId: profile?.contactId,
                          user_id: user?.sub,
                          contact: profile?.contactId,
                          institution: profile?.institution?.id
                        }}
                        onSubmit={handleFilloutSubmit}
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground mb-4">
                        No application form available for this program. Please contact the program administrator.
                      </p>
                      <Button onClick={handleGoBack} variant="outline">
                        Return to Program
                      </Button>
                    </div>
                  )}
                </>
              )}
              
              {/* Xtrapreneurs Application Form */}
              {applicationType === 'xtrapreneurs' && (
                <div className="xtrapreneurs-form-container">
                  <XtrapreneursApplicationForm
                    profile={profile}
                    cohort={cohort}
                    onSubmit={handleSubmitApplication}
                    isPage={true} // Flag to indicate this is a page, not a dialog
                  />
                </div>
              )}
              
              {/* Team Application Form */}
              {applicationType === 'team' && (
                <div className="team-application-container">
                  <TeamApplicationForm
                    profile={profile}
                    cohort={cohort}
                    onSubmit={handleSubmitApplication}
                    isPage={true} // Flag to indicate this is a page, not a dialog
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button 
                variant="outline" 
                onClick={handleGoBack}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              {/* If we have a custom form with its own submit button, we don't need this */}
              {/* This button is just for additional context and is hidden for forms with their own buttons */}
              {isSubmitting && (
                <Button disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      )}
    </motion.div>
  )
}

export default ProgramApplicationPage