"use client"

import { Avatar, Badge, Skeleton } from "@heroui/react"
import { formatDistanceToNow, isValid } from "date-fns"
import { 
  Trophy, 
  Flag, 
  CheckCircle, 
  Edit3, 
  FileText, 
  MessageSquare 
} from "lucide-react"
import { usePointTransactions } from "@/lib/useDataFetching"
import { Team } from "@/types/dashboard"

// Helper to get initials for avatar fallback
const getInitials = (name?: string): string => {
  if (!name) return "??"
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

// Activity type definitions
type ActivityType = 
  | 'milestone_completed'
  | 'points_earned'
  | 'milestone_started' 
  | 'document_updated'
  | 'submission_created'
  | 'comment_added';

// Activity data structure
interface ActivityMember {
  id: string;
  name: string;
  avatar?: string;
}

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  points?: number;
  member: ActivityMember;
  timestamp: Date;
  details?: string;
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

// Get badge color based on activity type
const getActivityBadgeColor = (type: ActivityType): string => {
  switch(type) {
    case 'milestone_completed': return 'success';
    case 'points_earned': return 'warning';
    case 'milestone_started': return 'primary';
    case 'document_updated': return 'secondary';
    case 'submission_created': return 'info';
    case 'comment_added': default: return 'default';
  }
}

interface ActivityItemProps {
  activity: Activity;
  detailed?: boolean;
}

const ActivityItem = ({ activity, detailed = false }: ActivityItemProps) => {
  return (
    <div className={`flex gap-3 ${detailed ? "pb-4 mb-4 border-b last:border-0 last:mb-0 last:pb-0" : "mb-4 last:mb-0"}`}>
      <div className="flex-shrink-0 relative">
        <Avatar 
          className="h-8 w-8"
          src={activity.member.avatar}
          name={getInitials(activity.member.name)}
          showFallback
        />
        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 bg-white rounded-full p-0.5">
          {activityIcons[activity.type] || <CheckCircle className="h-4 w-4 text-gray-400" />}
        </div>
      </div>
      
      <div className="flex-grow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="font-medium flex gap-1 items-center">
            {activity.member.name}
            <Badge 
              variant="flat" 
              color={getActivityBadgeColor(activity.type)}
              size="sm"
            >
              {activity.title}
            </Badge>
          </div>
          <div className="text-xs text-default-500">
            {activity.timestamp ? (() => {
              try {
                if (isValid(activity.timestamp)) {
                  return formatDistanceToNow(activity.timestamp, { addSuffix: true });
                }
                return "Date unknown";
              } catch (e) {
                return "Date unknown";
              }
            })() : "Date unknown"}
          </div>
        </div>
        
        <div className="text-sm text-default-500 mt-1">
          {activity.description}
        </div>
        
        {detailed && activity.details && (
          <div className="mt-2 text-sm bg-default-100 p-2 rounded-md border">
            {activity.details}
          </div>
        )}
      </div>
    </div>
  )
}

interface TeamActivityFeedProps {
  team?: Team;
  detailed?: boolean;
}

export default function TeamActivityFeed({ team, detailed = false }: TeamActivityFeedProps) {
  // Fetch point transactions for this team
  const { 
    data: pointTransactions = [], 
    isLoading: isLoadingPoints
  } = usePointTransactions(undefined, team?.id)
  
  // Generate activity items from point transactions
  const generateActivities = (): Activity[] => {
    if (!pointTransactions || pointTransactions.length === 0) return []
    
    return pointTransactions.map(transaction => {
      // Map transaction to activity format
      let type: ActivityType = "points_earned"
      let title = "Points Earned"
      
      // Try to determine more specific type based on achievement name
      if (transaction.achievementName) {
        const name = transaction.achievementName.toLowerCase()
        if (name.includes("milestone") && name.includes("complet")) {
          type = "milestone_completed"
          title = "Milestone Completed"
        } else if (name.includes("submission") || name.includes("submit")) {
          type = "submission_created"
          title = "Submission Created"
        }
      }
      
      // Create activity object
      return {
        id: transaction.id,
        type,
        title,
        description: transaction.achievementName || `Earned ${transaction.pointsValue} points`,
        points: transaction.pointsValue,
        member: {
          id: transaction.contactId || "team",
          name: transaction.contactName || team?.name || "Team Member",
          avatar: ""
        },
        timestamp: transaction.date ? new Date(transaction.date) : new Date(),
        details: transaction.description
      }
    })
  }
  
  // Get activities
  const activities = generateActivities()
  
  // Loading state
  if (isLoadingPoints) {
    return (
      <div className="space-y-4">
        {Array(detailed ? 5 : 3).fill(0).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  // Empty state
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center p-4 text-default-500">
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