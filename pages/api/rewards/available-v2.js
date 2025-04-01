import { points } from '@/lib/airtable/entities';
import { auth0 } from '@/lib/auth0';

/**
 * API endpoint to fetch available rewards for a user
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

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get the user's points balance
    const pointsSummary = await points.getUserPointsSummary(user.sub);
    
    if (!pointsSummary) {
      return res.status(200).json({
        success: true,
        availablePoints: 0,
        rewards: [],
        claimedRewards: []
      });
    }
    
    // Get all available rewards
    const allRewards = await points.getRewardItems();
    
    // Get user's claimed rewards
    const claimedRewards = await points.getUserClaimedRewards(user.sub);
    
    // Filter rewards that the user can afford with their current points
    const affordableRewards = allRewards.filter(reward => 
      reward.pointsCost <= pointsSummary.available
    );
    
    // Group rewards by category
    const rewardsByCategory = allRewards.reduce((acc, reward) => {
      const category = reward.category || 'General';
      
      if (!acc[category]) {
        acc[category] = [];
      }
      
      acc[category].push(reward);
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      availablePoints: pointsSummary.available,
      totalPoints: pointsSummary.total,
      rewards: {
        all: allRewards,
        affordable: affordableRewards,
        byCategory: rewardsByCategory
      },
      claimedRewards: claimedRewards
    });
  } catch (error) {
    console.error('Error fetching available rewards:', error);
    return res.status(500).json({
      error: 'An error occurred while fetching available rewards',
      message: error.message,
      details: error.details || {}
    });
  }
}