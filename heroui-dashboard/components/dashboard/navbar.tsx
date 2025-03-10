import React from "react";
import { Button } from "@heroui/button";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Avatar } from "@heroui/react";
import { Link } from "@heroui/link";
import { ThemeSwitch } from "@/components/theme-switch";

// Import icons we'll create
import { 
  MenuIcon, 
  BellIcon, 
  UserIcon
} from "@/components/dashboard/icons";

export function DashboardNavbar({ 
  onSidebarToggle,
  profile 
}: { 
  onSidebarToggle: () => void;
  profile: any;
}) {
  return (
    <header className="border-b border-divider bg-background z-10">
      <div className="px-4 h-16 flex items-center justify-between">
        {/* Left side with menu and breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={onSidebarToggle}
            className="md:hidden"
            aria-label="Toggle sidebar"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
          
          {/* Breadcrumbs can go here */}
          <div className="hidden md:flex"></div>
        </div>
        
        {/* Right side with user menu */}
        <div className="flex items-center gap-3">
          <ThemeSwitch />
          
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                isIconOnly
                variant="light"
                size="sm"
                className="rounded-full"
                aria-label="Notifications"
              >
                <BellIcon className="h-5 w-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Notifications" className="w-72">
              <DropdownItem key="notifications" className="text-center p-4">
                <div className="text-sm font-medium">No new notifications</div>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
          
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                variant="light"
                className="px-2 min-w-0 h-9 rounded-full"
                aria-label="User menu"
              >
                <div className="flex items-center gap-2">
                  <Avatar
                    className="w-7 h-7"
                    src={profile?.headshot || "/placeholder-user.jpg"}
                    alt={profile ? `${profile.firstName} ${profile.lastName}` : "User"}
                  />
                  <span className="hidden sm:inline text-sm font-medium">
                    {profile ? `${profile.firstName} ${profile.lastName}` : "User"}
                  </span>
                </div>
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu">
              <DropdownItem key="profile" startContent={<UserIcon className="h-4 w-4" />}>
                <Link
                  className="w-full"
                  href="/profile"
                  color="foreground"
                >
                  My Profile
                </Link>
              </DropdownItem>
              <DropdownItem key="settings">
                Account Settings
              </DropdownItem>
              <DropdownItem key="help">
                Help & Feedback
              </DropdownItem>
              <DropdownItem key="logout" color="danger" className="text-danger">
                <Link
                  className="w-full text-danger"
                  href="/api/auth/logout"
                >
                  Sign Out
                </Link>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}