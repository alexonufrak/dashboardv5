import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submissions } from '../entities';

/**
 * Hook to fetch a submission by ID
 * @param {string} submissionId - The ID of the submission
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function useSubmission(submissionId, options = {}) {
  return useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => submissions.getSubmissionById(submissionId),
    enabled: !!submissionId,
    ...options
  });
}

/**
 * Hook to fetch submissions by team ID
 * @param {string} teamId - The ID of the team
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function useTeamSubmissions(teamId, options = {}) {
  return useQuery({
    queryKey: ['submissions', 'team', teamId],
    queryFn: () => submissions.getSubmissionsByTeam(teamId),
    enabled: !!teamId,
    ...options
  });
}

/**
 * Hook to fetch submissions by milestone ID
 * @param {string} milestoneId - The ID of the milestone
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function useMilestoneSubmissions(milestoneId, options = {}) {
  return useQuery({
    queryKey: ['submissions', 'milestone', milestoneId],
    queryFn: () => submissions.getSubmissionsByMilestone(milestoneId),
    enabled: !!milestoneId,
    ...options
  });
}

/**
 * Hook to create a new submission
 * @returns {Object} The mutation result
 */
export function useCreateSubmission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (submissionData) => submissions.createSubmission(submissionData),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries(['submissions', 'team', variables.teamId]);
      queryClient.invalidateQueries(['submissions', 'milestone', variables.milestoneId]);
      
      // Optionally add the new submission to the cache
      if (data && data.id) {
        queryClient.setQueryData(['submission', data.id], data);
      }
    }
  });
}

/**
 * Hook to update an existing submission
 * @returns {Object} The mutation result
 */
export function useUpdateSubmission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ submissionId, updateData }) => 
      submissions.updateSubmission(submissionId, updateData),
    onSuccess: (data) => {
      if (data) {
        // Update the submission in the cache
        queryClient.setQueryData(['submission', data.id], data);
        
        // Invalidate related queries
        if (data.teamId) {
          queryClient.invalidateQueries(['submissions', 'team', data.teamId]);
        }
        
        if (data.milestoneId) {
          queryClient.invalidateQueries(['submissions', 'milestone', data.milestoneId]);
        }
      }
    }
  });
}