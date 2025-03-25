"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/router"
import { useQueryClient } from "@tanstack/react-query"
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
import { toast } from "sonner"

const getInitials = (name) => {
  if (!name) return "??"
  
  // Split the name by spaces
  const parts = name.split(" ")
  
  if (parts.length === 1) {
    // If only one part (first name only), return first two letters
    return parts[0].substring(0, 2).toUpperCase()
  } else {
    // Get first letter of first name and first letter of last name
    const firstInitial = parts[0][0]
    const lastInitial = parts[parts.length - 1][0]
    return (firstInitial + lastInitial).toUpperCase()
  }
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

const MemberActions = ({ member, onRemoveMember, onRescindInvite }) => {
  const handleRemove = () => {
    if (member.status === 'Invited' && onRescindInvite) {
      onRescindInvite(member.id)
    } else if (onRemoveMember) {
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
          {member.status === 'Invited' ? 'Rescind Invite' : 'Remove Member'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const MembersTable = ({ members, onRemoveMember, onRescindInvite, isInactiveTable = false }) => {
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
                    <AvatarImage src={member.image || member.avatar || ""} alt={member.name} />
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
                    onRescindInvite={onRescindInvite}
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

export default function TeamMemberList({ team, detailed = false, truncated = false, onTeamUpdated }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  
  // Track active/inactive members state
  const [memberStates, setMemberStates] = useState(() => {
    return team?.members?.reduce((acc, member) => {
      // Consider both actual status and our local active state
      acc[member.id] = { 
        ...member, 
        isActive: member.status !== 'Inactive' 
      }
      return acc
    }, {}) || {}
  })
  
  // Track if inactive members are visible
  const [showInactive, setShowInactive] = useState(false)
  
  // Use a flag to track if the component is mounted
  const [isMounted, setIsMounted] = useState(false)
  
  // Update member states when team data changes
  useEffect(() => {
    if (isMounted && team?.members) {
      setMemberStates(prev => {
        // Build a new state object preserving our local isActive flag where possible
        const newState = {}
        team.members.forEach(member => {
          // If we have previous state for this member, use it
          if (prev[member.id]) {
            newState[member.id] = {
              ...member,
              isActive: member.status !== 'Inactive' && prev[member.id].isActive
            }
          } else {
            // Otherwise use status to determine active state
            newState[member.id] = {
              ...member,
              isActive: member.status !== 'Inactive'
            }
          }
        })
        return newState
      })
    } else {
      setIsMounted(true)
    }
  }, [team, isMounted])
  
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
  const handleRemoveMember = useCallback(async (memberId) => {
    try {
      const member = memberStates[memberId]
      if (!member || isLoading) return

      setIsLoading(true)
      
      // Call API to update member status to Inactive
      const response = await fetch(`/api/teams/${team.id}/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove team member')
      }
      
      const data = await response.json()
      
      // Update local state
      setMemberStates(prev => ({
        ...prev,
        [memberId]: { ...prev[memberId], isActive: false, status: 'Inactive' }
      }))
      
      // If callback provided for team updates, call it
      if (typeof onTeamUpdated === 'function' && data.team) {
        onTeamUpdated(data.team)
      } else {
        // Invalidate teams cache to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['teams'] })
      }
      
      toast.success('Team member removed successfully')
    } catch (error) {
      console.error('Error removing team member:', error)
      toast.error(error.message || 'Failed to remove team member')
    } finally {
      setIsLoading(false)
    }
  }, [memberStates, team?.id, queryClient, onTeamUpdated, isLoading])
  
  // Handle rescinding invites (delete the record)
  const handleRescindInvite = useCallback(async (memberId) => {
    try {
      const member = memberStates[memberId]
      if (!member || isLoading) return
      
      setIsLoading(true)
      
      // Call API to delete the member record
      const response = await fetch(`/api/teams/${team.id}/members/${memberId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to rescind invitation')
      }
      
      const data = await response.json()
      
      // Remove from local state
      setMemberStates(prev => {
        const newState = { ...prev }
        delete newState[memberId]
        return newState
      })
      
      // If callback provided for team updates, call it
      if (typeof onTeamUpdated === 'function' && data.team) {
        onTeamUpdated(data.team)
      } else {
        // Invalidate teams cache to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['teams'] })
      }
      
      toast.success('Invitation rescinded successfully')
    } catch (error) {
      console.error('Error rescinding invitation:', error)
      toast.error(error.message || 'Failed to rescind invitation')
    } finally {
      setIsLoading(false)
    }
  }, [memberStates, team?.id, queryClient, onTeamUpdated, isLoading])
  
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
          onRescindInvite={handleRescindInvite}
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
                onRescindInvite={null}
                isInactiveTable={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}