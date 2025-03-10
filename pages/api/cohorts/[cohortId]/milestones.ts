import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import type { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSession(req, res);
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { cohortId } = req.query;
    
    if (!cohortId || typeof cohortId !== 'string') {
      return res.status(400).json({ error: 'Invalid cohort ID' });
    }
    
    // Get the current date for generating relative dates
    const now = new Date();
    
    // Mock milestone data based on cohort ID
    let milestones: {
      id: string;
      name: string;
      number: number;
      dueDate: string;
      description: string;
      status: string;
      progress: number;
      completedDate: string | null;
      score: number | null;
      cohortId: string;
    }[] = [];
    
    // Create milestones for the AI for Good Program (cohort c1)
    if (cohortId === 'c1') {
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      
      const twoWeeksAgo = new Date(now);
      twoWeeksAgo.setDate(now.getDate() - 14);
      
      const twoWeeksFromNow = new Date(now);
      twoWeeksFromNow.setDate(now.getDate() + 14);
      
      const sixWeeksFromNow = new Date(now);
      sixWeeksFromNow.setDate(now.getDate() + 42);
      
      milestones = [
        {
          id: "m1",
          name: "Project Kickoff",
          number: 1,
          dueDate: oneMonthAgo.toISOString(),
          description: "Team formation and project ideation phase",
          status: "completed",
          progress: 100,
          completedDate: twoWeeksAgo.toISOString(),
          score: 95,
          cohortId: "c1"
        },
        {
          id: "m2",
          name: "Initial Prototype",
          number: 2,
          dueDate: twoWeeksFromNow.toISOString(),
          description: "Develop and submit your initial prototype",
          status: "in-progress",
          progress: 60,
          completedDate: null,
          score: null,
          cohortId: "c1"
        },
        {
          id: "m3",
          name: "Final Presentation",
          number: 3,
          dueDate: sixWeeksFromNow.toISOString(),
          description: "Present your final project to the judges",
          status: "upcoming",
          progress: 0,
          completedDate: null,
          score: null,
          cohortId: "c1"
        }
      ];
    }
    // Create milestones for the Data Science Fellowship (cohort c2)
    else if (cohortId === 'c2') {
      const twoMonthsAgo = new Date(now);
      twoMonthsAgo.setMonth(now.getMonth() - 2);
      
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
      
      milestones = [
        {
          id: "m4",
          name: "Data Collection",
          number: 1,
          dueDate: twoMonthsAgo.toISOString(),
          description: "Collect and clean your dataset",
          status: "completed",
          progress: 100,
          completedDate: twoMonthsAgo.toISOString(),
          score: 90,
          cohortId: "c2"
        },
        {
          id: "m5",
          name: "Model Development",
          number: 2,
          dueDate: oneMonthAgo.toISOString(),
          description: "Develop your predictive model",
          status: "completed",
          progress: 100,
          completedDate: oneMonthAgo.toISOString(), 
          score: 85,
          cohortId: "c2"
        }
      ];
    } else {
      // Return empty milestones for unknown cohort
      milestones = [];
    }
    
    return res.status(200).json({ milestones });
  } catch (error: any) {
    console.error('Milestones API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export default withApiAuthRequired(handler);