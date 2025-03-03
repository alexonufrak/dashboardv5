"use client";

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import Link from "next/link";
import { ChevronRight, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";

/**
 * MilestoneProgressCard Component
 * Simplified summary version that shows just the essential milestone information
 */
export function MilestoneProgressCard({
  programName,
  programType = "xperience",
  programId,
  milestones = [],
  className = "",
}) {
  // Calculate progress percentage
  const calculateProgress = () => {
    if (!milestones || milestones.length === 0) return 0;
    
    const completed = milestones.filter(m => m.status === "completed").length;
    return Math.round((completed / milestones.length) * 100);
  };

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return "";
    
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return dateString;
      
      return format(date, "MMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };

  // Get active milestone - first non-completed one, or most recent completed if all are completed
  const getActiveMilestone = () => {
    if (!milestones || milestones.length === 0) return null;
    
    // First, try to find the first non-completed milestone
    const active = milestones
      .filter(m => m.status !== "completed")
      .sort((a, b) => {
        // Sort by due date (earliest first)
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate) - new Date(b.dueDate);
        }
        // Sort by milestone number if no date
        return (a.number || 0) - (b.number || 0);
      })[0];
    
    // If all milestones are completed, return the last one
    if (!active) {
      return milestones
        .filter(m => m.status === "completed")
        .sort((a, b) => {
          // Sort by completion date (most recent first)
          if (a.completedDate && b.completedDate) {
            return new Date(b.completedDate) - new Date(a.completedDate);
          }
          // Sort by milestone number if no completion date
          return (b.number || 0) - (a.number || 0);
        })[0];
    }
    
    return active;
  };

  // Get next milestone after the active one
  const getNextMilestone = () => {
    const active = getActiveMilestone();
    if (!active || !active.number) return null;
    
    // Find the next milestone by number
    return milestones
      .filter(m => (m.number || 0) > (active.number || 0))
      .sort((a, b) => (a.number || 0) - (b.number || 0))[0];
  };

  const progress = calculateProgress();
  const completedCount = milestones.filter(m => m.status === "completed").length;
  const activeMilestone = getActiveMilestone();
  const nextMilestone = getNextMilestone();

  // Show skeleton if no milestones
  if (!milestones || milestones.length === 0 || !activeMilestone) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="animate-pulse w-full">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-1/3"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-16 bg-gray-100 rounded w-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">
              {programName || "Program Milestones"}
            </CardTitle>
            <CardDescription>
              {`${progress}% Complete`} • {completedCount} of {milestones.length} milestones
            </CardDescription>
          </div>
          <Badge variant={programType === "xperience" ? "default" : "outline"} className={
            programType === "xperience" ? "bg-blue-500" :
            programType === "horizons" ? "bg-purple-500 text-white" :
            undefined
          }>
            {programType === "xperience" ? "Xperience" : 
             programType === "horizons" ? "Horizons" : 
             programType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <Progress value={progress} className="h-2" />
        
        {/* Active milestone */}
        <div className="p-3 border rounded-lg">
          <div className="flex items-center mb-1">
            {activeMilestone.status === "completed" ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : activeMilestone.status === "at_risk" ? (
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
            ) : (
              <Clock className="h-5 w-5 text-blue-500 mr-2" />
            )}
            <h3 className="font-medium">
              {activeMilestone.status === "completed" ? "Recently Completed:" : "Current Milestone:"}
            </h3>
          </div>
          <div className="ml-7">
            <p className="font-medium">{activeMilestone.name}</p>
            <p className="text-sm text-muted-foreground">
              {activeMilestone.status === "completed" && activeMilestone.completedDate
                ? `Completed on ${formatDate(activeMilestone.completedDate)}`
                : activeMilestone.dueDate
                ? `Due: ${formatDate(activeMilestone.dueDate)}`
                : activeMilestone.status === "in_progress"
                ? "In progress"
                : activeMilestone.status === "at_risk"
                ? "At risk"
                : "Not started"}
            </p>
          </div>
        </div>
        
        {/* Next milestone (if available) */}
        {nextMilestone && (
          <div className="p-3 border rounded-lg border-dashed">
            <div className="flex items-center mb-1">
              <ChevronRight className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="font-medium">Next Up:</h3>
            </div>
            <div className="ml-7">
              <p className="font-medium">{nextMilestone.name}</p>
              {nextMilestone.dueDate && (
                <p className="text-sm text-muted-foreground">Due: {formatDate(nextMilestone.dueDate)}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full" 
          asChild
        >
          <Link href={`/dashboard/programs/${programType}/${programId}/milestones`}>
            View All Milestones <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}