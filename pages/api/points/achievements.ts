import { NextApiRequest, NextApiResponse } from 'next';
import { queryRecords, TABLES } from '@/lib/airtableClient';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { Achievement } from '@/types/dashboard';

/**
 * API endpoint for fetching achievements
 * GET /api/points/achievements - Get all achievements
 */
export default withApiAuthRequired(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the current user session
    const session = await getSession(req, res);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Set a fallback array in case TABLES.ACHIEVEMENTS doesn't exist
    let achievementRecords: any[] = [];
    
    // Check if we have the achievements table configured
    if (TABLES.ACHIEVEMENTS) {
      // Use the queryRecords function from airtableClient
      achievementRecords = await queryRecords('ACHIEVEMENTS', undefined, {
        // Sort by points value in descending order
        sort: [{ field: 'Points Value', direction: 'desc' }],
        fields: [
          'Achievement ID',
          'Name',
          'Description',
          'Points Value',
          'Type',
        ],
      });
    }

    // Transform the Airtable records to our Achievement interface
    const achievements: Achievement[] = achievementRecords.map((record) => {
      return {
        id: record['Achievement ID'] || record.id,
        name: record['Name'] || 'Unknown Achievement',
        description: record['Description'] || '',
        pointsValue: record['Points Value'] as number || 0,
        type: record['Type'] || 'default',
      };
    });

    // Return the achievements array
    return res.status(200).json({ achievements });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});