import { executeQuery, getCachedOrFetch, handleAirtableError } from '../core';
import * as tables from '../tables';

/**
 * Fetches points transactions for a specific user
 * @param {string} userId - The Auth0 ID of the user
 * @returns {Promise<Array<Object>>} Array of points transactions
 */
export async function fetchUserPointsTransactions(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const response = await executeQuery({
      table: tables.POINTS_TRANSACTIONS,
      operation: 'select',
      params: {
        filterByFormula: `{User Auth0 ID} = '${userId}'`,
        sort: [{ field: 'Created Time', direction: 'desc' }]
      }
    });

    return response ? response.map(normalizePointsTransaction) : [];
  } catch (error) {
    throw handleAirtableError(error, 'Error fetching user points transactions', { userId });
  }
}

/**
 * Fetches points transactions for a specific team
 * @param {string} teamId - The ID of the team
 * @returns {Promise<Array<Object>>} Array of points transactions
 */
export async function fetchTeamPointsTransactions(teamId) {
  if (!teamId) {
    throw new Error('Team ID is required');
  }

  try {
    const response = await executeQuery({
      table: tables.POINTS_TRANSACTIONS,
      operation: 'select',
      params: {
        filterByFormula: `{Team Record ID} = '${teamId}'`,
        sort: [{ field: 'Created Time', direction: 'desc' }]
      }
    });

    return response ? response.map(normalizePointsTransaction) : [];
  } catch (error) {
    throw handleAirtableError(error, 'Error fetching team points transactions', { teamId });
  }
}

/**
 * Creates a new points transaction
 * @param {Object} transactionData - Data for the new transaction
 * @returns {Promise<Object>} The created transaction record
 */
export async function createPointsTransaction(transactionData) {
  if (!transactionData.userId && !transactionData.teamId) {
    throw new Error('Either userId or teamId is required for points transaction');
  }
  
  if (!transactionData.points) {
    throw new Error('Points amount is required for transaction');
  }

  if (!transactionData.type) {
    throw new Error('Transaction type is required');
  }

  try {
    const fields = {
      'Points': transactionData.points,
      'Type': transactionData.type,
      'Description': transactionData.description || '',
      'Status': transactionData.status || 'Completed'
    };

    // Add either user or team fields
    if (transactionData.userId) {
      fields['User Auth0 ID'] = transactionData.userId;
    }

    if (transactionData.teamId) {
      fields['Team Record ID'] = transactionData.teamId;
    }

    if (transactionData.initiativeId) {
      fields['Initiative Record ID'] = transactionData.initiativeId;
    }

    if (transactionData.cohortId) {
      fields['Cohort Record ID'] = transactionData.cohortId;
    }

    if (transactionData.milestoneId) {
      fields['Milestone Record ID'] = transactionData.milestoneId;
    }

    const response = await executeQuery({
      table: tables.POINTS_TRANSACTIONS,
      operation: 'create',
      data: { fields }
    });

    return response ? normalizePointsTransaction(response) : null;
  } catch (error) {
    throw handleAirtableError(error, 'Error creating points transaction', { transactionData });
  }
}

/**
 * Fetches all reward items available
 * @returns {Promise<Array<Object>>} Array of reward items
 */
export async function fetchRewardItems() {
  try {
    const response = await executeQuery({
      table: tables.REWARDS,
      operation: 'select',
      params: {
        filterByFormula: `{Status} = 'Available'`,
        sort: [{ field: 'Points Cost', direction: 'asc' }]
      }
    });

    return response ? response.map(normalizeRewardItem) : [];
  } catch (error) {
    throw handleAirtableError(error, 'Error fetching reward items');
  }
}

/**
 * Fetches user's claimed rewards
 * @param {string} userId - The Auth0 ID of the user
 * @returns {Promise<Array<Object>>} Array of claimed reward records
 */
export async function fetchUserClaimedRewards(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const response = await executeQuery({
      table: tables.REWARD_CLAIMS,
      operation: 'select',
      params: {
        filterByFormula: `{User Auth0 ID} = '${userId}'`,
        sort: [{ field: 'Created Time', direction: 'desc' }]
      }
    });

    return response ? response.map(normalizeRewardClaim) : [];
  } catch (error) {
    throw handleAirtableError(error, 'Error fetching user claimed rewards', { userId });
  }
}

/**
 * Claims a reward for a user
 * @param {Object} claimData - Data for the reward claim
 * @returns {Promise<Object>} The created reward claim record
 */
export async function claimReward(claimData) {
  if (!claimData.userId) {
    throw new Error('User ID is required for claiming a reward');
  }
  
  if (!claimData.rewardId) {
    throw new Error('Reward ID is required for claiming a reward');
  }

  try {
    // First fetch the reward to get its point cost
    const reward = await executeQuery({
      table: tables.REWARDS,
      operation: 'find',
      id: claimData.rewardId
    });

    if (!reward) {
      throw new Error('Reward not found');
    }

    const pointsCost = reward.fields['Points Cost'] || 0;

    // Create the reward claim
    const fields = {
      'User Auth0 ID': claimData.userId,
      'Reward Record ID': claimData.rewardId,
      'Points Used': pointsCost,
      'Status': 'Pending',
      'Delivery Details': claimData.deliveryDetails || ''
    };

    // Create the claim
    const claimResponse = await executeQuery({
      table: tables.REWARD_CLAIMS,
      operation: 'create',
      data: { fields }
    });

    // Create a points transaction for the claim
    await createPointsTransaction({
      userId: claimData.userId,
      points: -pointsCost, // Negative points for a deduction
      type: 'Reward Claim',
      description: `Claimed: ${reward.fields['Name'] || 'Unknown reward'}`,
      status: 'Completed'
    });

    return claimResponse ? normalizeRewardClaim(claimResponse) : null;
  } catch (error) {
    throw handleAirtableError(error, 'Error claiming reward', { claimData });
  }
}

