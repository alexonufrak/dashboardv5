"use client"

import { useState, useCallback, useMemo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { MoreHorizontal, UserMinus } from "lucide-react"

const getInitials = (name) => {
  if (!name) return "??"
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

const MemberStatusBadge = ({ status }) => {
  const variants = {
    Active: "border-green-200 text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/50",
    Pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50",
    default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  }

  return (
    <Badge 
      variant="outline"
      className={variants[status] || variants.default}
    >
      {status}
    </Badge>
  )
}

const MemberActions = ({ member, onRemoveMember }) => {
  const handleRemove = () => {
    if (onRemoveMember) {
      onRemoveMember(member.id)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleRemove} className="text-red-600 dark:text-red-400">
          <UserMinus className="h-4 w-4 mr-2" />
          Remove Member
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const MembersTable = ({ members, onRemoveMember, isInactiveTable = false }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[70px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
              No {isInactiveTable ? "inactive" : ""} members found.
            </TableCell>
          </TableRow>
        ) : (
          members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar || ""} alt={member.name} />
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div className="font-medium flex items-center">
                    {member.name}
                    {member.isCurrentUser && (
                      <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {member.email || "No email provided"}
              </TableCell>
              <TableCell>
                <MemberStatusBadge status={member.status} />
              </TableCell>
              <TableCell>
                {!member.isCurrentUser && (
                  <MemberActions 
                    member={member} 
                    onRemoveMember={onRemoveMember} 
                  />
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

export default function TeamMemberList({ team, detailed = false, truncated = false }) {
  // Track active/inactive members state
  const [memberStates, setMemberStates] = useState(() => {
    return team?.members?.reduce((acc, member) => {
      acc[member.id] = { ...member, isActive: true }
      return acc
    }, {}) || {}
  })
  
  // Track if inactive members are visible
  const [showInactive, setShowInactive] = useState(false)
  
  // Separate active and inactive members
  const { activeMembers, inactiveMembers } = useMemo(() => {
    const active = []
    const inactive = []
    
    if (memberStates) {
      Object.values(memberStates).forEach(member => {
        if (member.isActive) {
          active.push(member)
        } else {
          inactive.push(member)
        }
      })
    }
    
    return { 
      activeMembers: truncated ? active.slice(0, 5) : active, 
      inactiveMembers: inactive 
    }
  }, [memberStates, truncated])
  
  // Handle member removal (mark as inactive)
  const handleRemoveMember = useCallback((memberId) => {
    setMemberStates(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], isActive: false }
    }))
  }, [])
  
  // Toggle showing inactive members
  const toggleInactiveMembers = useCallback(() => {
    setShowInactive(prev => !prev)
  }, [])
  
  if (!team || !team.members || team.members.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground dark:text-neutral-400">
        No team members found.
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="border dark:border-neutral-800 rounded-md overflow-hidden">
        <MembersTable 
          members={activeMembers} 
          onRemoveMember={handleRemoveMember} 
        />
      </div>
      
      {/* Show 'View all members' if truncated and more members exist */}
      {truncated && team.members.length > 5 && (
        <div className="p-3 text-center border-t dark:border-neutral-800">
          <Button variant="link" className="h-auto p-0 text-xs" size="sm">
            <span>View all {team.members.length} members</span>
          </Button>
        </div>
      )}
      
      {/* Inactive members toggle */}
      {inactiveMembers.length > 0 && (
        <div className="mt-6">
          <Button 
            variant="outline" 
            onClick={toggleInactiveMembers}
            className="w-full justify-between border-dashed dark:border-neutral-700"
          >
            <span>{inactiveMembers.length} inactive {inactiveMembers.length === 1 ? 'member' : 'members'}</span>
            <span className="text-xs">{showInactive ? 'Hide' : 'Show'}</span>
          </Button>
          
          {showInactive && (
            <div className="mt-4 border dark:border-neutral-800 rounded-md overflow-hidden">
              <MembersTable 
                members={inactiveMembers} 
                onRemoveMember={null} 
                isInactiveTable={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}