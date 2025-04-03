import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Import our domain-specific context hooks
import { useEducationContext } from "@/contexts/EducationContext";
import { useUserContext } from "@/contexts/UserContext";

/**
 * Example component that demonstrates using domain-specific contexts
 */
export default function EducationProfileExample() {
  const { 
    education, 
    isEducationLoading, 
    educationError, 
    updateEducation,
    hasCompletedEducationProfile
  } = useEducationContext();
  
  const { profile } = useUserContext();
  
  // Form state
  const [formData, setFormData] = useState({
    institutionName: education?.institutionName || "",
    degreeType: education?.degreeType || "",
    majorName: education?.majorName || "",
    graduationYear: education?.graduationYear || "",
    graduationSemester: education?.graduationSemester || ""
  });
  
  // Update form data when education data changes
  useState(() => {
    if (education && education.exists) {
      setFormData({
        institutionName: education.institutionName || "",
        degreeType: education.degreeType || "",
        majorName: education.majorName || "",
        graduationYear: education.graduationYear || "",
        graduationSemester: education.graduationSemester || ""
      });
    }
  }, [education]);
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle select changes
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Include educationId if we're updating an existing record
      const updateData = {
        ...formData,
        educationId: education?.id
      };
      
      // Call the update function from our context
      await updateEducation(updateData);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to update education information");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Loading state
  if (isEducationLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Education Profile</CardTitle>
          <CardDescription>Loading your education information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Error state
  if (educationError) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Education Profile</CardTitle>
          <CardDescription className="text-red-500">
            Error loading education data: {educationError.message}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Education Profile</CardTitle>
        <CardDescription>
          {hasCompletedEducationProfile 
            ? "Your education profile is complete" 
            : "Please complete your education profile"}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Institution */}
          <div className="space-y-2">
            <Label htmlFor="institutionName">Institution</Label>
            <Input
              id="institutionName"
              name="institutionName"
              value={formData.institutionName}
              onChange={handleChange}
              placeholder="Your university or college"
              required
            />
          </div>
          
          {/* Degree Type */}
          <div className="space-y-2">
            <Label htmlFor="degreeType">Degree Type</Label>
            <Select 
              value={formData.degreeType} 
              onValueChange={(value) => handleSelectChange("degreeType", value)}
            >
              <SelectTrigger id="degreeType">
                <SelectValue placeholder="Select degree type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bachelors">Bachelor&apos;s</SelectItem>
                <SelectItem value="Masters">Master&apos;s</SelectItem>
                <SelectItem value="PhD">PhD</SelectItem>
                <SelectItem value="Associate">Associate</SelectItem>
                <SelectItem value="High School">High School</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Major */}
          <div className="space-y-2">
            <Label htmlFor="majorName">Major</Label>
            <Input
              id="majorName"
              name="majorName"
              value={formData.majorName}
              onChange={handleChange}
              placeholder="Your field of study"
              required
            />
          </div>
          
          {/* Graduation Year */}
          <div className="space-y-2">
            <Label htmlFor="graduationYear">Graduation Year</Label>
            <Input
              id="graduationYear"
              name="graduationYear"
              type="number"
              min="1950"
              max="2050"
              value={formData.graduationYear}
              onChange={handleChange}
              placeholder="Expected graduation year"
              required
            />
          </div>
          
          {/* Graduation Semester */}
          <div className="space-y-2">
            <Label htmlFor="graduationSemester">Graduation Semester</Label>
            <Select 
              value={formData.graduationSemester} 
              onValueChange={(value) => handleSelectChange("graduationSemester", value)}
            >
              <SelectTrigger id="graduationSemester">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Spring">Spring</SelectItem>
                <SelectItem value="Summer">Summer</SelectItem>
                <SelectItem value="Fall">Fall</SelectItem>
                <SelectItem value="Winter">Winter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>
        
        {/* Show error message if there was an error */}
        {error && (
          <div className="mt-4 text-red-500 text-sm">
            {error}
          </div>
        )}
        
        {/* Show success message if update was successful */}
        {success && (
          <div className="mt-4 text-green-500 text-sm">
            Education information updated successfully!
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          type="submit" 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Updating..." : "Save Education Info"}
        </Button>
      </CardFooter>
    </Card>
  );
}