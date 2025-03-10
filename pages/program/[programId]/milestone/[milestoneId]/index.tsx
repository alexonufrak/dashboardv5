import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GetServerSidePropsContext } from "next";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { Card, CardHeader, CardBody, CardFooter, Divider, Progress, Badge, Chip, Tabs, Tab } from "@heroui/react";


import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/dashboard";
import { useDashboard } from "@/contexts/DashboardContext";
import { CalendarIcon, MilestoneIcon } from "@/components/dashboard/icons";
import { SubmissionForm, SubmissionData } from "@/components/milestone/SubmissionForm";
import { SubmissionHistory } from "@/components/milestone/SubmissionHistory";
import { FeedbackDisplay } from "@/components/milestone/FeedbackDisplay";
import type { Milestone } from "@/types/dashboard";
import { Button, Link } from "@heroui/react";

// Example types for API responses
interface MilestoneDetailData {
  milestone: Milestone;
  submissions: Array<{
    id: string;
    submittedDate: string;
    status: 'pending' | 'in-review' | 'needs-revision' | 'approved' | 'rejected';
    description: string;
    files: Array<{
      id: string;
      name: string;
      url: string;
      size: number;
    }>;
    links: string[];
    contributors: Array<{
      id: string;
      name: string;
      avatar?: string | null;
    }>;
    feedback?: {
      text: string;
      reviewer: {
        id: string;
        name: string;
        avatar?: string | null;
      };
      date: string;
      status?: string;
      actionItems?: string[];
    };
    version: number;
  }>;
}

