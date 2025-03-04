"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileCheck, FileX, Calendar, BarChart, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function SubmissionSummaryCard({ submissions = [], milestones = [] }) {
  // Calculate submission statistics
  const totalSubmissions = submissions.length
  const totalMilestones = milestones.length
  
  // Get recently completed submissions (last 7 days)
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  const recentSubmissions = submissions.filter(sub => {
    const createdDate = new Date(sub.createdTime || sub.Created_Time || sub.created)
    return createdDate >= oneWeekAgo
  })
  
  // Count overdue/missing submissions
  const overdueCount = milestones.filter(m => {
    const isDueDate = m.dueDate && new Date(m.dueDate) < new Date() 
    const notCompleted = m.status !== 'completed'
    const hasNoSubmission = !submissions.some(sub => 
      sub.milestoneId === m.id || sub.Milestone?.[0] === m.id)
    
    return isDueDate && notCompleted && hasNoSubmission
  }).length
  
  // Get upcoming submission deadlines
  const upcomingDeadlines = milestones
    .filter(m => {
      const dueDate = m.dueDate && new Date(m.dueDate)
      const isInFuture = dueDate && dueDate > new Date()
      const notCompleted = m.status !== 'completed'
      return isInFuture && notCompleted
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 3)
    
  // Calculate submission rate
  const completedMilestones = milestones.filter(m => m.status === 'completed').length
  const submissionRate = totalMilestones > 0 
    ? Math.round((completedMilestones / totalMilestones) * 100) 
    : 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Submission Summary</CardTitle>
        <CardDescription>Track your milestone submissions and deadlines</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-violet-50 rounded-lg p-3 border border-violet-100">
            <div className="flex items-center gap-2 mb-1">
              <Upload className="h-5 w-5 text-violet-600" />
              <span className="text-sm font-medium text-violet-800">Total Submissions</span>
            </div>
            <div className="text-2xl font-bold text-violet-900">{totalSubmissions}</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <div className="flex items-center gap-2 mb-1">
              <FileCheck className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Recent Submissions</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{recentSubmissions.length}</div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
            <div className="flex items-center gap-2 mb-1">
              <FileX className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-800">Overdue</span>
            </div>
            <div className="text-2xl font-bold text-red-900">{overdueCount}</div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <BarChart className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Submission Rate</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{submissionRate}%</div>
          </div>
        </div>
        
        {/* Upcoming deadlines */}
        {upcomingDeadlines.length > 0 && (
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 mb-6">
            <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Upcoming Deadlines
            </h4>
            
            <div className="space-y-3">
              {upcomingDeadlines.map((milestone, index) => (
                <div key={milestone.id || index} className="flex justify-between items-center">
                  <div className="font-medium text-amber-900">{milestone.name}</div>
                  <Badge variant="outline" className="bg-amber-100 border-amber-200 text-amber-800">
                    {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric'
                    }) : "No date"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Submit button */}
        <div className="text-center">
          <Button>
            Create New Submission
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}