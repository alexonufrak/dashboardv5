"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, BriefcaseBusiness, Award, Calendar, Clock } from "lucide-react"

const BountyCard = ({ bounty, onApply }) => {
  // Format currency
  const formatCurrency = (value) => {
    if (!value) return "N/A"
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0 
    }).format(value)
  }

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'closed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get type badge color
  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'internship':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'project':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'bounty':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold line-clamp-1">{bounty.title || "Unnamed Bounty"}</CardTitle>
            <CardDescription className="line-clamp-1">
              {bounty.internshipOrganization?.[0]?.name || bounty.organization || "No organization specified"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className={getStatusColor(bounty.status)}>
              {bounty.status || "Unknown Status"}
            </Badge>
            <Badge variant="outline" className={getTypeColor(bounty.classification)}>
              {bounty.classification || "Unclassified"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {bounty.classification === "Internship" ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{bounty.internshipTitle || "Internship Position"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4" />
              <span>Compensation: {formatCurrency(bounty.internshipCompensation)}</span>
            </div>
            <div className="mt-2">
              <p className="text-sm line-clamp-3">{bounty.internshipDescription || "No description provided"}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span>Prize: {formatCurrency(bounty.prizeValue)}</span>
            </div>
            <div className="mt-2">
              <p className="text-sm line-clamp-3">{bounty.description || "No description provided"}</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="text-xs text-muted-foreground flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          Last updated: {new Date(bounty.lastModified).toLocaleDateString()}
        </div>
        <Button size="sm" variant={bounty.status === "Open" ? "default" : "outline"} disabled={bounty.status !== "Open"} onClick={() => onApply(bounty)}>
          Apply
        </Button>
      </CardFooter>
    </Card>
  )
}

export default BountyCard