/**
 * Calculates user's total points from transactions
 * @param {string} userId - The Auth0 ID of the user
 * @returns {Promise<Object>} Points summary with total, available, and spent
 */
export async function calculateUserPoints(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const transactions = await fetchUserPointsTransactions(userId);
    
    let totalPoints = 0;
    let spentPoints = 0;
    
    transactions.forEach(transaction => {
      if (transaction.status === 'Completed') {
        if (transaction.points > 0) {
          totalPoints += transaction.points;
        } else {
          spentPoints += Math.abs(transaction.points);
        }
      }
    });
    
    const availablePoints = totalPoints - spentPoints;
    
    return {
      total: totalPoints,
      spent: spentPoints,
      available: availablePoints,
      transactions: transactions
    };
  } catch (error) {
    throw handleAirtableError(error, 'Error calculating user points', { userId });
  }
}

/**
 * Gets user's points transactions with caching
 * @param {string} userId - The Auth0 ID of the user
 * @returns {Promise<Array<Object>>} Array of points transactions
 */
export async function getUserPointsTransactions(userId) {
  return getCachedOrFetch(`user_points_${userId}`, () => fetchUserPointsTransactions(userId));
}

/**
 * Gets team's points transactions with caching
 * @param {string} teamId - The ID of the team
 * @returns {Promise<Array<Object>>} Array of points transactions
 */
export async function getTeamPointsTransactions(teamId) {
  return getCachedOrFetch(`team_points_${teamId}`, () => fetchTeamPointsTransactions(teamId));
}

/**
 * Gets available reward items with caching
 * @returns {Promise<Array<Object>>} Array of reward items
 */
export async function getRewardItems() {
  return getCachedOrFetch('reward_items', () => fetchRewardItems());
}

/**
 * Gets user's claimed rewards with caching
 * @param {string} userId - The Auth0 ID of the user
 * @returns {Promise<Array<Object>>} Array of claimed reward records
 */
export async function getUserClaimedRewards(userId) {
  return getCachedOrFetch(`user_rewards_${userId}`, () => fetchUserClaimedRewards(userId));
}

/**
 * Gets user's points summary with caching
 * @param {string} userId - The Auth0 ID of the user
 * @returns {Promise<Object>} Points summary with total, available, and spent
 */
export async function getUserPointsSummary(userId) {
  return getCachedOrFetch(`user_points_summary_${userId}`, () => calculateUserPoints(userId));
}

/**
 * Normalizes a points transaction record from Airtable format to a consistent application format
 * @param {Object} record - The Airtable record
 * @returns {Object} Normalized points transaction object
 */
function normalizePointsTransaction(record) {
  if (!record || !record.fields) {
    return null;
  }

  const fields = record.fields;
  
  return {
    id: record.id,
    points: fields['Points'] || 0,
    type: fields['Type'] || 'Unknown',
    description: fields['Description'] || '',
    status: fields['Status'] || 'Pending',
    userId: fields['User Auth0 ID'] || null,
    userName: fields['User Name'] || null,
    teamId: fields['Team Record ID'] || null,
    teamName: fields['Team Name'] || null,
    initiativeId: fields['Initiative Record ID'] || null,
    initiativeName: fields['Initiative Name'] || null,
    cohortId: fields['Cohort Record ID'] || null,
    cohortName: fields['Cohort Name'] || null,
    milestoneId: fields['Milestone Record ID'] || null,
    milestoneName: fields['Milestone Name'] || null,
    createdTime: fields['Created Time'] || null
  };
}

/**
 * Normalizes a reward item record from Airtable format to a consistent application format
 * @param {Object} record - The Airtable record
 * @returns {Object} Normalized reward item object
 */
function normalizeRewardItem(record) {
  if (!record || !record.fields) {
    return null;
  }

  const fields = record.fields;
  
  return {
    id: record.id,
    name: fields['Name'] || 'Unnamed Reward',
    description: fields['Description'] || '',
    pointsCost: fields['Points Cost'] || 0,
    category: fields['Category'] || 'General',
    status: fields['Status'] || 'Available',
    imageUrl: fields['Image'] && fields['Image'].length > 0 ? fields['Image'][0].url : null,
    inventoryCount: fields['Inventory Count'] || 0,
    isLimited: fields['Is Limited'] || false,
    initiativeId: fields['Initiative Record ID'] || null,
    initiativeName: fields['Initiative Name'] || null
  };
}

/**
 * Normalizes a reward claim record from Airtable format to a consistent application format
 * @param {Object} record - The Airtable record
 * @returns {Object} Normalized reward claim object
 */
function normalizeRewardClaim(record) {
  if (!record || !record.fields) {
    return null;
  }

  const fields = record.fields;
  
  return {
    id: record.id,
    userId: fields['User Auth0 ID'] || null,
    userName: fields['User Name'] || null,
    rewardId: fields['Reward Record ID'] || null,
    rewardName: fields['Reward Name'] || 'Unknown Reward',
    pointsUsed: fields['Points Used'] || 0,
    status: fields['Status'] || 'Pending',
    deliveryDetails: fields['Delivery Details'] || '',
    fulfilledDate: fields['Fulfilled Date'] || null,
    createdTime: fields['Created Time'] || null
  };
}