/**
 * EducationInfo Component
 * 
 * Displays and allows editing of the user's education information
 * using the domain-driven hooks and components.
 */
import React, { useState } from 'react';
import { useMyContact } from '@/lib/airtable/hooks/useContact';
import { useMyEducation, useUpdateEducation } from '@/lib/airtable/hooks/useEducation';
import DataDisplay from '@/components/common/DataDisplay';

export function EducationInfo() {
  // Get both contact and education data
  const { data: contact } = useMyContact();
  const { 
    data: education, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useMyEducation();
  
  const { update: updateEducation, isUpdating } = useUpdateEducation();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    institutionId: '',
    degreeType: '',
    major: '',
    graduationYear: '',
    graduationSemester: ''
  });
  
  // Initialize form data when education loads
  React.useEffect(() => {
    if (education) {
      setFormData({
        institutionId: education.institution?.[0] || '',
        degreeType: education.degreeType || '',
        major: education.major?.[0] || '',
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
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!contact?.contactId) {
      console.error("Cannot update education: Contact ID is missing");
      return;
    }
    
    updateEducation({
      contactId: contact.contactId,
      educationId: education?.id,
      ...formData
    }, {
      onSuccess: () => {
        setIsEditing(false);
      }
    });
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Education Information</h2>
        {!isEditing && contact?.contactId && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            disabled={isLoading || isUpdating}
          >
            {education?.exists ? 'Edit' : 'Add Education'}
          </button>
        )}
      </div>
      
      {!contact?.contactId ? (
        <div className="text-center p-4 text-gray-500">
          Please complete your contact information first.
        </div>
      ) : (
        <DataDisplay
          data={education}
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
          emptyComponent={
            <div className="text-center p-4 text-gray-500">
              No education information found. Click &quot;Add Education&quot; to get started.
            </div>
          }
        >
          {(data) => (
            <>
              {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Institution
                      </label>
                      <input
                        type="text"
                        name="institutionId"
                        value={formData.institutionId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Institution ID"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Note: In a real app, this would be a dropdown or search component
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Degree Type
                      </label>
                      <select
                        name="degreeType"
                        value={formData.degreeType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Degree Type</option>
                        <option value="Bachelor&apos;s">Bachelor&apos;s</option>
                        <option value="Master&apos;s">Master&apos;s</option>
                        <option value="Doctorate">Doctorate</option>
                        <option value="Undergraduate">Undergraduate</option>
                        <option value="Graduate">Graduate</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Major
                      </label>
                      <input
                        type="text"
                        name="major"
                        value={formData.major}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Major ID"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Note: In a real app, this would be a dropdown
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Graduation Year
                      </label>
                      <input
                        type="text"
                        name="graduationYear"
                        value={formData.graduationYear}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="YYYY"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Graduation Semester
                      </label>
                      <select
                        name="graduationSemester"
                        value={formData.graduationSemester}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Semester</option>
                        <option value="Fall">Fall</option>
                        <option value="Spring">Spring</option>
                        <option value="Summer">Summer</option>
                        <option value="Winter">Winter</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        if (data?.exists) {
                          setFormData({
                            institutionId: data.institution?.[0] || '',
                            degreeType: data.degreeType || '',
                            major: data.major?.[0] || '',
                            graduationYear: data.graduationYear || '',
                            graduationSemester: data.graduationSemester || ''
                          });
                        }
                      }}
                      className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                      disabled={isUpdating}
                    >
                      Cancel
                    </button>
                    
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Institution</h3>
                      <p className="mt-1">{data.institutionName || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Degree Type</h3>
                      <p className="mt-1">{data.degreeType || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Major</h3>
                      <p className="mt-1">{data.majorName || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Graduation Year</h3>
                      <p className="mt-1">{data.graduationYear || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Graduation Semester</h3>
                      <p className="mt-1">{data.graduationSemester || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </DataDisplay>
      )}
    </div>
  );
}

export default EducationInfo;