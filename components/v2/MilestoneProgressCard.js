"use client";

import { 
  CheckCircle, 
  Circle, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Calendar,
  Star,
  BarChart
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import Link from "next/link";
import { format, isValid, parseISO } from "date-fns";

/**
 * MilestoneProgressCard Component
 * Displays a user's progress through program milestones
 */
export function MilestoneProgressCard({
  programName,
  programType = "xperience",
  programId,
  milestones = [],
  className = "",
}) {
  // Status icons and styling
  const statusConfig = {
    completed: { 
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      lineClass: "bg-green-500",
      nodeClass: "border-green-500 bg-green-100",
      textClass: "text-green-700"
    },
    in_progress: { 
      icon: <Clock className="h-5 w-5 text-blue-500" />,
      lineClass: "bg-blue-500",
      nodeClass: "border-blue-500 bg-blue-100",
      textClass: "text-blue-700"
    },
    not_started: { 
      icon: <Circle className="h-5 w-5 text-gray-300" />,
      lineClass: "bg-gray-200",
      nodeClass: "border-gray-300 bg-gray-50",
      textClass: "text-gray-500"
    },
    at_risk: { 
      icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
      lineClass: "bg-amber-500",
      nodeClass: "border-amber-500 bg-amber-100",
      textClass: "text-amber-700"
    },
    late: { 
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      lineClass: "bg-red-500",
      nodeClass: "border-red-500 bg-red-100",
      textClass: "text-red-700"
    }
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

  // Calculate the number of days remaining
  const getDaysRemaining = (dateString) => {
    if (!dateString) return null;
    
    try {
      const dueDate = parseISO(dateString);
      if (!isValid(dueDate)) return null;
      
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch (e) {
      return null;
    }
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!milestones || milestones.length === 0) return 0;
    
    const completed = milestones.filter(m => m.status === "completed").length;
    return Math.round((completed / milestones.length) * 100);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">
              {programName || "Program Milestones"}
            </CardTitle>
            <CardDescription>
              {`${calculateProgress()}% Complete`} • {milestones.filter(m => m.status === "completed").length} of {milestones.length} milestones
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
      <CardContent>
        <div className="relative space-y-0">
          {milestones.map((milestone, index) => {
            const status = milestone.status || "not_started";
            const config = statusConfig[status];
            const isLast = index === milestones.length - 1;
            const daysRemaining = getDaysRemaining(milestone.dueDate);
            
            return (
              <div key={index} className="relative pl-10 pb-8">
                {/* Connecting line */}
                {!isLast && (
                  <div className={`absolute left-4 top-5 bottom-0 w-0.5 ${config.lineClass}`} />
                )}
                
                {/* Milestone node */}
                <div className={`absolute left-[10px] top-1 w-7 h-7 rounded-full border-2 ${config.nodeClass} flex items-center justify-center -translate-x-1/2`}>
                  {config.icon}
                </div>
                
                {/* Milestone content */}
                <div className="space-y-1.5">
                  <div className="flex items-center">
                    <h3 className={`font-medium ${config.textClass}`}>
                      {milestone.name}
                    </h3>
                  </div>
                  
                  <div className="flex flex-col text-sm space-y-1">
                    {/* Due date */}
                    {milestone.dueDate && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Due: {formatDate(milestone.dueDate)}</span>
                        {status !== "completed" && daysRemaining !== null && (
                          <Badge variant="outline" className={
                            daysRemaining < 0 ? "bg-red-50 text-red-700 border-red-200" :
                            daysRemaining <= 3 ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-gray-50 text-gray-700 border-gray-200"
                          }>
                            {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` :
                             daysRemaining === 0 ? "Due today" :
                             `${daysRemaining} days remaining`}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {/* Completion date */}
                    {status === "completed" && milestone.completedDate && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Completed: {formatDate(milestone.completedDate)}</span>
                      </div>
                    )}
                    
                    {/* Score */}
                    {milestone.score !== undefined && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Star className="h-3.5 w-3.5" />
                        <span>Score: {milestone.score}/100</span>
                      </div>
                    )}
                    
                    {/* Progress */}
                    {status === "in_progress" && milestone.progress !== undefined && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <BarChart className="h-3.5 w-3.5" />
                        <span>Progress: {milestone.progress}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full" 
          asChild
        >
          <Link href={`/dashboard/programs/${programType}/${programId}/milestones`}>
            View Milestone Details <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}