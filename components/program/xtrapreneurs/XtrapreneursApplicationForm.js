"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/**
 * Application form component for Xtrapreneurs program
 * Simplified version restored temporarily for build compatibility
 */
const XtrapreneursApplicationForm = ({ profile, cohort, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    institution: profile?.institutionName || '',
    major: profile?.major || '',
    year: profile?.graduationYear || '',
    reason: '',
    experience: '',
    referral: 'Website'
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      if (onSubmit) {
        await onSubmit({
          ...formData,
          cohortId: cohort?.id,
          initiativeId: cohort?.initiativeId
        })
      }
    } catch (error) {
      console.error("Error submitting application:", error)
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
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Xtrapreneurs Application</CardTitle>
        <CardDescription>
          Apply to join the {cohort?.name || 'Xtrapreneurs'} cohort
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
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
            <Label htmlFor="experience">Relevant Experience</Label>
            <Textarea 
              id="experience" 
              name="experience" 
              value={formData.experience}
              onChange={handleChange}
              placeholder="Share your relevant experience..."
              required 
              rows={3}
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="referral">How did you hear about us?</Label>
            <Select 
              id="referral"
              name="referral"
              value={formData.referral}
              onValueChange={(value) => handleSelectChange('referral', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Website">Website</SelectItem>
                <SelectItem value="Social Media">Social Media</SelectItem>
                <SelectItem value="Friend">Friend/Colleague</SelectItem>
                <SelectItem value="School">School/Institution</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
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
}

export default XtrapreneursApplicationForm