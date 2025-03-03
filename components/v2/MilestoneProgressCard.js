"use client";

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "../ui/card";
import { Badge } from "../ui/badge";
import MilestoneTimeline from "../MilestoneTimeline";

/**
 * MilestoneProgressCard Component
 * Displays a user's progress through program milestones in a timeline format
 * Now using the MilestoneTimeline component to handle the timeline visualization
 */
export function MilestoneProgressCard({
  programName,
  programType = "xperience",
  programId,
  milestones = [],
  className = "",
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">
              {programName || "Program Milestones"}
            </CardTitle>
            <CardDescription>
              {/* Description is now provided by the MilestoneTimeline component */}
              &nbsp;
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
        {/* Use the new MilestoneTimeline component */}
        <MilestoneTimeline
          programName={programName}
          programType={programType}
          programId={programId}
          milestones={milestones}
          linkToDetail={false} // We'll use the card footer instead
        />
      </CardContent>
      {/* CardFooter is now handled by the MilestoneTimeline component */}
    </Card>
  );
}