import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import type { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSession(req, res);
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Mock participation data
    const mockParticipationData = {
      participation: [
        {
          id: "p1",
          cohort: {
            id: "c1",
            name: "Spring 2025",
            'Current Cohort': true,
            'Is Current': true,
            initiativeDetails: {
              id: "i1",
              name: "AI for Good Program",
              'Participation Type': "Team"
            },
            participationType: "Team"
          },
          teamId: "t1"
        },
        {
          id: "p2",
          cohort: {
            id: "c2",
            name: "Fall 2024",
            'Current Cohort': false,
            'Is Current': false,
            initiativeDetails: {
              id: "i2",
              name: "Data Science Fellowship",
              'Participation Type': "Individual"
            },
            participationType: "Individual"
          },
          teamId: null
        }
      ]
    };
    
    return res.status(200).json(mockParticipationData);
  } catch (error: any) {
    console.error('Participation API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export default withApiAuthRequired(handler);