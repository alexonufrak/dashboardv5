import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import type { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSession(req, res);
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Mock teams data
    const mockTeamsData = [
      {
        id: "t1",
        name: "Innovation Squad",
        members: [
          {
            id: session.user.sub,
            name: session.user.name || 'Current User',
            email: session.user.email,
            role: "Team Lead",
            avatar: session.user.picture
          },
          {
            id: "m2",
            name: "Alex Johnson",
            email: "alex.johnson@example.com",
            role: "Member",
            avatar: null
          },
          {
            id: "m3",
            name: "Jamie Smith",
            email: "jamie.smith@example.com",
            role: "Member",
            avatar: null
          }
        ],
        cohortIds: ["c1"],
        fields: {
          Submissions: [],
          Description: "A team focused on developing innovative AI solutions for social good."
        }
      }
    ];
    
    return res.status(200).json(mockTeamsData);
  } catch (error: any) {
    console.error('Teams API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export default withApiAuthRequired(handler);