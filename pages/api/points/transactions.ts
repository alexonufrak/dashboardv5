import { NextApiRequest, NextApiResponse } from 'next';
import { queryRecords, TABLES } from '@/lib/airtableClient';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { PointTransaction } from '@/types/dashboard';

/**
 * API endpoint for fetching point transactions with optional filtering
 * GET /api/points/transactions - Get all transactions
 * GET /api/points/transactions?contactId=123 - Get transactions for a specific contact
 * GET /api/points/transactions?teamId=456 - Get transactions for a specific team
 * GET /api/points/transactions?contactId=123&teamId=456 - Get transactions for a specific contact in a specific team
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

    // Get query parameters for filtering
    const { contactId, teamId } = req.query;
    
    // Construct filter formula based on provided parameters
    let filterFormula: string | undefined;
    if (contactId && teamId) {
      // Both contact and team filters
      filterFormula = `AND({contactId} = '${contactId}', {teamid} = '${teamId}')`;
    } else if (contactId) {
      // Just contact filter
      filterFormula = `{contactId} = '${contactId}'`;
    } else if (teamId) {
      // Just team filter
      filterFormula = `{teamid} = '${teamId}'`;
    }
    
    // Set a fallback array in case TABLES.TRANSACTIONS doesn't exist
    let pointsRecords: any[] = [];
    
    // Check if we have the transactions table configured
    if (TABLES.TRANSACTIONS) {
      // Query the Point Transactions table
      pointsRecords = await queryRecords('TRANSACTIONS', filterFormula, {
        // Sort by date in descending order (newest first)
        sort: [{ field: 'Date', direction: 'desc' }],
        fields: [
          'Ledger ID', // ID field
          'Date',
          'Description',
          'Points Value (from Achievements)', // Points value
          'Name (from Achievements)', // Achievement name
          'Type (from Achievements)', // Achievement type
          'contactId', // Contact ID
          'teamid', // Team ID
          'Achievements',
          'Contacts',
          'Teams'
        ],
      });
    }
    
    // Transform the Airtable records to our PointTransaction interface
    const transactions: PointTransaction[] = pointsRecords.map((record) => {
      return {
        id: record['Ledger ID'] || record.id,
        date: record['Date'] || '',
        description: record['Description'] || '',
        achievementId: record['Achievements'] ? 
          Array.isArray(record['Achievements']) ? 
            record['Achievements'][0] : 
            record['Achievements'] : 
          undefined,
        achievementName: Array.isArray(record['Name (from Achievements)']) ? 
          record['Name (from Achievements)'][0] : 
          record['Name (from Achievements)'] || '',
        pointsValue: Array.isArray(record['Points Value (from Achievements)']) ? 
          record['Points Value (from Achievements)'][0] as number || 0 : 
          record['Points Value (from Achievements)'] as number || 0,
        contactId: Array.isArray(record['contactId']) ? 
          record['contactId'][0] : 
          record['contactId'] || '',
        contactName: record['Contacts'] ? 
          Array.isArray(record['Contacts']) ? 
            record['Contacts'][0] : 
            record['Contacts'] : 
          '',
        teamId: Array.isArray(record['teamid']) ? 
          record['teamid'][0] : 
          record['teamid'] || '',
        teamName: record['Teams'] ? 
          Array.isArray(record['Teams']) ? 
            record['Teams'][0] : 
            record['Teams'] : 
          '',
        type: Array.isArray(record['Type (from Achievements)']) ? 
          record['Type (from Achievements)'][0] : 
          record['Type (from Achievements)'] || '',
      };
    });

    // Return the transactions array
    return res.status(200).json({ transactions });
  } catch (error) {
    console.error('Error fetching point transactions:', error);
    return res.status(500).json({ error: 'Failed to fetch point transactions' });
  }
});