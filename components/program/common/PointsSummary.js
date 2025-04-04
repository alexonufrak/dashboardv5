"use client"

import { useState, useEffect } from "react"
import { Award, TrendingUp, Clock, Info } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { usePointTransactions } from "@/lib/useDataFetching"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function PointsSummary({ team }) {
  // Initialize states first
  const [memberPoints, setMemberPoints] = useState([])
  const [pointsBreakdown, setPointsBreakdown] = useState(null)
  
  // Fetch point transactions - use optional chaining for team
  const { 
    data: pointTransactions = [], 
    isLoading,
    isError 
  } = usePointTransactions(null, team?.id)
  
  // Get total team points from the team data
  const totalPoints = team?.points || 0
  
  useEffect(() => {
    // Return early inside the effect if no team
    if (!team) return;
    if (!isLoading && pointTransactions?.length > 0 && team?.members?.length > 0) {
      // Create a map of member IDs to point totals
      const memberPointsMap = new Map()
      
      // Initialize with all team members
      team.members.forEach(member => {
        memberPointsMap.set(member.id, {
          ...member,
          points: 0,
          percentage: 0,
          transactions: []
        })
      })
      
      // Group transactions by achievement types for breakdown
      const breakdownMap = {
        milestone: { label: "Milestone Completion", points: 0 },
        attendance: { label: "Event Attendance", points: 0 },
        submission: { label: "Submissions", points: 0 },
        other: { label: "Other Activities", points: 0 }
      }
      
      // Process each transaction
      pointTransactions.forEach(transaction => {
        // Skip if we don't have an achievement name or points value
        if (!transaction.achievementName || !transaction.pointsValue) return
        
        // Determine category from achievement name (simplified)
        let category = 'other'
        const achievementName = transaction.achievementName.toLowerCase()
        
        if (achievementName.includes('milestone') || achievementName.includes('completion')) {
          category = 'milestone'
        } else if (achievementName.includes('attendance') || achievementName.includes('event')) {
          category = 'attendance'
        } else if (achievementName.includes('submission') || achievementName.includes('deliverable')) {
          category = 'submission'
        }
        
        // Add to breakdown
        breakdownMap[category].points += transaction.pointsValue
        
        // If this transaction is associated with a specific member
        if (transaction.contactId) {
          // Find the member in our team
          const memberEntry = team.members.find(m => 
            // Match by contactId, or email as fallback
            m.contactId === transaction.contactId || 
            (m.email && transaction.contactEmail && m.email === transaction.contactEmail)
          )
          
          if (memberEntry && memberPointsMap.has(memberEntry.id)) {
            const currentMember = memberPointsMap.get(memberEntry.id)
            currentMember.points += transaction.pointsValue
            currentMember.transactions.push(transaction)
            memberPointsMap.set(memberEntry.id, currentMember)
          }
        }
      })
      
      // Convert the map to an array and sort by points
      let memberPointsArray = Array.from(memberPointsMap.values())
      
      // Calculate percentages
      if (totalPoints > 0) {
        memberPointsArray = memberPointsArray.map(member => ({
          ...member,
          percentage: totalPoints > 0 ? Math.round((member.points / totalPoints) * 100) : 0
        }))
      }
      
      // Sort by points and take top 3
      const sortedMemberPoints = memberPointsArray
        .sort((a, b) => b.points - a.points)
        .filter(member => member.points > 0)
        .slice(0, 3)
      
      setMemberPoints(sortedMemberPoints)
      setPointsBreakdown(Object.values(breakdownMap))
    }
  }, [pointTransactions, team, isLoading, totalPoints])

  // Early return after useEffect hook
  if (!team) return null
  
  return (
    <div className="space-y-4">
      {/* Total points display */}
      <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20 dark:bg-primary/20 dark:border-primary/30">
        <Award className="h-8 w-8 text-primary mx-auto mb-2" />
        <div className="text-2xl font-bold text-primary-foreground dark:text-primary">{totalPoints}</div>
        <div className="text-sm text-primary-foreground/80 dark:text-primary/80">Total Team Points</div>
      </div>
      
      {/* Top contributors */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-24 mb-2" />
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      ) : memberPoints.length > 0 ? (
        <div>
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">Top Contributors</h4>
          <div className="space-y-3">
            {memberPoints.map((member, index) => (
              <div key={member.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="truncate max-w-[140px]">{member.name}</span>
                  <span className="font-medium">{member.points} pts</span>
                </div>
                <Progress 
                  value={member.percentage} 
                  className="h-2" 
                  indicatorClassName={
                    index === 0 ? "bg-primary" : 
                    index === 1 ? "bg-primary/80" : 
                    "bg-primary/60"
                  }
                />
                <div className="text-xs text-right text-muted-foreground">
                  {member.percentage}% of team total
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-muted/40 dark:bg-muted p-3 rounded-md text-sm text-muted-foreground flex items-center">
          <Info className="h-4 w-4 mr-2 text-primary" />
          No individual point contributions yet
        </div>
      )}
      
      {/* Last points activity */}
      {!isLoading && pointTransactions?.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/40 dark:bg-muted rounded-lg border dark:border-border">
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-primary mr-2" />
            <span className="text-sm font-medium">Last Activity</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-medium text-sm cursor-pointer">
                  {pointTransactions[0]?.achievementName?.length > 15 
                    ? `${pointTransactions[0]?.achievementName?.substring(0, 15)}...` 
                    : pointTransactions[0]?.achievementName || "Point Activity"}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{pointTransactions[0]?.achievementName || "Point Activity"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {pointTransactions[0]?.date 
                    ? new Date(pointTransactions[0].date).toLocaleDateString() 
                    : "Date unknown"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      
      {/* Points breakdown */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-32 mb-2" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        </div>
      ) : pointsBreakdown && pointsBreakdown.some(item => item.points > 0) ? (
        <div>
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">Points Breakdown</h4>
          <div className="space-y-2 text-sm">
            {pointsBreakdown.filter(item => item.points > 0).map((item, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-muted/40 dark:bg-muted p-3 rounded-md text-sm text-muted-foreground flex items-center">
          <Info className="h-4 w-4 mr-2 text-primary" />
          No point breakdown available
        </div>
      )}
    </div>
  )
}