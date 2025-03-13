"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent } from "@/components/ui/dialog"

/**
 * Application form component for Xtrapreneurs program
 * Can be used as a dialog or within a page layout
 * @param {Object} props - Component props
 * @param {Object} props.profile - User profile data
 * @param {Object} props.cohort - Cohort data
 * @param {Function} props.onSubmit - Function to call when form is submitted
 * @param {Function} props.onClose - Function to call when form is closed (for dialog mode)
 * @param {boolean} props.open - Whether the dialog is open (for dialog mode)
 * @param {boolean} props.isPage - Whether the form is displayed on a page (not in a dialog)
 */
const XtrapreneursApplicationForm = ({ profile, cohort, onSubmit, onClose, open, isPage = false }) => {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    institution: profile?.institutionName || '',
    major: profile?.major || '',
    year: profile?.graduationYear || '',
    reason: '',
    commitment: 'Weekly'
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Create the payload for the API
      const payload = {
        cohortId: cohort?.id,
        applicationType: 'xtrapreneurs',
        reason: formData.reason,
        commitment: formData.commitment,
        // Add any additional required fields
        participationType: 'Individual'
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
      
      const data = await response.json()
      
      if (onSubmit) {
        await onSubmit(data)
      }
    } catch (error) {
      console.error("Error submitting Xtrapreneurs application:", error)
      alert("There was an error submitting your application. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Render differently based on whether we're in a dialog or page
  const renderFormContent = () => (
    <Card className={isPage ? "border-0 shadow-none" : "w-full border-0 shadow-none"}>
      <CardHeader className={isPage ? "px-0 pt-0" : "px-0 pt-0"}>
        <CardTitle>Xtrapreneurs Application</CardTitle>
        <CardDescription>
          Apply to join the {cohort?.name || 'Xtrapreneurs'} cohort
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 px-0">
              <div className="space-y-1">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  disabled={true}
                  required 
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  value={formData.email}
                  onChange={handleChange}
                  disabled={true}
                  required 
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="institution">Institution</Label>
                <Input 
                  id="institution" 
                  name="institution" 
                  value={formData.institution}
                  onChange={handleChange}
                  disabled={true}
                  required 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="major">Major/Field of Study</Label>
                  <Input 
                    id="major" 
                    name="major" 
                    value={formData.major}
                    onChange={handleChange}
                    required 
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="year">Graduation Year</Label>
                  <Input 
                    id="year" 
                    name="year" 
                    value={formData.year}
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="reason">Why are you interested in joining?</Label>
                <Textarea 
                  id="reason" 
                  name="reason" 
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Tell us about your interest..."
                  required 
                  rows={3}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="commitment">What is your expected commitment level?</Label>
                <Select 
                  id="commitment"
                  name="commitment"
                  value={formData.commitment}
                  onValueChange={(value) => handleSelectChange('commitment', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a commitment level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Occasionally">Occasionally</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end gap-2 px-0">
              {!isPage && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                >
                  Cancel
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </CardFooter>
          </form>
        </Card>
  )
  
  // If we're in page mode, just render the form directly
  if (isPage) {
    return renderFormContent();
  }
  
  // Otherwise, wrap it in a dialog
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        {renderFormContent()}
      </DialogContent>
    </Dialog>
  )
}

export default XtrapreneursApplicationForm