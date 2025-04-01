import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { points } from '../entities';

/**
 * Hook to fetch user's points transactions
 * @param {string} userId - The Auth0 ID of the user
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function useUserPointsTransactions(userId, options = {}) {
  return useQuery({
    queryKey: ['points', 'transactions', 'user', userId],
    queryFn: () => points.getUserPointsTransactions(userId),
    enabled: !!userId,
    ...options
  });
}

/**
 * Hook to fetch team's points transactions
 * @param {string} teamId - The ID of the team
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function useTeamPointsTransactions(teamId, options = {}) {
  return useQuery({
    queryKey: ['points', 'transactions', 'team', teamId],
    queryFn: () => points.getTeamPointsTransactions(teamId),
    enabled: !!teamId,
    ...options
  });
}

/**
 * Hook to fetch available reward items
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function useRewardItems(options = {}) {
  return useQuery({
    queryKey: ['rewards', 'items'],
    queryFn: () => points.getRewardItems(),
    ...options
  });
}

/**
 * Hook to fetch user's claimed rewards
 * @param {string} userId - The Auth0 ID of the user
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function useUserClaimedRewards(userId, options = {}) {
  return useQuery({
    queryKey: ['rewards', 'claims', 'user', userId],
    queryFn: () => points.getUserClaimedRewards(userId),
    enabled: !!userId,
    ...options
  });
}

/**
 * Hook to fetch user's points summary (total, spent, available)
 * @param {string} userId - The Auth0 ID of the user
 * @param {Object} options - Additional React Query options
 * @returns {Object} The query result
 */
export function useUserPointsSummary(userId, options = {}) {
  return useQuery({
    queryKey: ['points', 'summary', 'user', userId],
    queryFn: () => points.getUserPointsSummary(userId),
    enabled: !!userId,
    ...options
  });
}

/**
 * Hook to create a new points transaction
 * @returns {Object} The mutation result
 */
export function useCreatePointsTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (transactionData) => points.createPointsTransaction(transactionData),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      if (variables.userId) {
        queryClient.invalidateQueries(['points', 'transactions', 'user', variables.userId]);
        queryClient.invalidateQueries(['points', 'summary', 'user', variables.userId]);
      }
      
      if (variables.teamId) {
        queryClient.invalidateQueries(['points', 'transactions', 'team', variables.teamId]);
      }
    }
  });
}

/**
 * Hook to claim a reward
 * @returns {Object} The mutation result
 */
export function useClaimReward() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (claimData) => points.claimReward(claimData),
    onSuccess: (data, variables) => {
      if (variables.userId) {
        // Invalidate relevant queries
        queryClient.invalidateQueries(['rewards', 'claims', 'user', variables.userId]);
        queryClient.invalidateQueries(['points', 'transactions', 'user', variables.userId]);
        queryClient.invalidateQueries(['points', 'summary', 'user', variables.userId]);
      }
    }
  });
}