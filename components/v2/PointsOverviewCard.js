"use client";

import { 
  Award, 
  TrendingUp, 
  Users, 
  BadgeCheck,
  ChevronRight,
  Briefcase,
  BookOpen,
  Lightbulb,
  Rocket
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import Link from "next/link";

/**
 * PointsOverviewCard Component
 * Displays a user's total points and progress across all programs
 */
export function PointsOverviewCard({
  totalPoints = 0,
  programPoints = [],
  showDetails = true,
  className = "",
}) {
  // Program type icons mapping
  const programIcons = {
    xperience: <Briefcase className="h-5 w-5 text-blue-500" />,
    xperiment: <BookOpen className="h-5 w-5 text-green-500" />,
    xtrapreneurs: <Lightbulb className="h-5 w-5 text-amber-500" />,
    horizons: <Rocket className="h-5 w-5 text-purple-500" />,
  };

  // Calculate the percentage each program contributes to total points
  const calculatePercentage = (points) => {
    if (totalPoints === 0) return 0;
    return Math.round((points / totalPoints) * 100);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center">
              <Award className="mr-2 h-5 w-5 text-primary" /> 
              Points & Progress
            </CardTitle>
            <CardDescription>
              Your earned points across all programs
            </CardDescription>
          </div>
          <div className="text-3xl font-bold">{totalPoints}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Program Points Breakdown */}
        {programPoints && programPoints.length > 0 ? (
          <div className="space-y-3">
            {programPoints.map((program, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {programIcons[program.type] || <Award className="h-5 w-5" />}
                    <span className="font-medium">{program.name}</span>
                    {program.teamContribution && (
                      <Badge variant="outline" className="ml-1 text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        Team: {program.teamContribution.team}
                      </Badge>
                    )}
                  </div>
                  <div className="font-semibold">{program.points}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={calculatePercentage(program.points)} 
                    className="h-2" 
                    indicatorClassName={
                      program.type === "xperience" ? "bg-blue-500" :
                      program.type === "xperiment" ? "bg-green-500" :
                      program.type === "xtrapreneurs" ? "bg-amber-500" :
                      program.type === "horizons" ? "bg-purple-500" :
                      undefined
                    }
                  />
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {calculatePercentage(program.points)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-muted-foreground">
            You haven't earned any points yet. Join programs to start earning!
          </div>
        )}
      </CardContent>
      {showDetails && (
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/dashboard/points">
              View Detailed Breakdown <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}