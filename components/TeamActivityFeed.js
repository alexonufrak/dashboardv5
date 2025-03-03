"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { Trophy, Flag, CheckCircle, Edit3, FileText, MessageSquare } from "lucide-react"

const getInitials = (name) => {
  if (!name) return "??"
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

// Activity icons by type
const activityIcons = {
  milestone_completed: <CheckCircle className="h-4 w-4 text-green-600" />,
  points_earned: <Trophy className="h-4 w-4 text-amber-600" />,
  milestone_started: <Flag className="h-4 w-4 text-blue-600" />,
  document_updated: <Edit3 className="h-4 w-4 text-purple-600" />,
  submission_created: <FileText className="h-4 w-4 text-cyan-600" />,
  comment_added: <MessageSquare className="h-4 w-4 text-slate-600" />
}

// Sample activity data - in production, this would come from the API
const sampleActivities = [
  {
    id: "act1",
    type: "milestone_completed",
    title: "Milestone Completed",
    description: "Ideation Process milestone has been completed",
    member: {
      id: "m1",
      name: "Jane Cooper",
      avatar: ""
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
  },
  {
    id: "act2",
    type: "points_earned",
    title: "Points Earned",
    description: "Team earned 25 points for workshop attendance",
    member: {
      id: "m2",
      name: "John Smith",
      avatar: ""
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12) // 12 hours ago
  },
  {
    id: "act3",
    type: "document_updated",
    title: "Document Updated",
    description: "Project proposal document has been updated",
    member: {
      id: "m3",
      name: "Emily Johnson",
      avatar: ""
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
  },
  {
    id: "act4",
    type: "milestone_started",
    title: "Milestone Started",
    description: "Team has started working on the Prototype Development milestone",
    member: {
      id: "m1",
      name: "Jane Cooper",
      avatar: ""
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36) // 1.5 days ago
  },
  {
    id: "act5",
    type: "submission_created",
    title: "Submission Created",
    description: "Milestone submission for Problem Definition has been created",
    member: {
      id: "m4",
      name: "Alex Turner",
      avatar: ""
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48) // 2 days ago
  },
  {
    id: "act6",
    type: "comment_added",
    title: "Comment Added",
    description: "New comment added to the team discussion",
    member: {
      id: "m5",
      name: "Sarah Williams",
      avatar: ""
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72) // 3 days ago
  }
]

const ActivityItem = ({ activity, detailed = false }) => {
  return (
    <div className={`flex gap-3 ${detailed ? "pb-4 mb-4 border-b last:border-0 last:mb-0 last:pb-0" : "mb-4 last:mb-0"}`}>
      <div className="flex-shrink-0 relative">
        <Avatar className="h-8 w-8">
          <AvatarImage src={activity.member.avatar} alt={activity.member.name} />
          <AvatarFallback>{getInitials(activity.member.name)}</AvatarFallback>
        </Avatar>
        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 bg-white rounded-full p-0.5">
          {activityIcons[activity.type] || <CheckCircle className="h-4 w-4 text-gray-400" />}
        </div>
      </div>
      
      <div className="flex-grow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="font-medium flex gap-1 items-center">
            {activity.member.name}
            <Badge 
              variant="outline" 
              className={
                activity.type === "milestone_completed" ? "bg-green-50 text-green-600 border-green-200" :
                activity.type === "points_earned" ? "bg-amber-50 text-amber-600 border-amber-200" :
                activity.type === "milestone_started" ? "bg-blue-50 text-blue-600 border-blue-200" :
                activity.type === "document_updated" ? "bg-purple-50 text-purple-600 border-purple-200" :
                activity.type === "submission_created" ? "bg-cyan-50 text-cyan-600 border-cyan-200" :
                "bg-gray-50 text-gray-600 border-gray-200"
              }
            >
              {activity.title}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground mt-1">
          {activity.description}
        </div>
        
        {detailed && activity.details && (
          <div className="mt-2 text-sm bg-gray-50 p-2 rounded-md border">
            {activity.details}
          </div>
        )}
      </div>
    </div>
  )
}

export default function TeamActivityFeed({ team, detailed = false }) {
  // In production, this would fetch real activity data based on team ID
  // For now, we're using sample data
  const activities = sampleActivities
  
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        No recent activity found.
      </div>
    )
  }
  
  // Show all activities if detailed, or just the first 3 if not
  const displayActivities = detailed ? activities : activities.slice(0, 3)
  
  return (
    <div>
      {displayActivities.map(activity => (
        <ActivityItem 
          key={activity.id}
          activity={activity}
          detailed={detailed}
        />
      ))}
    </div>
  )
}