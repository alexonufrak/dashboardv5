import React from 'react';
import { useSubmission, useUpdateSubmission } from '@/lib/airtable/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

/**
 * SubmissionSummaryCard Component - Refactored to use the new Airtable hooks
 * Displays a summary of a milestone submission with actions
 */
export default function SubmissionSummaryCard({ submissionId, onView }) {
  // Use the new submission hook to fetch data
  const { 
    data: submission, 
    isLoading, 
    error 
  } = useSubmission(submissionId);

  // Use the mutation hook for status updates
  const updateSubmissionMutation = useUpdateSubmission();

  // Handle loading state
  if (isLoading) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Card className="w-full border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Error Loading Submission</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error.message || 'Failed to load submission details'}</p>
        </CardContent>
      </Card>
    );
  }

  // Handle missing data
  if (!submission) {
    return (
      <Card className="w-full border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-700">Submission Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-orange-600">This submission may have been deleted or is no longer available.</p>
        </CardContent>
      </Card>
    );
  }

  // Format the created time
  const timeAgo = submission.createdTime 
    ? formatDistanceToNow(new Date(submission.createdTime), { addSuffix: true }) 
    : 'Unknown date';

  // Get the status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'needs revision':
        return 'bg-orange-100 text-orange-800';
      case 'submitted':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Handle status update
  const handleStatusUpdate = (newStatus) => {
    updateSubmissionMutation.mutate({
      submissionId: submission.id,
      updateData: { status: newStatus }
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            {submission.milestoneName || 'Untitled Milestone'}
          </CardTitle>
          <Badge className={getStatusColor(submission.status)}>
            {submission.status || 'Submitted'}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Submitted by {submission.submittedBy?.name || 'Unknown'} • {timeAgo}
        </div>
      </CardHeader>
      
      <CardContent>
        {submission.text && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-1">Submission Notes</h4>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {submission.text}
            </p>
          </div>
        )}
        
        {submission.link && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-1">Submission Link</h4>
            <a 
              href={submission.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline break-words"
            >
              {submission.link}
            </a>
          </div>
        )}
        
        {submission.files && submission.files.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-1">Attached Files</h4>
            <div className="text-sm text-muted-foreground">
              {submission.files.length} {submission.files.length === 1 ? 'file' : 'files'} attached
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onView && onView(submission)}
        >
          View Details
        </Button>
        
        {/* Only show these buttons for admin/faculty users */}
        {submission.status !== 'Approved' && (
          <Button 
            variant="default" 
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleStatusUpdate('Approved')}
            disabled={updateSubmissionMutation.isPending}
          >
            Approve
          </Button>
        )}
        
        {submission.status !== 'Needs Revision' && (
          <Button 
            variant="default" 
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
            onClick={() => handleStatusUpdate('Needs Revision')}
            disabled={updateSubmissionMutation.isPending}
          >
            Request Revision
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}