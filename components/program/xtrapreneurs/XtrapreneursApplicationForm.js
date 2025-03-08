import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BadgeCheck } from 'lucide-react'

/**
 * Custom application form for Xtrapreneurs initiative
 * To be shown in a dialog within the dashboard
 */
const XtrapreneursApplicationForm = ({ open, onClose, onSubmit, cohort = {}, profile = {} }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    reason: "",
    commitment: "weekly" // Default to weekly
  })
  const [errors, setErrors] = useState({})
  const [isSuccess, setIsSuccess] = useState(false)

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
  }

  // Handle select changes
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
  }

  // Validate form data
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.reason.trim()) {
      newErrors.reason = "Please explain why you want to join Xtrapreneurs"
    }
    
    if (!formData.commitment) {
      newErrors.commitment = "Please select your time commitment"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form data
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Prepare application data
      const applicationData = {
        cohortId: cohort.id,
        reason: formData.reason,
        commitment: formData.commitment,
        // Add metadata about user
        userId: profile.userId,
        contactId: profile.contactId,
        userEmail: profile.email,
        userName: profile.name,
        // Flag this as xtrapreneurs application
        applicationType: "xtrapreneurs"
      }
      
      // Submit application to API
      const response = await fetch('/api/applications/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(applicationData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application')
      }
      
      // Show success state
      setIsSuccess(true)
      
      // After a brief delay, close the dialog and call onSubmit
      setTimeout(() => {
        if (onSubmit) {
          onSubmit(data)
        }
        onClose()
      }, 1500)
      
    } catch (error) {
      console.error('Error submitting Xtrapreneurs application:', error)
      setErrors({
        submit: error.message || 'An error occurred. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form when dialog opens/closes
  const handleDialogChange = (open) => {
    if (!open) {
      // Reset form state if dialog is closed
      setFormData({
        reason: "",
        commitment: "weekly"
      })
      setErrors({})
      setIsSuccess(false)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-md">
        {isSuccess ? (
          // Success state
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <BadgeCheck className="h-10 w-10 text-green-600" />
            </div>
            <DialogTitle className="text-center">Application Submitted!</DialogTitle>
            <DialogDescription className="text-center">
              Your application for the Xtrapreneurs initiative has been successfully submitted.
            </DialogDescription>
          </div>
        ) : (
          // Form state
          <>
            <DialogHeader>
              <DialogTitle>Apply to Xtrapreneurs</DialogTitle>
              <DialogDescription>
                Fill out this form to apply for the {cohort.initiativeDetails?.name || "Xtrapreneurs"} initiative.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              {/* Reason field */}
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-sm font-medium">
                  Why do you want to join Xtrapreneurs? <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Tell us your motivation for joining..."
                  className={errors.reason ? "border-red-500" : ""}
                  rows={4}
                />
                {errors.reason && (
                  <p className="text-sm text-red-500">{errors.reason}</p>
                )}
              </div>
              
              {/* Commitment field */}
              <div className="space-y-2">
                <Label htmlFor="commitment" className="text-sm font-medium">
                  How much time do you want to commit to Xtrapreneurs this year? <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.commitment} 
                  onValueChange={(value) => handleSelectChange('commitment', value)}
                >
                  <SelectTrigger className={errors.commitment ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select your time commitment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="occasionally">Occasionally</SelectItem>
                  </SelectContent>
                </Select>
                {errors.commitment && (
                  <p className="text-sm text-red-500">{errors.commitment}</p>
                )}
              </div>
              
              {/* General error message */}
              {errors.submit && (
                <p className="text-sm text-red-500 p-2 bg-red-50 rounded-md">{errors.submit}</p>
              )}
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default XtrapreneursApplicationForm