"use client"

import { useState, useEffect } from "react"
import { useUser } from "@auth0/nextjs-auth0"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Alert component displayed when a user has successfully accepted a team invitation
 * during the signup/login process
 */
export default function TeamInviteSuccessAlert({ onDismiss }) {
  const { user } = useUser()
  const [visible, setVisible] = useState(false)
  const [teamName, setTeamName] = useState("")
  
  useEffect(() => {
    // Check if user has accepted a team invitation
    if (user && user.teamInviteAccepted && user.teamInviteAccepted.success) {
      setVisible(true)
      setTeamName(
        user.teamInviteAccepted.team?.name || 
        localStorage.getItem('xFoundry_teamName') || 
        "the team"
      )
    } else {
      setVisible(false)
    }
    
    // Clean up after displaying the alert
    return () => {
      // Remove the localStorage item after 1 hour to prevent stale data
      const clearStorage = setTimeout(() => {
        localStorage.removeItem('xFoundry_teamName')
      }, 3600000)
      
      return () => clearTimeout(clearStorage)
    }
  }, [user])
  
  const handleDismiss = () => {
    setVisible(false)
    if (onDismiss) onDismiss()
  }
  
  if (!visible) return null
  
  return (
    <Alert className="flex items-center justify-between mb-6 bg-green-50 border-green-200 text-green-800">
      <div className="flex items-start space-x-2">
        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
        <AlertDescription className="text-sm font-medium">
          Welcome to the team! You&apos;ve successfully joined <span className="font-semibold">{teamName}</span>.
        </AlertDescription>
      </div>
      <Button 
        size="icon" 
        variant="ghost" 
        onClick={handleDismiss} 
        className="h-6 w-6 text-green-600 hover:bg-green-100 hover:text-green-800"
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  )
}