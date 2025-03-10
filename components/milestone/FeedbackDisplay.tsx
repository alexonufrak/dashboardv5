import { useState } from "react";
import { Card, CardHeader, CardBody, CardFooter, Avatar, Textarea, Badge } from "@heroui/react";
import { Button } from "@heroui/react";


interface FeedbackItem {
  id: string;
  text: string;
  date: string;
  reviewer: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  status?: 'needs-revision' | 'approved' | 'rejected' | 'in-review';
  actionItems?: string[];
}

interface FeedbackDisplayProps {
  feedback: FeedbackItem[];
  canAddFeedback?: boolean;
  onAddFeedback?: (text: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function FeedbackDisplay({
  feedback,
  canAddFeedback = false,
  onAddFeedback,
  isSubmitting = false
}: FeedbackDisplayProps) {
  const [newFeedback, setNewFeedback] = useState("");
  
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
  
  // Get status color
  const getStatusColor = (status?: string) => {
    if (!status) return undefined;
    
    switch(status) {
      case 'approved': return 'success';
      case 'in-review': return 'primary';
      case 'needs-revision': return 'warning';
      case 'rejected': return 'danger';
      default: return 'default';
    }
  };
  
  // Handle submit feedback
  const handleSubmitFeedback = async () => {
    if (!newFeedback.trim() || !onAddFeedback) return;
    
    try {
      await onAddFeedback(newFeedback);
      setNewFeedback("");
    } catch (err) {
      console.error("Error submitting feedback:", err);
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <h3 className="text-lg font-bold">Reviewer Feedback</h3>
        {feedback.length > 0 && (
          <Badge 
            color={getStatusColor(feedback[0].status) || 'default'} 
            variant="flat"
          >
            {feedback[0].status ? feedback[0].status.replace('-', ' ') : 'No status'}
          </Badge>
        )}
      </CardHeader>
      
      <CardBody className="space-y-6">
        {feedback.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-default-500">No feedback yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {feedback.map((item) => (
              <div key={item.id} className="bg-default-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Avatar
                    src={item.reviewer.avatar || "/placeholder-user.jpg"}
                    name={item.reviewer.name}
                    className="w-8 h-8"
                  />
                  
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div>
                        <p className="font-medium">{item.reviewer.name}</p>
                        <p className="text-xs text-default-500">{formatDate(item.date)}</p>
                      </div>
                      
                      {item.status && (
                        <Badge color={getStatusColor(item.status)} variant="flat" className="mt-1 sm:mt-0">
                          {item.status.replace('-', ' ')}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm whitespace-pre-line">{item.text}</p>
                    </div>
                    
                    {item.actionItems && item.actionItems.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-default-700 mb-2">Action items:</p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {item.actionItems.map((actionItem, index) => (
                            <li key={index} className="text-default-700">{actionItem}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {canAddFeedback && onAddFeedback && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Add Feedback</h4>
            <div className="space-y-3">
              <Textarea
                value={newFeedback}
                onChange={(e) => setNewFeedback(e.target.value)}
                placeholder="Enter your feedback here..."
                rows={4}
              />
              
              <div className="flex justify-end">
                <Button
                  color="primary"
                  isDisabled={!newFeedback.trim()}
                  isLoading={isSubmitting}
                  onClick={handleSubmitFeedback}
                >
                  Submit Feedback
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}