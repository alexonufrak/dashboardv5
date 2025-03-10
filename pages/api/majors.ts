import { NextApiRequest, NextApiResponse } from 'next';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { queryRecords, TABLES } from '@/lib/airtableClient';

/**
 * API endpoint for fetching majors
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSession(req, res);
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Fetch majors from Airtable
    if (TABLES.MAJORS) {
      try {
        const majors = await queryRecords('MAJORS', undefined, {
          fields: ['Name', 'Category', 'Active'],
          sort: [{ field: 'Name', direction: 'asc' }]
        });
        
        // Format the majors data for the frontend
        const formattedMajors = majors
          .filter((major: { Active?: boolean; id: string; Name?: string; Category?: string }) => 
            major.Active !== false) // Only include active majors
          .map((major: { Active?: boolean; id: string; Name?: string; Category?: string }) => ({
            id: major.id,
            name: major.Name || '',
            category: major.Category || 'Other'
          }));
        
        return res.status(200).json({ majors: formattedMajors });
      } catch (airtableError) {
        console.error('Error fetching majors from Airtable:', airtableError);
        // If there's an error with Airtable, return an empty array
        return res.status(200).json({ majors: [] });
      }
    } else {
      // If MAJORS table ID is not configured, return an empty array
      console.warn('AIRTABLE_MAJORS_TABLE_ID not configured');
      return res.status(200).json({ majors: [] });
    }
  } catch (error: any) {
    console.error('Majors API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export default withApiAuthRequired(handler);