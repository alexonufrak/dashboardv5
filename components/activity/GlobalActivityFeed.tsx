"use client"

import { Avatar, Badge, Skeleton, Card, CardHeader, CardBody } from "@heroui/react"
import { formatDistanceToNow, isValid } from "date-fns"
import { 
  Trophy, 
  Flag, 
  CheckCircle, 
  Edit3, 
  FileText, 
  MessageSquare,
  Activity
} from "lucide-react"
import { usePointTransactions } from "@/lib/useDataFetching"
import { ActivityMember, ActivityType } from "@/types/dashboard"
import { useDashboard } from "@/contexts/DashboardContext"

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

// Activity data structure
interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  points?: number;
  member: ActivityMember;
  timestamp: Date;
  details?: string;
  teamId?: string;
  teamName?: string;
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
const getActivityBadgeColor = (type: ActivityType) => {
  switch(type) {
    case 'milestone_completed': return 'success' as const;
    case 'points_earned': return 'warning' as const;
    case 'milestone_started': return 'primary' as const;
    case 'document_updated': return 'secondary' as const;
    case 'submission_created': return 'primary' as const; // Changed from 'info' to 'primary' for HeroUI compatibility
    case 'comment_added': default: return 'default' as const;
  }
}

interface ActivityItemProps {
  activity: ActivityItem;
  detailed?: boolean;
}

const ActivityItemComponent = ({ activity, detailed = false }: ActivityItemProps) => {
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
          <div className="font-medium flex flex-wrap gap-1 items-center">
            {activity.member.name}
            <Badge 
              variant="flat" 
              color={getActivityBadgeColor(activity.type)}
              size="sm"
            >
              {activity.title}
            </Badge>
            {activity.teamName && (
              <Badge variant="flat" color="default" size="sm">
                {activity.teamName}
              </Badge>
            )}
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

interface GlobalActivityFeedProps {
  detailed?: boolean;
  limit?: number;
  title?: string;
}

export default function GlobalActivityFeed({ 
  detailed = false,
  limit = 5,
  title = "Recent Activity"
}: GlobalActivityFeedProps) {
  const { profile } = useDashboard();
  const contactId = profile?.id;
  
  // Fetch point transactions for this user
  const { 
    data: pointTransactions = [], 
    isLoading: isLoadingPoints
  } = usePointTransactions(contactId)
  
  // Generate activity items from point transactions
  const generateActivities = (): ActivityItem[] => {
    if (!pointTransactions || pointTransactions.length === 0) return []
    
    return pointTransactions.map((transaction: any) => {
      // Map transaction to activity format
      let type: ActivityType = "points_earned"
      let title = "Points Earned"
      
      // Determine activity type based on achievement type/name
      if (transaction.type) {
        // If we have a specific type, use it
        const transactionType = transaction.type.toLowerCase()
        if (transactionType.includes('milestone')) {
          type = "milestone_completed"
          title = "Milestone Completed"
        } else if (transactionType.includes('submission')) {
          type = "submission_created"
          title = "Submission Created"
        } else if (transactionType.includes('document')) {
          type = "document_updated"
          title = "Document Updated"
        } else if (transactionType.includes('comment')) {
          type = "comment_added"
          title = "Comment Added"
        }
      } else if (transaction.achievementName) {
        // Try to determine type based on achievement name as fallback
        const name = transaction.achievementName.toLowerCase()
        if (name.includes("milestone") && name.includes("complet")) {
          type = "milestone_completed"
          title = "Milestone Completed"
        } else if (name.includes("submission") || name.includes("submit")) {
          type = "submission_created"
          title = "Submission Created"
        } else if (name.includes("document") || name.includes("update")) {
          type = "document_updated"
          title = "Document Updated"
        } else if (name.includes("comment") || name.includes("feedback")) {
          type = "comment_added"
          title = "Comment Added"
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
          id: transaction.contactId || "user",
          name: transaction.contactName || "You",
          avatar: ""
        },
        timestamp: transaction.date ? new Date(transaction.date) : new Date(),
        details: transaction.description,
        teamId: transaction.teamId,
        teamName: transaction.teamName
      }
    })
  }
  
  // Get activities and limit if needed
  const activities = generateActivities()
  const displayActivities = limit ? activities.slice(0, limit) : activities
  
  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <Activity className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      </CardHeader>
      
      <CardBody>
        {isLoadingPoints ? (
          <div className="space-y-4">
            {Array(limit).fill(0).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : displayActivities.length > 0 ? (
          <div>
            {displayActivities.map(activity => (
              <ActivityItemComponent 
                key={activity.id}
                activity={activity}
                detailed={detailed}
              />
            ))}
          </div>
        ) : (
          <div className="text-center p-4 text-default-500">
            No recent activity found.
          </div>
        )}
      </CardBody>
    </Card>
  )
}