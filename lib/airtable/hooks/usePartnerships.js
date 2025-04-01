import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Note on terminology: In the Airtable schema, "Initiative" is the actual table name for what
 * users often refer to as "Programs" in the UI. We use "initiative" terminology in
 * our internal implementation for consistency with the database schema.
 */

/**
 * Custom hook for fetching a partnership by ID
 * @param {string} partnershipId Partnership ID
 * @returns {Object} Query result with partnership data
 */
export function usePartnership(partnershipId) {
  return useQuery({
    queryKey: ['partnership', partnershipId],
    queryFn: async () => {
      if (!partnershipId) {
        return null;
      }
      
      console.log(`Fetching partnership data for ID: ${partnershipId}`);
      
      const response = await fetch(`/api/partnerships/${partnershipId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch partnership: ${response.status}`);
      }
      
      const data = await response.json();
      return data.partnership || data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!partnershipId,
    retry: 2
  });
}

/**
 * Custom hook for fetching partnerships by institution
 * @param {string} institutionId Institution ID
 * @returns {Object} Query result with partnerships data
 */
export function useInstitutionPartnerships(institutionId) {
  return useQuery({
    queryKey: ['partnerships', 'institution', institutionId],
    queryFn: async () => {
      if (!institutionId) {
        return [];
      }
      
      console.log(`Fetching partnerships for institution: ${institutionId}`);
      
      const response = await fetch(`/api/institutions/${institutionId}/partnerships`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch institution partnerships: ${response.status}`);
      }
      
      const data = await response.json();
      return data.partnerships || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!institutionId,
    retry: 2
  });
}

/**
 * Custom hook for fetching partnerships by initiative
 * @param {string} initiativeId Initiative ID
 * @returns {Object} Query result with partnerships data
 */
export function useInitiativePartnerships(initiativeId) {
  return useQuery({
    queryKey: ['partnerships', 'initiative', initiativeId],
    queryFn: async () => {
      if (!initiativeId) {
        return [];
      }
      
      console.log(`Fetching partnerships for initiative: ${initiativeId}`);
      
      // API still uses "programs" in the URL for backward compatibility
      const response = await fetch(`/api/programs/${initiativeId}/partnerships`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch initiative partnerships: ${response.status}`);
      }
      
      const data = await response.json();
      return data.partnerships || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!initiativeId,
    retry: 2
  });
}

// Legacy alias for backward compatibility
export const useProgramPartnerships = useInitiativePartnerships;

/**
 * Custom hook for creating a partnership
 * @returns {Object} Mutation result
 */
export function useCreatePartnership() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      console.log('Creating partnership:', data);
      
      const response = await fetch('/api/partnerships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create partnership');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      if (variables.institutionId) {
        queryClient.invalidateQueries(['partnerships', 'institution', variables.institutionId]);
      }
      
      // Handle initiative ID (might be in either initiativeId or programId)
      const initiativeId = variables.initiativeId || variables.programId;
      if (initiativeId) {
        queryClient.invalidateQueries(['partnerships', 'initiative', initiativeId]);
        // Also invalidate legacy program queries for backward compatibility
        queryClient.invalidateQueries(['partnerships', 'program', initiativeId]);
      }
      
      toast.success('Partnership created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create partnership');
    }
  });
}

/**
 * Custom hook for updating a partnership
 * @returns {Object} Mutation result
 */
export function useUpdatePartnership() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ partnershipId, ...data }) => {
      console.log(`Updating partnership ${partnershipId}:`, data);
      
      const response = await fetch(`/api/partnerships/${partnershipId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update partnership');
      }
      
      return response.json();
    },
    onSuccess: (result, variables) => {
      // Invalidate specific partnership query
      queryClient.invalidateQueries(['partnership', variables.partnershipId]);
      
      // Get partnership data from result
      const partnership = result.partnership || result;
      
      // Invalidate more specific queries if we have the IDs
      if (partnership.institutionId) {
        queryClient.invalidateQueries(['partnerships', 'institution', partnership.institutionId]);
      }
      
      if (partnership.initiativeId) {
        queryClient.invalidateQueries(['partnerships', 'initiative', partnership.initiativeId]);
        // Also invalidate legacy program queries for backward compatibility
        queryClient.invalidateQueries(['partnerships', 'program', partnership.initiativeId]);
      }
      
      // As a fallback, invalidate all partnership queries
      queryClient.invalidateQueries(['partnerships']);
      
      toast.success('Partnership updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update partnership');
    }
  });
}

export default {
  usePartnership,
  useInstitutionPartnerships,
  useInitiativePartnerships,
  // Legacy export for backward compatibility
  useProgramPartnerships,
  useCreatePartnership,
  useUpdatePartnership
};