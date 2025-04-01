import { points } from '@/lib/airtable/entities';
import { auth0 } from '@/lib/auth0';

/**
 * API endpoint to claim a reward
 * Uses the new domain-driven Airtable architecture
 * 
 * @param {object} req - Next.js request object
 * @param {object} res - Next.js response object
 */
export default async function handler(req, res) {
  try {
    // Get Auth0 session and validate user is authenticated
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({
        error: 'Not authenticated'
      });
    }
    const { user } = session;

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { rewardId, deliveryDetails } = req.body;

    // Validate required field
    if (!rewardId) {
      return res.status(400).json({ error: 'Reward ID is required' });
    }

    // Get the user's points balance
    const pointsSummary = await points.getUserPointsSummary(user.sub);
    
    if (!pointsSummary) {
      return res.status(400).json({ 
        error: 'No points record found for user' 
      });
    }

    // Get all rewards and find the one we need
    const allRewards = await points.getRewardItems();
    const reward = allRewards.find(r => r.id === rewardId);
    
    if (!reward) {
      return res.status(404).json({ error: 'Reward not found' });
    }
    
    // Check if user has enough points
    if (pointsSummary.available < reward.pointsCost) {
      return res.status(400).json({ 
        error: 'Insufficient points to claim this reward',
        availablePoints: pointsSummary.available,
        requiredPoints: reward.pointsCost
      });
    }

    // Claim the reward
    const claimData = {
      userId: user.sub,
      rewardId: rewardId,
      deliveryDetails: deliveryDetails || ''
    };
    
    const claimedReward = await points.claimReward(claimData);
    
    if (!claimedReward) {
      return res.status(500).json({ error: 'Failed to claim reward' });
    }
    
    // Get updated points summary after the claim
    const updatedPointsSummary = await points.getUserPointsSummary(user.sub);

    return res.status(200).json({
      success: true,
      claimed: claimedReward,
      reward: reward,
      pointsRemaining: updatedPointsSummary.available
    });
  } catch (error) {
    console.error('Error claiming reward:', error);
    return res.status(500).json({
      error: 'An error occurred while claiming the reward',
      message: error.message,
      details: error.details || {}
    });
  }
}