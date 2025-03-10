import { useState, useEffect } from "react";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import DashboardLayout from "@/layouts/dashboard";
import { Card, CardHeader, CardBody, CardFooter, Input, Textarea, Tabs, Tab, Avatar } from "@heroui/react";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { useDashboard } from "@/contexts/DashboardContext";
import { UserIcon } from "@/components/dashboard/icons";

export default function ProfilePage() {
  const {
    profile,
    isLoading,
    error,
    handleProfileUpdate,
    isUpdating
  } = useDashboard();
  
  const [selected, setSelected] = useState("info");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    institutionName: "",
    bio: ""
  });
  
  // Update form data when profile is loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        institutionName: profile.institutionName || profile.institution?.name || "",
        bio: profile.bio || ""
      });
    }
  }, [profile]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Update profile data
      await handleProfileUpdate(formData);
      
      // Show success notification (would implement in a real app)
      console.log("Profile updated successfully");
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };
  
  return (
    <DashboardLayout
      title="Profile | xFoundry Hub"
      profile={profile}
      isLoading={isLoading}
      error={error}
      loadingMessage="Loading profile..."
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-default-500">
              <Link href="/dashboard" className="hover:text-default-700">
                Dashboard
              </Link>
              <span>/</span>
              <span>Profile</span>
            </div>
            <h1 className="text-2xl font-bold mt-1">Your Profile</h1>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardBody className="flex flex-col items-center p-6">
                <div className="relative group mb-4">
                  <Avatar 
                    src={profile?.headshot || "/placeholder-user.jpg"} 
                    className="w-24 h-24"
                    name={profile ? `${profile.firstName} ${profile.lastName}` : "User"}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full transition-opacity">
                    <Button 
                      size="sm" 
                      variant="flat" 
                      className="text-white bg-black/30"
                    >
                      Change
                    </Button>
                  </div>
                </div>
                
                <h2 className="text-xl font-bold">
                  {profile ? `${profile.firstName} ${profile.lastName}` : "User"}
                </h2>
                <p className="text-default-500 text-sm">
                  {profile?.email || "email@example.com"}
                </p>
                
                <div className="border-t border-divider w-full my-4 pt-4">
                  <p className="text-sm text-default-700 font-medium">
                    Institution
                  </p>
                  <p className="text-sm text-default-500">
                    {profile?.institutionName || profile?.institution?.name || "Not specified"}
                  </p>
                </div>
                
                <Button 
                  as={Link} 
                  href="/api/auth/logout" 
                  color="danger" 
                  variant="flat" 
                  fullWidth
                  className="mt-2"
                >
                  Sign Out
                </Button>
              </CardBody>
            </Card>
            
            <Card>
              <CardHeader>
                <h3 className="text-md font-bold">Account Settings</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  <Button 
                    as={Link} 
                    href="/settings/security" 
                    variant="light" 
                    color="default" 
                    fullWidth 
                    className="justify-start"
                  >
                    Security Settings
                  </Button>
                  <Button 
                    as={Link} 
                    href="/settings/notifications" 
                    variant="light" 
                    color="default" 
                    fullWidth 
                    className="justify-start"
                  >
                    Notification Preferences
                  </Button>
                  <Button 
                    as={Link} 
                    href="/settings/privacy" 
                    variant="light" 
                    color="default" 
                    fullWidth 
                    className="justify-start"
                  >
                    Privacy Settings
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
          
          {/* Profile Content */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Tabs 
                  aria-label="Profile tabs" 
                  selectedKey={selected} 
                  onSelectionChange={setSelected as any}
                >
                  <Tab key="info" title="Personal Information" />
                  <Tab key="activity" title="Activity" />
                  <Tab key="teams" title="Teams" />
                </Tabs>
              </CardHeader>
              
              <CardBody>
                {selected === "info" && (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">First Name</label>
                        <Input
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="Your first name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Last Name</label>
                        <Input
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Your last name"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <Input
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                        type="email"
                        isReadOnly
                        description="Email address cannot be changed. Contact support for assistance."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Institution</label>
                      <Input
                        name="institutionName"
                        value={formData.institutionName}
                        onChange={handleInputChange}
                        placeholder="Your university or organization"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Bio</label>
                      <Textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself"
                        rows={4}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        color="primary" 
                        isLoading={isUpdating}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </form>
                )}
                
                {selected === "activity" && (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center justify-center py-12 bg-default-50 rounded-lg">
                      <UserIcon className="w-12 h-12 text-default-300 mb-3" />
                      <p className="text-default-500">No recent activity to display</p>
                    </div>
                  </div>
                )}
                
                {selected === "teams" && (
                  <div className="space-y-4">
                    {profile?.hasActiveTeamParticipation ? (
                      <div>
                        {/* Team list would go here */}
                        <p className="text-default-500">Team information will be displayed here.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 bg-default-50 rounded-lg">
                        <UserIcon className="w-12 h-12 text-default-300 mb-3" />
                        <p className="text-default-500">You are not a member of any teams</p>
                        <Button 
                          color="primary" 
                          className="mt-4"
                          as={Link}
                          href="/create-team"
                        >
                          Create a Team
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export const getServerSideProps = withPageAuthRequired();