export default function MilestoneDetailPage({
  programId,
  milestoneId
}: {
  programId: string;
  milestoneId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState("overview");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    profile,
    isLoading: isDashboardLoading,
    error: dashboardError,
    milestones,
    teamData,
    setActiveProgram
  } = useDashboard();
  
  // Set the active program when the component mounts
  useEffect(() => {
    if (programId) {
      setActiveProgram(programId);
    }
  }, [programId, setActiveProgram]);
  
  // Define type for submission data
  type Submission = {
    id: string;
    submittedDate: string;
    status: "in-review";
    description: string;
    files: Array<{
      id: string;
      name: string;
      url: string;
      size: number;
    }>;
    links: string[];
    contributors: Array<{
      id: string;
      name: string;
      avatar: string | null | undefined;
    }>;
    version: number;
    feedback?: {
      id: string;
      text: string;
      reviewer: {
        id: string;
        name: string;
        avatar: string | null;
      };
      date: string;
      status: string;
      actionItems: string[];
    };
  };
  
  // Find the milestone from the milestones array in dashboard context
  const milestoneFromContext = milestones.find(m => m.id === milestoneId);
  
  // Fetch milestone details and submissions
  const { 
    data: milestoneData,
    isLoading: isLoadingMilestoneData,
    error: milestoneError
  } = useQuery({
    queryKey: ['milestone', programId, milestoneId],
    queryFn: async () => {
      // In a real implementation, this would be an API call
      // For now, we'll simulate it with a mock response
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockSubmissions: Submission[] = [
        {
          id: "sub1",
          submittedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'in-review' as const,
          description: "This is our first submission for this milestone. We've completed the initial requirements and are ready for feedback.",
          files: [
            { id: "f1", name: "project-proposal.pdf", url: "#", size: 2456000 },
            { id: "f2", name: "technical-spec.docx", url: "#", size: 1200000 }
          ],
          links: ["https://github.com/example/repo", "https://example.com/demo"],
          contributors: teamData?.members?.slice(0, 2).map(member => ({
            id: member.id,
            name: member.name || "Team Member",
            avatar: member.avatar
          })) || [],
          version: 1
        }
      ];
      
      // If the milestone is "in-progress", add feedback to the submission
      if (milestoneFromContext?.status === "in-progress") {
        mockSubmissions[0].feedback = {
          id: "feedback1",
          text: "Great work on your first submission! I've reviewed your proposal and have a few suggestions for improvement. Please address the action items below and resubmit.",
          reviewer: {
            id: "reviewer1",
            name: "Dr. Jane Smith",
            avatar: null
          },
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          status: "needs-revision",
          actionItems: [
            "Expand on the technical implementation details in section 3",
            "Include more information about your testing strategy",
            "Address the scalability concerns mentioned in the requirements"
          ]
        };
      }
      
      return {
        milestone: milestoneFromContext || {
          id: milestoneId,
          name: "Milestone",
          description: "No details available",
          status: "upcoming",
          dueDate: new Date().toISOString()
        },
        submissions: mockSubmissions
      } as MilestoneDetailData;
    },
    enabled: !!milestoneId && !!programId && !!milestoneFromContext
  });
  
  // Handle submission creation
  const createSubmission = useMutation({
    mutationFn: async (submissionData: SubmissionData) => {
      // In a real implementation, this would be an API call
      // For now, we'll simulate it with a timeout
      setIsSubmitting(true);
      console.log("Submitting milestone data:", submissionData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Return a mock response
      return {
        id: "new-submission-id",
        status: "pending"
      };
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['milestone', programId, milestoneId] });
      
      // Show success message
      alert("Submission successful! It will be reviewed by your program manager.");
      
      // Reset form
      setIsSubmitting(false);
      
      // Switch to overview tab
      setSelected("overview");
    },
    onError: (error) => {
      console.error("Error submitting milestone:", error);
      setIsSubmitting(false);
      alert("Failed to submit. Please try again later.");
    }
  });
  
  // Handle submission
  const handleSubmit = async (data: SubmissionData) => {
    await createSubmission.mutateAsync(data);
  };
  
  // Calculate progress percentage
  const getProgressPercentage = (status?: string) => {
    switch (status) {
      case 'completed': return 100;
      case 'in-progress': return 50;
      case 'upcoming': return 0;
      default: return 0;
    }
  };
  
  // Calculate status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'primary';
      case 'upcoming': return 'default';
      default: return 'default';
    }
  };
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "No due date";
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  // Determine if we can submit
  const canSubmit = () => {
    // Can't submit if milestone is completed
    if (milestoneData?.milestone.status === 'completed') return false;
    
    // Check if the latest submission has feedback requesting revision
    const latestSubmission = milestoneData?.submissions[0];
    if (latestSubmission?.feedback?.status === 'needs-revision') return true;
    
    // If we have a submission that's pending or in review, don't allow new submissions
    if (latestSubmission?.status === 'pending' || latestSubmission?.status === 'in-review') return false;
    
    // Otherwise, we can submit
    return true;
  };
  
  // Derive loading state
  const isLoading = isDashboardLoading || isLoadingMilestoneData;
  const error = dashboardError || milestoneError;
  
  return (
    <DashboardLayout
      title={`${milestoneData?.milestone?.name || 'Milestone'} | Program`}
      profile={profile}
      isLoading={isLoading}
      error={error}
      loadingMessage="Loading milestone details..."
    >
      <div className="space-y-6">
        {/* Milestone Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-default-500">
              <Link href="/dashboard" className="hover:text-default-700">
                Dashboard
              </Link>
              <span>/</span>
              <Link 
                href={`/program/${programId}`} 
                className="hover:text-default-700"
              >
                Program
              </Link>
              <span>/</span>
              <span>Milestone</span>
            </div>
            <h1 className="text-2xl font-bold mt-1">
              {milestoneData?.milestone.name || 'Milestone'}
            </h1>
          </div>
          
          {milestoneData?.milestone && (
            <Badge 
              color={getStatusColor(milestoneData.milestone.status)} 
              variant="flat"
              size="lg"
            >
              {milestoneData.milestone.status || 'Status Unknown'}
            </Badge>
          )}
        </div>
        
        {/* Milestone Content */}
        {milestoneData?.milestone && (
          <>
            <Card>
              <CardBody className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">{milestoneData.milestone.name}</h2>
                    <div className="flex items-center gap-2 mt-1 text-sm text-default-500">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Due: {formatDate(milestoneData.milestone.dueDate)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-xs text-default-500">
                        {getProgressPercentage(milestoneData.milestone.status)}% Complete
                      </span>
                    </div>
                    <Progress 
                      value={getProgressPercentage(milestoneData.milestone.status)} 
                      color={getStatusColor(milestoneData.milestone.status)}
                      size="md"
                      className="w-24"
                    />
                  </div>
                </div>
                
                <Divider />
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Description</h3>
                  <p className="text-default-700">
                    {milestoneData.milestone.description || 
                     "Complete the requirements for this milestone and submit your work for review."}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Requirements</h3>
                  <div className="bg-default-50 p-4 rounded-lg">
                    <ul className="list-disc list-inside space-y-2">
                      <li>Submit a detailed proposal for your project</li>
                      <li>Include technical specifications and implementation plan</li>
                      <li>Address the core requirements outlined in the program guidelines</li>
                      <li>Provide timeline and resource allocation details</li>
                    </ul>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            <Tabs 
              aria-label="Milestone tabs" 
              selectedKey={selected} 
              onSelectionChange={setSelected as any}
              className="w-full"
            >
              <Tab key="overview" title="Overview">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  <div className="md:col-span-2">
                    <SubmissionHistory 
                      submissions={milestoneData.submissions || []}
                      programId={programId}
                      milestoneId={milestoneId}
                    />
                  </div>
                  
                  <div>
                    {milestoneData.submissions.length > 0 && milestoneData.submissions[0].feedback && (
                      <FeedbackDisplay 
                        feedback={[
                          // Cast to any as a workaround for type issues
                          milestoneData.submissions[0].feedback as any
                        ]}
                      />
                    )}
                    
                    {canSubmit() && (
                      <div className="mt-6">
                        <Card>
                          <CardBody className="p-4">
                            <h3 className="text-lg font-bold mb-2">Ready to Submit?</h3>
                            <p className="text-sm text-default-700 mb-4">
                              {milestoneData.submissions.length > 0 && milestoneData.submissions[0].feedback?.status === 'needs-revision'
                                ? "Please address the reviewer feedback and submit your revised work."
                                : "Submit your work for this milestone when you're ready for review."}
                            </p>
                            <Button 
                              color="primary" 
                              fullWidth
                              onClick={() => setSelected("submit")}
                            >
                              {milestoneData.submissions.length > 0 
                                ? "Submit New Version" 
                                : "Submit Work"}
                            </Button>
                          </CardBody>
                        </Card>
                      </div>
                    )}
                  </div>
                </div>
              </Tab>
              
              <Tab 
                key="submit" 
                title="Submit" 
                isDisabled={!canSubmit()}
              >
                <div className="pt-4">
                  <SubmissionForm 
                    milestone={milestoneData.milestone}
                    programId={programId}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                  />
                </div>
              </Tab>
              
              <Tab key="resources" title="Resources">
                <div className="pt-4">
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-bold">Resources</h3>
                    </CardHeader>
                    <CardBody>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-md font-medium mb-2">Reference Materials</h4>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                              <svg
                                className="w-5 h-5 text-primary"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <Link 
                                href="#" 
                                color="primary"
                                isExternal
                              >
                                Program Guidelines.pdf
                              </Link>
                            </li>
                            <li className="flex items-center gap-2">
                              <svg
                                className="w-5 h-5 text-primary"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <Link 
                                href="#" 
                                color="primary"
                                isExternal
                              >
                                Technical Requirements.pdf
                              </Link>
                            </li>
                            <li className="flex items-center gap-2">
                              <svg
                                className="w-5 h-5 text-primary"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <Link 
                                href="#" 
                                color="primary"
                                isExternal
                              >
                                Submission Template.docx
                              </Link>
                            </li>
                          </ul>
                        </div>
                        
                        <Divider />
                        
                        <div>
                          <h4 className="text-md font-medium mb-2">Helpful Links</h4>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                              <svg
                                className="w-5 h-5 text-primary"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                              </svg>
                              <Link 
                                href="https://example.com/resources" 
                                color="primary"
                                isExternal
                              >
                                Program Resource Hub
                              </Link>
                            </li>
                            <li className="flex items-center gap-2">
                              <svg
                                className="w-5 h-5 text-primary"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                              </svg>
                              <Link 
                                href="https://example.com/faq" 
                                color="primary"
                                isExternal
                              >
                                Frequently Asked Questions
                              </Link>
                            </li>
                            <li className="flex items-center gap-2">
                              <svg
                                className="w-5 h-5 text-primary"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                              </svg>
                              <Link 
                                href="https://example.com/support" 
                                color="primary"
                                isExternal
                              >
                                Support Center
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </Tab>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps(context: GetServerSidePropsContext) {
    const { programId, milestoneId } = context.params || {};
    
    if (!programId || !milestoneId) {
      return {
        notFound: true
      };
    }
    
    return {
      props: {
        programId,
        milestoneId
      }
    };
  }
});