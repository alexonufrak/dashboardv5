/**
 * EducationInfo.refactored.js
 * 
 * Refactored Education Information component
 * Uses the domain-driven hooks for Airtable integration
 */
import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useMyEducation, useUpdateEducation } from '@/lib/airtable/hooks/useEducation';
import { useInstitutionSearch } from '@/lib/airtable/hooks/useInstitutions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const DEGREE_TYPES = [
  { value: "Bachelor's", label: "Bachelor's" },
  { value: "Master's", label: "Master's" },
  { value: "Doctorate", label: "Doctorate" },
  { value: "Undergraduate", label: "Undergraduate" },
  { value: "Graduate", label: "Graduate" },
];

const SEMESTERS = [
  { value: "Fall", label: "Fall" },
  { value: "Spring", label: "Spring" },
  { value: "Summer", label: "Summer" },
  { value: "Winter", label: "Winter" },
];

export function EducationInfo() {
  const { user } = useUser();
  const userId = user?.sub;
  
  // Fetch education data
  const { 
    data: education, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useMyEducation();
  
  // Institution search
  const [institutionQuery, setInstitutionQuery] = useState('');
  const { 
    data: institutionResults,
    isLoading: isSearching
  } = useInstitutionSearch(institutionQuery, { 
    enabled: institutionQuery.length >= 2 
  });

  // Update education mutation
  const { 
    mutate: updateEducation, 
    isPending: isUpdating,
    isError: isUpdateError,
    error: updateError
  } = useUpdateEducation();
  
  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [showInstitutionResults, setShowInstitutionResults] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    institutionId: '',
    institutionName: '',
    degreeType: '',
    major: '',
    majorName: '',
    graduationYear: '',
    graduationSemester: ''
  });
  
  // Initialize form data when education loads
  useEffect(() => {
    if (education) {
      setFormData({
        institutionId: education.institution?.[0] || '',
        institutionName: education.institutionName || '',
        degreeType: education.degreeType || '',
        major: education.major?.[0] || '',
        majorName: education.majorName || '',
        graduationYear: education.graduationYear || '',
        graduationSemester: education.graduationSemester || ''
      });
    }
  }, [education]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Special handling for institution search
    if (name === 'institutionName') {
      setInstitutionQuery(value);
      setShowInstitutionResults(value.length >= 2);
    }
  };
  
  const selectInstitution = (institution) => {
    setFormData(prev => ({
      ...prev,
      institutionId: institution.id,
      institutionName: institution.name
    }));
    setShowInstitutionResults(false);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!userId) {
      console.error("Cannot update education: User ID is missing");
      return;
    }
    
    updateEducation({
      userId,
      educationId: education?.id,
      ...formData
    }, {
      onSuccess: () => {
        setIsEditing(false);
        refetch();
      }
    });
  };
  
  const renderInstitutionResults = () => {
    if (!showInstitutionResults || !institutionResults) return null;
    
    return (
      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
        {institutionResults.institutions?.length === 0 ? (
          <div className="p-2 text-sm text-gray-500">No institutions found</div>
        ) : (
          institutionResults.institutions?.map(institution => (
            <div 
              key={institution.id}
              className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => selectInstitution(institution)}
            >
              {institution.name}
              {institution.state && <span className="text-gray-500 ml-1">({institution.state})</span>}
            </div>
          ))
        )}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Education Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="animate-pulse text-gray-400">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Education Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p>Error loading education data: {error?.message || 'Unknown error'}</p>
            <button 
              onClick={() => refetch()}
              className="text-sm underline mt-2"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Education Information</CardTitle>
          <CardDescription>Your academic background and institutions</CardDescription>
        </div>
        {!isEditing && userId && (
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            size="sm"
            disabled={isLoading || isUpdating}
          >
            {education?.id ? 'Edit' : 'Add Education'}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <FormItem>
                    <FormLabel>Institution</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        name="institutionName"
                        value={formData.institutionName}
                        onChange={handleInputChange}
                        placeholder="Search for your institution..."
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormDescription>
                      Type to search for your institution
                    </FormDescription>
                    {renderInstitutionResults()}
                  </FormItem>
                </div>
                
                <FormItem>
                  <FormLabel>Degree Type</FormLabel>
                  <FormControl>
                    <select
                      name="degreeType"
                      value={formData.degreeType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Degree Type</option>
                      {DEGREE_TYPES.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                </FormItem>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormItem>
                  <FormLabel>Major</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      name="majorName"
                      value={formData.majorName}
                      onChange={handleInputChange}
                      placeholder="Your major or field of study"
                    />
                  </FormControl>
                </FormItem>
                
                <FormItem>
                  <FormLabel>Graduation Year</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      name="graduationYear"
                      value={formData.graduationYear}
                      onChange={handleInputChange}
                      placeholder="YYYY"
                    />
                  </FormControl>
                </FormItem>
                
                <FormItem>
                  <FormLabel>Graduation Semester</FormLabel>
                  <FormControl>
                    <select
                      name="graduationSemester"
                      value={formData.graduationSemester}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Semester</option>
                      {SEMESTERS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                </FormItem>
              </div>
              
              {isUpdateError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  <p>Error updating education: {updateError?.message || 'Unknown error'}</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    if (education?.id) {
                      setFormData({
                        institutionId: education.institution?.[0] || '',
                        institutionName: education.institutionName || '',
                        degreeType: education.degreeType || '',
                        major: education.major?.[0] || '',
                        majorName: education.majorName || '',
                        graduationYear: education.graduationYear || '',
                        graduationSemester: education.graduationSemester || ''
                      });
                    }
                  }}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          education?.id ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Institution</h3>
                  <p className="mt-1">{education.institutionName || 'Not provided'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Degree Type</h3>
                  <p className="mt-1">{education.degreeType || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Major</h3>
                  <p className="mt-1">{education.majorName || 'Not provided'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Graduation Year</h3>
                  <p className="mt-1">{education.graduationYear || 'Not provided'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Graduation Semester</h3>
                  <p className="mt-1">{education.graduationSemester || 'Not provided'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-4 text-gray-500">
              No education information found. Click "Add Education" to get started.
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

export default EducationInfo;