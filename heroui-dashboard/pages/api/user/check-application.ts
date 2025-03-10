import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import type { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSession(req, res);
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Mock applications data
    const mockApplicationsData = {
      applications: [
        {
          id: "a1",
          status: "approved",
          programId: "i1",
          programName: "AI for Good Program",
          cohortId: "c1",
          cohortName: "Spring 2025",
          submittedDate: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString()
        }
      ]
    };
    
    return res.status(200).json(mockApplicationsData);
  } catch (error: any) {
    console.error('Applications API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export default withApiAuthRequired(handler);