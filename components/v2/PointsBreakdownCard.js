"use client";

import { useState } from "react";
import { 
  Award, 
  Calendar, 
  Users, 
  Tag,
  Briefcase,
  BookOpen,
  Lightbulb,
  Rocket,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";

/**
 * PointsBreakdownCard Component
 * Displays detailed breakdown of points by source
 */
export function PointsBreakdownCard({ 
  programPoints = [],
  className = ""
}) {
  // State for collapsible sections
  const [openSections, setOpenSections] = useState({});

  // Toggle section open/closed
  const toggleSection = (programId) => {
    setOpenSections(prev => ({
      ...prev,
      [programId]: !prev[programId]
    }));
  };

  // Program type icons and styles mapping
  const programConfig = {
    xperience: {
      icon: <Briefcase className="h-5 w-5 text-blue-500" />,
      headerClass: "bg-blue-50 border-blue-200",
      textClass: "text-blue-800",
    },
    xperiment: {
      icon: <BookOpen className="h-5 w-5 text-green-500" />,
      headerClass: "bg-green-50 border-green-200",
      textClass: "text-green-800",
    },
    xtrapreneurs: {
      icon: <Lightbulb className="h-5 w-5 text-amber-500" />,
      headerClass: "bg-amber-50 border-amber-200",
      textClass: "text-amber-800",
    },
    horizons: {
      icon: <Rocket className="h-5 w-5 text-purple-500" />,
      headerClass: "bg-purple-50 border-purple-200",
      textClass: "text-purple-800",
    },
  };

  // Format date string
  const formatDate = (dateString) => {
    if (dateString === "ongoing" || dateString === "various") return dateString;
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center">
          <Award className="mr-2 h-5 w-5 text-primary" />
          Points Breakdown
        </CardTitle>
        <CardDescription>
          Detailed view of your points by program and source
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[550px] pr-4">
          <div className="space-y-4">
            {programPoints.length > 0 ? (
              programPoints.map((program, index) => {
                const config = programConfig[program.type] || {
                  icon: <Award className="h-5 w-5" />,
                  headerClass: "bg-gray-100 border-gray-200",
                  textClass: "text-gray-800",
                };
                
                return (
                  <Collapsible 
                    key={`program-${index}`}
                    open={openSections[`program-${index}`]}
                    onOpenChange={() => toggleSection(`program-${index}`)}
                    className="border rounded-lg overflow-hidden"
                  >
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className={`w-full flex justify-between items-center p-4 ${config.headerClass} hover:bg-opacity-90 rounded-none`}
                      >
                        <div className="flex items-center gap-2">
                          {config.icon}
                          <span className={`font-medium ${config.textClass}`}>
                            {program.program}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-bold ${config.textClass}`}>
                            {program.points} points
                          </span>
                          {openSections[`program-${index}`] ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />
                          }
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 space-y-3">
                        {program.teamContribution && (
                          <div className="flex items-center justify-between text-sm bg-accent/50 p-2 rounded-md">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>Team Contribution</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{program.teamContribution.team}</span>
                              <span className="text-muted-foreground">
                                (Total: {program.teamContribution.totalTeamPoints} pts)
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          {program.sources && program.sources.map((source, idx) => (
                            <div 
                              key={`source-${index}-${idx}`} 
                              className="flex justify-between items-center border-b pb-2 last:border-b-0 last:pb-0"
                            >
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {source.name}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(source.date)}
                                </div>
                              </div>
                              <Badge variant="outline">
                                +{source.points} pts
                              </Badge>
                            </div>
                          ))}
                          
                          {(!program.sources || program.sources.length === 0) && (
                            <div className="text-center text-muted-foreground py-2">
                              No detailed breakdown available
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })
            ) : (
              <div className="text-center text-muted-foreground py-6">
                No points data available
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}