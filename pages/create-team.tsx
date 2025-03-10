import { useState } from "react";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { Card, CardHeader, CardBody, CardFooter, Input, Textarea, Divider, Chip } from "@heroui/react";


import { useRouter } from "next/router";
import DashboardLayout from "@/layouts/dashboard";
import { useDashboard } from "@/contexts/DashboardContext";
import { TeamIcon } from "@/components/dashboard/icons";
import { Button, Link } from "@heroui/react";

export default function CreateTeamPage() {
  const router = useRouter();
  const { profile, isLoading, error, getAllProgramInitiatives } = useDashboard();
  
  // Get program initiatives for selection
  const initiatives = profile ? getAllProgramInitiatives().filter(i => i.isTeamBased) : [];
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    programId: "",
    members: [] as { email: string; role: string }[]
  });
  
  // Member invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Member");
  const [isCreating, setIsCreating] = useState(false);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle adding a new member
  const handleAddMember = () => {
    if (!inviteEmail) return;
    
    setFormData(prev => ({
      ...prev,
      members: [...prev.members, { email: inviteEmail, role: inviteRole }]
    }));
    
    setInviteEmail("");
    setInviteRole("Member");
  };
  
  // Handle removing a member
  const handleRemoveMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index)
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      // In a real implementation, this would call an API endpoint to create the team
      console.log("Creating team:", formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to dashboard after team creation
      router.push("/dashboard");
    } catch (err) {
      console.error("Error creating team:", err);
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <DashboardLayout
      title="Create Team | xFoundry Hub"
      profile={profile}
      isLoading={isLoading}
      error={error}
      loadingMessage="Loading..."
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-default-500">
              <Link href="/dashboard" className="hover:text-default-700">
                Dashboard
              </Link>
              <span>/</span>
              <span>Create Team</span>
            </div>
            <h1 className="text-2xl font-bold mt-1">Create a New Team</h1>
          </div>
        </div>
        
        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Team Information */}
              <div>
                <h2 className="text-lg font-bold mb-4">Team Information</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Team Name</label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your team's name"
                      isRequired
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your team's purpose and goals"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Program</label>
                    <select
                      name="programId"
                      value={formData.programId}
                      onChange={handleInputChange as any}
                      className="w-full p-2 border rounded-md"
                      required
                    >
                      <option value="" disabled>Select a program</option>
                      {initiatives.map((initiative) => (
                        <option key={initiative.id} value={initiative.id}>
                          {initiative.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-default-500">
                      Select the program this team will participate in
                    </p>
                  </div>
                </div>
              </div>
              
              <Divider />
              
              {/* Team Members */}
              <div>
                <h2 className="text-lg font-bold mb-4">Team Members</h2>
                
                <div className="space-y-4">
                  {/* Current user is automatically added */}
                  <div className="p-3 border rounded-md bg-default-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
                          <TeamIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {profile ? `${profile.firstName} ${profile.lastName}` : "You"}
                          </p>
                          <p className="text-xs text-default-500">
                            {profile?.email || ""}
                          </p>
                        </div>
                      </div>
                      <Chip color="primary" size="sm">Team Leader</Chip>
                    </div>
                  </div>
                  
                  {/* Invited members */}
                  {formData.members.map((member, index) => (
                    <div key={index} className="p-3 border rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-default-200 rounded-full flex items-center justify-center text-default-600">
                            <TeamIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium">{member.email}</p>
                            <p className="text-xs text-default-500">Pending invitation</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Chip color="default" size="sm">{member.role}</Chip>
                          <Button 
                            size="sm" 
                            color="danger" 
                            variant="light"
                            onClick={() => handleRemoveMember(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Invite form */}
                  <div className="mt-4 p-4 border rounded-md border-dashed">
                    <h3 className="text-sm font-medium mb-3">Invite Team Members</h3>
                    <div className="flex flex-col md:flex-row gap-3">
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Email address"
                        className="flex-1"
                      />
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="p-2 border rounded-md md:w-1/4"
                      >
                        <option value="Member">Member</option>
                        <option value="Contributor">Contributor</option>
                        <option value="Advisor">Advisor</option>
                      </select>
                      <Button 
                        type="button" 
                        onClick={handleAddMember}
                        color="primary"
                        isDisabled={!inviteEmail}
                      >
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-default-500 mt-2">
                      Team members will receive an email invitation to join
                    </p>
                  </div>
                </div>
              </div>
              
              <Divider />
              
              {/* Form actions */}
              <div className="flex justify-end gap-2">
                <Button 
                  as={Link} 
                  href="/dashboard" 
                  variant="flat" 
                  color="default"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  color="primary"
                  isLoading={isCreating}
                >
                  Create Team
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export const getServerSideProps = withPageAuthRequired();