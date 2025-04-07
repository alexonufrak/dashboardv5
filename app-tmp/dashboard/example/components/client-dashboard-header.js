'use client'

/**
 * Client-side Dashboard Header Component
 * Handles user interactions like profile editing and navigation
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useUpdateContactViaApi } from '@/lib/airtable/hooks/useContact';

/**
 * Dashboard header component that displays user information
 * and provides navigation options
 */
export default function ClientSideDashboardHeader({ user }) {
  const router = useRouter();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Get profile update action hook
  const { execute: updateProfile, isExecuting: isUpdating } = useUpdateContactViaApi();

  // Handle navigation
  const handleNavigation = (path) => {
    router.push(path);
  };
  
  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user) return '?';
    
    const firstInitial = user.firstName ? user.firstName.charAt(0) : '';
    const lastInitial = user.lastName ? user.lastName.charAt(0) : '';
    
    return `${firstInitial}${lastInitial}`.toUpperCase() || '?';
  };
  
  // Handle profile editor
  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };
  
  // Handle logout
  const handleLogout = () => {
    router.push('/api/auth/logout');
  };
  
  return (
    <header className="dashboard-header flex justify-between items-center">
      <div className="left-section">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user.firstName || 'User'}</p>
      </div>
      
      <div className="right-section flex items-center space-x-4">
        <Button variant="outline" onClick={() => handleNavigation('/dashboard/programs')}>
          Browse Programs
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                <AvatarImage 
                  src={user.pictureUrl || user.picture} 
                  alt={`${user.firstName} ${user.lastName}`} 
                />
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => handleNavigation('/dashboard/profile')}>
              Profile
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleNavigation('/dashboard')}>
              Dashboard
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleNavigation('/dashboard/teams')}>
              My Teams
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleLogout}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Modal for profile editing would go here */}
    </header>
  );
}