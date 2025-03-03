"use client";

import Link from "next/link";
import { cn } from "../../lib/utils";
import {
  Calendar,
  Users,
  Clock,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Briefcase,
  BookOpen,
  Lightbulb,
  Rocket,
  ArrowRight,
  MapPin
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

/**
 * ProgramCard Component
 * A reusable card component for displaying program information
 * Supports different program types, status indicators, and progress visualizations
 */
export function ProgramCard({
  type = "xperience",
  name,
  term,
  status = { state: "active" },
  team,
  points,
  schedule,
  compatibility,
  nextDeadline,
  location,
  instructors,
  actions = ["viewDetails"],
  className,
  onClick,
}) {
  // Program type configuration
  const programTypes = {
    xperience: {
      label: "Xperience",
      icon: <Briefcase className="h-4 w-4" />,
      color: "bg-blue-500 text-white",
      baseUrl: "/dashboard/programs/xperience",
    },
    xperiment: {
      label: "Xperiment",
      icon: <BookOpen className="h-4 w-4" />,
      color: "bg-green-500 text-white",
      baseUrl: "/dashboard/programs/xperiment",
    },
    xtrapreneurs: {
      label: "Xtrapreneurs",
      icon: <Lightbulb className="h-4 w-4" />,
      color: "bg-amber-500 text-white",
      baseUrl: "/dashboard/programs/xtrapreneurs",
    },
    horizons: {
      label: "Horizons",
      icon: <Rocket className="h-4 w-4" />,
      color: "bg-purple-500 text-white",
      baseUrl: "/dashboard/programs/horizons",
    },
  };

  const programInfo = programTypes[type] || {
    label: type,
    icon: <Briefcase className="h-4 w-4" />,
    color: "bg-gray-500 text-white",
    baseUrl: "/dashboard/programs",
  };

  // Status configuration
  const statusConfig = {
    active: {
      label: "Active",
      variant: "default",
      icon: <CheckCircle className="h-4 w-4" />,
    },
    completed: {
      label: "Completed",
      variant: "outline",
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    },
    applications_open: {
      label: "Applications Open",
      variant: "outline",
      icon: <Calendar className="h-4 w-4 text-blue-500" />,
    },
    applications_closed: {
      label: "Applications Closed",
      variant: "outline",
      icon: <XCircle className="h-4 w-4 text-muted-foreground" />,
    },
    upcoming: {
      label: "Upcoming",
      variant: "outline",
      icon: <Clock className="h-4 w-4 text-blue-500" />,
    },
    waitlisted: {
      label: "Waitlisted",
      variant: "outline",
      icon: <AlertCircle className="h-4 w-4 text-amber-500" />,
    },
    application_pending: {
      label: "Application Pending",
      variant: "secondary",
      icon: <Clock className="h-4 w-4" />,
    },
  };

  // Render progress indicators based on program status and type
  const renderProgress = () => {
    // Skip progress for non-active programs
    if (status.state !== "active") return null;

    // Render different progress types
    if (status.progressType === "milestone" && status.current !== undefined && status.total !== undefined) {
      return (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span>
              Milestone {status.current} of {status.total}
            </span>
            <span>{Math.round((status.current / status.total) * 100)}%</span>
          </div>
          <Progress value={(status.current / status.total) * 100} className="h-1.5" />
        </div>
      );
    }

    if (status.progressType === "week" && status.current !== undefined && status.total !== undefined) {
      return (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span>
              Week {status.current} of {status.total}
            </span>
            <span>{Math.round((status.current / status.total) * 100)}%</span>
          </div>
          <Progress value={(status.current / status.total) * 100} className="h-1.5" />
        </div>
      );
    }

    if (status.progressType === "custom" && status.percent !== undefined) {
      return (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span>{status.label || "Progress"}</span>
            <span>{status.percent}%</span>
          </div>
          <Progress value={status.percent} className="h-1.5" />
        </div>
      );
    }

    // Default: just show status badge
    return (
      <Badge variant={statusConfig[status.state]?.variant || "outline"}>
        {statusConfig[status.state]?.icon}
        <span className="ml-1">{statusConfig[status.state]?.label || status.state}</span>
      </Badge>
    );
  };

  // Render deadline information if available
  const renderDeadline = () => {
    if (!nextDeadline) return null;

    // Determine text color based on days remaining
    const textColor = nextDeadline.daysRemaining <= 2
      ? "text-red-600" 
      : nextDeadline.daysRemaining <= 5
        ? "text-amber-600"
        : "text-muted-foreground";

    return (
      <div className="flex items-center gap-1 mt-1">
        <Clock className={`h-3.5 w-3.5 ${textColor}`} />
        <span className={textColor}>
          {nextDeadline.name} due in {nextDeadline.daysRemaining} days
        </span>
      </div>
    );
  };

  // Render team information if available
  const renderTeamInfo = () => {
    if (!team) return null;

    return (
      <div className="flex items-center gap-1 mt-1">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <span>Team: {team.name}</span>
        {team.ranking && (
          <Badge variant="outline" className="ml-1 text-xs">
            #{team.ranking} of {team.totalTeams}
          </Badge>
        )}
      </div>
    );
  };

  // Render location information if available
  const renderLocation = () => {
    if (!location) return null;

    return (
      <div className="flex items-center gap-1 mt-1">
        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{location}</span>
      </div>
    );
  };

  // Render points information if available
  const renderPoints = () => {
    if (!points) return null;

    return (
      <div className="flex items-center gap-1 mt-1">
        <Award className="h-3.5 w-3.5 text-muted-foreground" />
        <span>
          {points.personal} points earned
          {points.contribution && ` • Contributes to ${points.contribution}`}
        </span>
      </div>
    );
  };

  // Render schedule information if available
  const renderSchedule = () => {
    if (!schedule) return null;

    const scheduleText = schedule.days
      ? `${schedule.days.join(" & ")} • ${schedule.time}`
      : schedule.time;

    return (
      <div className="flex items-center gap-1 mt-1">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{scheduleText}</span>
      </div>
    );
  };

  // Render compatibility information for program opportunities
  const renderCompatibility = () => {
    if (!compatibility) return null;

    return (
      <div className="flex items-center gap-1 mt-2 text-xs">
        {compatibility.compatible ? (
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Compatible
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            {compatibility.message || "Conflict"}
          </Badge>
        )}
        {compatibility.message && <span className="text-muted-foreground">{compatibility.message}</span>}
      </div>
    );
  };

  // Define card actions with links
  const getActionButtons = () => {
    const actionButtons = {
      viewDetails: (
        <Button 
          key="viewDetails" 
          variant="default" 
          size="sm" 
          className="flex-1"
          asChild
        >
          <Link href={`${programInfo.baseUrl}/${encodeURIComponent(name)}`}>
            View Details
          </Link>
        </Button>
      ),
      viewTeam: team && (
        <Button 
          key="viewTeam" 
          variant="outline" 
          size="sm" 
          className="flex-1"
          asChild
        >
          <Link href={`/dashboard/teams/${team.id}`}>
            Team Info
          </Link>
        </Button>
      ),
      apply: status?.state === "applications_open" && (
        <Button 
          key="apply" 
          variant="default" 
          size="sm" 
          className="flex-1"
          asChild
        >
          <Link href={`${programInfo.baseUrl}/${encodeURIComponent(name)}/apply`}>
            Apply Now
          </Link>
        </Button>
      ),
      viewSyllabus: type === "xperiment" && (
        <Button 
          key="viewSyllabus" 
          variant="outline" 
          size="sm" 
          className="flex-1"
          asChild
        >
          <Link href={`${programInfo.baseUrl}/${encodeURIComponent(name)}/syllabus`}>
            View Syllabus
          </Link>
        </Button>
      ),
      viewAssignments: type === "xperiment" && (
        <Button 
          key="viewAssignments" 
          variant="outline" 
          size="sm" 
          className="flex-1"
          asChild
        >
          <Link href={`${programInfo.baseUrl}/${encodeURIComponent(name)}/assignments`}>
            Assignments
          </Link>
        </Button>
      ),
      leaveProgram: (
        <Button 
          key="leaveProgram" 
          variant="outline" 
          size="sm" 
          className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50"
          asChild
        >
          <Link href={`${programInfo.baseUrl}/${encodeURIComponent(name)}/leave`}>
            Leave Program
          </Link>
        </Button>
      ),
      leaveClass: type === "xperiment" && (
        <Button 
          key="leaveClass" 
          variant="outline" 
          size="sm" 
          className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50"
          asChild
        >
          <Link href={`${programInfo.baseUrl}/${encodeURIComponent(name)}/leave`}>
            Leave Class
          </Link>
        </Button>
      ),
    };

    return actions
      .map(action => actionButtons[action])
      .filter(Boolean);
  };

  // Handle card click if provided
  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Card 
      className={cn("overflow-hidden", className, onClick && "hover:border-primary cursor-pointer")} 
      onClick={handleClick}
    >
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base line-clamp-1">{name}</CardTitle>
          <CardDescription className="line-clamp-1">{term}</CardDescription>
        </div>
        <Badge className={programInfo.color}>
          {programInfo.icon}
          <span className="ml-1 whitespace-nowrap">{programInfo.label}</span>
        </Badge>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 pb-0 min-h-[100px]">
        {renderProgress()}
        
        <div className="mt-3 text-sm space-y-1">
          {renderTeamInfo()}
          {renderSchedule()}
          {renderLocation()}
          {renderDeadline()}
          {renderPoints()}
          {renderCompatibility()}

          {/* Instructors list if available */}
          {instructors && instructors.length > 0 && (
            <div className="flex items-start gap-1 mt-2">
              <span className="text-muted-foreground mr-1 mt-0.5">Instructor:</span>
              <div className="flex flex-wrap gap-1">
                {instructors.map((instructor, index) => (
                  <span key={index} className="text-sm">
                    {instructor.name || instructor}
                    {index < instructors.length - 1 && ", "}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 flex gap-2">
        {getActionButtons()}
      </CardFooter>
    </Card>
  );
}