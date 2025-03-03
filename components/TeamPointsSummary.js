"use client"

import { Award, TrendingUp, Users } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function TeamPointsSummary({ team }) {
  if (!team) return null
  
  // Get total team points
  const totalPoints = team.points || 0
  
  // Calculate member contribution percentages (if available)
  const memberContributions = team.members?.map(member => {
    // This is placeholder - real data would come from the API
    const pointContribution = Math.floor(Math.random() * 200) + 50 // Placeholder random points
    const percentage = totalPoints > 0 ? Math.round((pointContribution / totalPoints) * 100) : 0
    
    return {
      ...member,
      points: pointContribution,
      percentage
    }
  }).sort((a, b) => b.points - a.points).slice(0, 3) || []
  
  // Top contributors - in a real implementation, this would be calculated from actual data
  const topContributors = memberContributions.slice(0, 3)
  
  return (
    <div className="space-y-4">
      {/* Total points display */}
      <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
        <Award className="h-8 w-8 text-blue-600 mx-auto mb-2" />
        <div className="text-2xl font-bold text-blue-800">{totalPoints}</div>
        <div className="text-sm text-blue-600">Total Team Points</div>
      </div>
      
      {/* Top contributors */}
      {topContributors.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">Top Contributors</h4>
          <div className="space-y-3">
            {topContributors.map((member, index) => (
              <div key={member.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="truncate max-w-[140px]">{member.name}</span>
                  <span className="font-medium">{member.points} pts</span>
                </div>
                <Progress 
                  value={member.percentage} 
                  className="h-2" 
                  indicatorClassName={
                    index === 0 ? "bg-blue-500" : 
                    index === 1 ? "bg-cyan-500" : 
                    "bg-indigo-500"
                  }
                />
                <div className="text-xs text-right text-muted-foreground">
                  {member.percentage}% of team total
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Team ranking - this would be real data in production */}
      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border">
        <div className="flex items-center">
          <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
          <span className="text-sm font-medium">Team Ranking</span>
        </div>
        <span className="font-bold">#3 of 12</span>
      </div>
      
      {/* Points breakdown - this would show real categories in production */}
      <div>
        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Points Breakdown</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Milestones</span>
            <span className="font-medium">240 pts</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Team Activities</span>
            <span className="font-medium">180 pts</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Individual Contributions</span>
            <span className="font-medium">{totalPoints - 420} pts</span>
          </div>
        </div>
      </div>
    </div>
  )
}