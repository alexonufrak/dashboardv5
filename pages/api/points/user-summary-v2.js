import { points } from '@/lib/airtable/entities';
import { auth0 } from '@/lib/auth0';

/**
 * API endpoint to fetch user points summary
 * Demonstrates using the new modular Airtable architecture
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

    // The points module automatically handles caching
    const pointsSummary = await points.getUserPointsSummary(user.sub);
    
    // Get the user's claimed rewards
    const claimedRewards = await points.getUserClaimedRewards(user.sub);
    
    // Get all available rewards
    const availableRewards = await points.getRewardItems();
    
    // Filter rewards that the user can afford
    const affordableRewards = availableRewards.filter(
      reward => reward.pointsCost <= pointsSummary.available
    );

    return res.status(200).json({
      success: true,
      summary: {
        total: pointsSummary.total,
        spent: pointsSummary.spent,
        available: pointsSummary.available
      },
      // Only return the most recent transactions (limit to 10)
      recentTransactions: pointsSummary.transactions.slice(0, 10),
      rewards: {
        claimed: claimedRewards,
        affordable: affordableRewards,
        all: availableRewards
      }
    });
  } catch (error) {
    console.error('Error fetching user points summary:', error);
    return res.status(500).json({
      error: 'An error occurred while fetching user points summary',
      message: error.message,
      details: error.details || {}
    });
  }
}