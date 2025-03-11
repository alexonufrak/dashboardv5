"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, ExternalLink } from "lucide-react"

const getInitials = (name) => {
  if (!name) return "??"
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

const MemberListItem = ({ member, detailed = false }) => {
  return (
    <div className={`flex items-center justify-between p-3 ${detailed ? "border-b last:border-b-0" : "border-b"}`}>
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={member.avatar || ""} alt={member.name} />
          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium flex items-center">
            {member.name}
            {member.isCurrentUser && (
              <Badge variant="outline" className="ml-2 text-xs">You</Badge>
            )}
          </div>
          {detailed && (
            <div className="text-sm text-muted-foreground">{member.email || "No email provided"}</div>
          )}
        </div>
      </div>
      
      <div className="flex gap-2 items-center">
        <Badge 
          variant={
            member.status === "Active" ? "outline" : 
            member.status === "Pending" ? "secondary" : 
            "outline"
          }
          className={
            member.status === "Active" ? "border-green-200 text-green-700 bg-green-50" : 
            member.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200" : 
            "bg-gray-100 text-gray-700"
          }
        >
          {member.status}
        </Badge>
        
        {detailed && !member.isCurrentUser && (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Mail className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

export default function TeamMembers({ team, detailed = false, truncated = false }) {
  if (!team || !team.members || team.members.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No team members found.
      </div>
    )
  }
  
  // If truncated, only show first 5 members
  const members = truncated ? team.members.slice(0, 5) : team.members
  
  return (
    <div className={detailed ? "border rounded-md overflow-hidden" : ""}>
      {members.map(member => (
        <MemberListItem 
          key={member.id} 
          member={member} 
          detailed={detailed} 
        />
      ))}
      
      {/* Show 'View all members' if truncated and more members exist */}
      {truncated && team.members.length > 5 && (
        <div className="p-3 text-center border-t">
          <Button variant="link" className="h-auto p-0 text-xs" size="sm">
            <span>View all {team.members.length} members</span>
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}