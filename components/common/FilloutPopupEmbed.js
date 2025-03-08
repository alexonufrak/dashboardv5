"use client"

import { useEffect, useState } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { FilloutStandardEmbed } from '@fillout/react'

/**
 * Component to embed Fillout forms in a popup dialog
 * @param {Object} props - Component props
 * @param {string} props.filloutId - The Fillout form ID
 * @param {Function} props.onClose - Function to call when form is closed
 * @param {Function} props.onSubmit - Function to call when form is submitted
 * @param {Object} props.parameters - Parameters to pass to the Fillout form
 */
const FilloutPopupEmbed = ({ 
  filloutId, 
  onClose, 
  onSubmit, 
  parameters = {} 
}) => {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  
  useEffect(() => {
    if (filloutId) {
      // Short delay to ensure dialog is mounted before loading form
      setTimeout(() => {
        setShowForm(true)
        setLoading(false)
      }, 500)
    }
  }, [filloutId])
  
  // Handle form submission
  const handleSubmit = async (submissionId) => {
    try {
      console.log("Form submitted with ID:", submissionId)
      setFormSubmitted(true)
      
      // Call API to record application
      const response = await fetch('/api/applications/fillout-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submissionId,
          filloutId,
          cohortId: parameters.cohortId,
          userId: user?.sub,
          contactId: parameters.userContactId || parameters.contact
        })
      })
      
      if (response.ok) {
        console.log("Application recorded successfully")
        
        // If onSubmit callback is provided, call it
        if (onSubmit) {
          onSubmit(submissionId)
        }
      } else {
        console.error("Failed to record application:", await response.text())
      }
    } catch (error) {
      console.error("Error recording application:", error)
    }
  }
  
  // Handle dialog close
  const handleDialogClose = () => {
    if (onClose) onClose()
  }
  
  return (
    <Dialog open={true} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {parameters.initiativeName || "Program Application"}
          </DialogTitle>
        </DialogHeader>
        
        {loading && (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading application form...</p>
          </div>
        )}
        
        {showForm && !formSubmitted && (
          <div className="fillout-container">
            <FilloutStandardEmbed
              formId={filloutId}
              prefill={{
                ...parameters,
                email: user?.email,
                name: user?.name
              }}
              onSubmit={handleSubmit}
              className="w-full"
            />
          </div>
        )}
        
        {formSubmitted && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h3 className="text-xl font-bold mb-2">Application Submitted</h3>
            <p className="text-gray-600 mb-6">
              Thank you for your application! We'll review it and get back to you soon.
            </p>
            <Button onClick={handleDialogClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default FilloutPopupEmbed