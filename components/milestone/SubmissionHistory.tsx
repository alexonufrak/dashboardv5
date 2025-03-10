import { useMemo } from "react";
import { Card, CardHeader, CardBody, Chip, Avatar, Divider, Badge } from "@heroui/react";
import { Button, Link } from "@heroui/react";



interface Submission {
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
  };
  version: number;
}

interface SubmissionHistoryProps {
  submissions: Submission[];
  programId: string;
  milestoneId: string;
  onCompare?: (submission1: string, submission2: string) => void;
}

export function SubmissionHistory({
  submissions,
  programId,
  milestoneId,
  onCompare
}: SubmissionHistoryProps) {
  // Sort submissions by version (latest first)
  const sortedSubmissions = useMemo(() => {
    return [...submissions].sort((a, b) => b.version - a.version);
  }, [submissions]);
  
  // Get status color
  const getStatusColor = (status: Submission['status']) => {
    switch(status) {
      case 'approved': return 'success';
      case 'in-review': return 'primary';
      case 'needs-revision': return 'warning';
      case 'rejected': return 'danger';
      case 'pending': return 'default';
      default: return 'default';
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Format file size
  const formatFileSize = (size: number): string => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-bold">Submission History</h3>
      </CardHeader>
      
      <CardBody>
        {sortedSubmissions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-default-500">No submissions yet</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedSubmissions.map((submission, index) => (
              <div key={submission.id} className="relative">
                {/* Timeline connector */}
                {index < sortedSubmissions.length - 1 && (
                  <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-default-200"></div>
                )}
                
                {/* Submission item */}
                <div className="flex gap-4">
                  {/* Timeline dot */}
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white ${
                      submission.status === 'approved' 
                        ? 'bg-success' 
                        : submission.status === 'rejected'
                          ? 'bg-danger'
                          : 'bg-primary'
                    }`}
                  >
                    <span className="text-xs font-bold">v{submission.version}</span>
                  </div>
                  
                  {/* Submission content */}
                  <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold">Submission Version {submission.version}</h4>
                          <Badge color={getStatusColor(submission.status)} variant="flat">
                            {submission.status.replace('-', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-default-500">
                          Submitted on {formatDate(submission.submittedDate)}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          as={Link}
                          href={`/program/${programId}/milestone/${milestoneId}/submission/${submission.id}`}
                          size="sm" 
                          variant="flat" 
                          color="primary"
                        >
                          View Details
                        </Button>
                        
                        {onCompare && index < sortedSubmissions.length - 1 && (
                          <Button 
                            size="sm" 
                            variant="light" 
                            color="default"
                            onClick={() => onCompare(submission.id, sortedSubmissions[index + 1].id)}
                          >
                            Compare
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Description preview */}
                    <div className="px-3 py-2 bg-default-50 rounded-md">
                      <p className="text-sm line-clamp-2">
                        {submission.description}
                      </p>
                    </div>
                    
                    {/* Files and contributors */}
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium text-default-500 mb-1">Files</p>
                        <div className="space-y-1">
                          {submission.files.slice(0, 2).map(file => (
                            <div key={file.id} className="flex items-center gap-2">
                              <svg
                                className="w-4 h-4 text-default-500"
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
                              <span className="text-xs truncate max-w-[200px]">
                                {file.name} ({formatFileSize(file.size)})
                              </span>
                            </div>
                          ))}
                          
                          {submission.files.length > 2 && (
                            <p className="text-xs text-primary ml-6">
                              +{submission.files.length - 2} more files
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs font-medium text-default-500 mb-1">Contributors</p>
                        <div className="flex -space-x-2">
                          {submission.contributors.map(contributor => (
                            <Avatar
                              key={contributor.id}
                              src={contributor.avatar || "/placeholder-user.jpg"}
                              name={contributor.name}
                              className="w-6 h-6 border border-background"
                              size="sm"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Feedback if available */}
                    {submission.feedback && (
                      <div className="border border-default-200 rounded-md p-3 mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar
                            src={submission.feedback.reviewer.avatar || "/placeholder-user.jpg"}
                            name={submission.feedback.reviewer.name}
                            className="w-6 h-6"
                            size="sm"
                          />
                          <div>
                            <p className="text-xs font-medium">
                              {submission.feedback.reviewer.name}
                            </p>
                            <p className="text-xs text-default-500">
                              {formatDate(submission.feedback.date)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm">
                          {submission.feedback.text}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}