/**
 * ContactInfo Component
 * 
 * Displays and allows editing of the user's contact information
 * using the domain-driven hooks and components.
 */
import React, { useState } from 'react';
import { useMyContact } from '@/lib/airtable/hooks/useContact';
import { useUpdateProfile as useUpdateContact } from '@/lib/airtable/hooks/useContact';
import DataDisplay from '@/components/common/DataDisplay';

export function ContactInfo() {
  const { data: contact, isLoading, isError, error, refetch } = useMyContact();
  const { execute: updateContact, isExecuting: isUpdating } = useUpdateContact();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    referralSource: ''
  });
  
  // Initialize form data when contact loads
  React.useEffect(() => {
    if (contact) {
      setFormData({
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        referralSource: contact.referralSource || ''
      });
    }
  }, [contact]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    updateContact({
      contactId: contact.contactId,
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
        <h2 className="text-xl font-semibold text-gray-800">Contact Information</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            disabled={isLoading || isUpdating}
          >
            Edit
          </button>
        )}
      </div>
      
      <DataDisplay
        data={contact}
        isLoading={isLoading}
        isError={isError}
        error={error}
        refetch={refetch}
        emptyComponent={
          <div className="text-center p-4 text-gray-500">
            Contact information not found. Please complete your profile.
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
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referral Source
                  </label>
                  <input
                    type="text"
                    name="referralSource"
                    value={formData.referralSource}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        referralSource: data.referralSource || ''
                      });
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
                    <h3 className="text-sm font-medium text-gray-500">First Name</h3>
                    <p className="mt-1">{data.firstName || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Last Name</h3>
                    <p className="mt-1">{data.lastName || 'Not provided'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="mt-1">{data.email || 'Not provided'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Referral Source</h3>
                  <p className="mt-1">{data.referralSource || 'Not provided'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Onboarding Status</h3>
                  <p className="mt-1">{data.onboardingStatus || 'Not started'}</p>
                </div>
              </div>
            )}
          </>
        )}
      </DataDisplay>
    </div>
  );
}

export default ContactInfo;