import { useState, useEffect } from "react";
import { 
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Textarea,
  Checkbox,
  Chip,
  Avatar
} from "@heroui/react";

import { FileUpload } from "./FileUpload";
import { useDashboard } from "@/contexts/DashboardContext";
import type { Milestone, TeamMember } from "@/types/dashboard";
import { Button } from "@heroui/react";

interface SubmissionFormProps {
  milestone: Milestone;
  programId: string;
  onSubmit: (data: SubmissionData) => Promise<void>;
  isSubmitting?: boolean;
  defaultValues?: Partial<SubmissionData>;
}

export interface SubmissionData {
  description: string;
  files: File[];
  links: string[];
  contributors: string[]; // Team member IDs
  notes: string;
  fileUrls?: Array<{
    url: string;
    filename: string;
    contentType: string;
    size: number;
  }>;
}

export function SubmissionForm({
  milestone,
  programId,
  onSubmit,
  isSubmitting = false,
  defaultValues
}: SubmissionFormProps) {
  const { teamData } = useDashboard();
  
  // Form state
  const [description, setDescription] = useState(defaultValues?.description || "");
  const [files, setFiles] = useState<File[]>(defaultValues?.files || []);
  const [links, setLinks] = useState<string[]>(defaultValues?.links || []);
  const [contributors, setContributors] = useState<string[]>(defaultValues?.contributors || []);
  const [notes, setNotes] = useState(defaultValues?.notes || "");
  const [currentLink, setCurrentLink] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Draft saving
  const draftKey = `submission_draft_${programId}_${milestone.id}`;
  
  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft && !defaultValues) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setDescription(parsedDraft.description || "");
        // Files can't be stored in localStorage, so we're not restoring those
        setLinks(parsedDraft.links || []);
        setContributors(parsedDraft.contributors || []);
        setNotes(parsedDraft.notes || "");
      } catch (err) {
        console.error("Error parsing saved draft:", err);
      }
    }
  }, [draftKey, defaultValues]);
  
  // Auto-save draft as user types
  useEffect(() => {
    const draftData = {
      description,
      links,
      contributors,
      notes
    };
    
    localStorage.setItem(draftKey, JSON.stringify(draftData));
  }, [description, links, contributors, notes, draftKey]);
  
  // Handle file uploads
  const handleFilesChanged = (newFiles: File[]) => {
    setFiles(newFiles);
    setFormErrors(prev => ({ ...prev, files: "" }));
  };
  
  // Handle adding a new link
  const handleAddLink = () => {
    if (!currentLink) return;
    
    // Basic URL validation
    let url = currentLink;
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    
    setLinks(prev => [...prev, url]);
    setCurrentLink("");
    setFormErrors(prev => ({ ...prev, links: "" }));
  };
  
  // Handle removing a link
  const handleRemoveLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle contributor selection
  const handleContributorToggle = (memberId: string) => {
    setContributors(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
    setFormErrors(prev => ({ ...prev, contributors: "" }));
  };
  
  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!description.trim()) {
      errors.description = "Description is required";
    }
    
    if (files.length === 0 && links.length === 0) {
      errors.files = "Please upload at least one file or provide a link";
      errors.links = "Please upload at least one file or provide a link";
    }
    
    if (contributors.length === 0) {
      errors.contributors = "Please select at least one contributor";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Track uploaded file URLs
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    url: string;
    filename: string;
    contentType: string;
    size: number;
  }>>([]);
  
  // Handle file upload completion
  const handleUploadComplete = (fileInfo: {
    url: string;
    filename: string;
    contentType: string;
    size: number;
  }) => {
    setUploadedFiles(prev => [...prev, fileInfo]);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Create submission data with uploaded file URLs
    const submissionData: SubmissionData = {
      description,
      files,
      links,
      contributors,
      notes,
      // Include uploaded file URLs if available
      fileUrls: uploadedFiles
    };
    
    try {
      await onSubmit(submissionData);
      // Clear the form draft after successful submission
      localStorage.removeItem(draftKey);
    } catch (err) {
      console.error("Error submitting milestone:", err);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold">Submission for {milestone.name}</h3>
        </CardHeader>
        
        <CardBody className="space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description <span className="text-danger">*</span>
            </label>
            <Textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setFormErrors(prev => ({ ...prev, description: "" }));
              }}
              placeholder="Describe your submission in detail..."
              rows={5}
              isInvalid={!!formErrors.description}
              errorMessage={formErrors.description}
            />
          </div>
          
          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Attachments <span className="text-danger">*</span>
            </label>
            <FileUpload
              value={files}
              onChange={handleFilesChanged}
              maxSize={10} // 10MB
              maxFiles={5}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.jpg,.jpeg,.png"
              error={formErrors.files}
              teamId={teamData?.id}
              milestoneId={milestone.id}
              onUploadComplete={handleUploadComplete}
            />
            <p className="text-xs text-default-500">
              Accepted file types: PDF, Word, PowerPoint, Excel, ZIP, images. Maximum size: 10MB per file.
            </p>
          </div>
          
          {/* External Links */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              External Links {files.length === 0 && <span className="text-danger">*</span>}
            </label>
            
            <div className="flex gap-2">
              <Input
                value={currentLink}
                onChange={(e) => setCurrentLink(e.target.value)}
                placeholder="https://example.com"
                className="flex-1"
                isInvalid={!!formErrors.links}
              />
              <Button
                type="button"
                color="primary"
                variant="flat"
                onClick={handleAddLink}
                isDisabled={!currentLink}
              >
                Add Link
              </Button>
            </div>
            
            {formErrors.links && (
              <p className="text-sm text-danger">{formErrors.links}</p>
            )}
            
            {links.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {links.map((link, index) => (
                  <Chip
                    key={index}
                    onClose={() => handleRemoveLink(index)}
                    variant="flat"
                    color="default"
                  >
                    {link.replace(/^https?:\/\//i, "").substring(0, 30)}
                    {link.replace(/^https?:\/\//i, "").length > 30 ? "..." : ""}
                  </Chip>
                ))}
              </div>
            )}
          </div>
          
          {/* Contributors */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Contributors <span className="text-danger">*</span>
            </label>
            
            {formErrors.contributors && (
              <p className="text-sm text-danger">{formErrors.contributors}</p>
            )}
            
            {teamData?.members ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {teamData.members.map((member) => (
                  <div
                    key={member.id}
                    className={`border rounded-md p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                      contributors.includes(member.id)
                        ? "border-primary bg-primary/5"
                        : "hover:border-default-300"
                    }`}
                    onClick={() => handleContributorToggle(member.id)}
                  >
                    <Checkbox
                      isSelected={contributors.includes(member.id)}
                      onChange={() => handleContributorToggle(member.id)}
                      aria-label={`Select ${member.name || "team member"} as contributor`}
                    />
                    <Avatar
                      src={member.avatar || "/placeholder-user.jpg"}
                      name={member.name || "Team Member"}
                      className="w-8 h-8"
                    />
                    <div>
                      <p className="font-medium">{member.name || "Team Member"}</p>
                      <p className="text-xs text-default-500">{member.role || "Member"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-default-500">No team members available</p>
            )}
          </div>
          
          {/* Additional Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes or context for the reviewers..."
              rows={3}
            />
          </div>
        </CardBody>
        
        <CardFooter className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="flat" 
            color="default"
            onClick={() => {
              // Clear draft
              localStorage.removeItem(draftKey);
              
              // Reset form
              setDescription("");
              setFiles([]);
              setLinks([]);
              setContributors([]);
              setNotes("");
              setFormErrors({});
            }}
          >
            Clear Form
          </Button>
          <Button 
            type="submit" 
            color="primary"
            isLoading={isSubmitting}
          >
            Submit
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}