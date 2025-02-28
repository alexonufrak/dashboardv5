// components/TeamCard.js
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";

const TeamCard = ({ team }) => {
  // If no team data is provided, show a not found message
  if (!team) {
    return (
      <Card className="mb-5">
        <CardContent className="py-6 text-center text-muted-foreground italic">
          You are not currently part of any team.
        </CardContent>
      </Card>
    );
  }
  
  // Get active members only
  const activeMembers = team.members ? team.members.filter(member => member.status === "Active") : [];
  
  return (
    <Card className="mb-5">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="team-details" className="border-0">
          <CardHeader className="pb-0 pt-5">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl text-primary mb-1">{team.name}</CardTitle>
                {team.points !== undefined && (
                  <p className="text-muted-foreground">
                    Team Points: <span className="font-bold text-foreground">{team.points || 0}</span>
                  </p>
                )}
              </div>
              <AccordionTrigger className="ml-2 mr-0" />
            </div>
          </CardHeader>
          
          <AccordionContent>
            <CardContent className="pt-4">
              <div className="mb-6">
                <h4 className="text-base font-semibold border-b pb-2 mb-2">Description</h4>
                <p className="text-sm">{team.description || "No description available."}</p>
              </div>
              
              <div>
                <h4 className="text-base font-semibold border-b pb-2 mb-3">
                  Team Members ({activeMembers.length})
                </h4>
                {activeMembers.length > 0 ? (
                  <ul className="space-y-2">
                    {activeMembers.map((member, index) => (
                      <li key={member.id || index} className="py-2 border-b border-muted flex justify-between items-center">
                        <div>
                          <span className="font-medium">
                            {member.name || member.email || "Unknown Member"}
                            {member.isCurrentUser && (
                              <Badge variant="secondary" className="ml-2 font-normal">You</Badge>
                            )}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="italic text-muted-foreground">No active team members found.</p>
                )}
              </div>
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default TeamCard;