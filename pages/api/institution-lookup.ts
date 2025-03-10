import { NextApiRequest, NextApiResponse } from 'next';
import { lookupInstitutionByEmail } from '../../lib/airtableClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Extract domain from email (everything after @)
    const domainMatch = email.match(/@(.+)$/);
    if (!domainMatch || !domainMatch[1]) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Look up institution by email domain
    const institution = await lookupInstitutionByEmail(email);
    
    if (institution) {
      // Found a matching institution
      return res.status(200).json({
        success: true,
        institution: {
          id: institution.id,
          name: institution.name,
          domains: institution.domains
        }
      });
    } else {
      // No matching institution found
      return res.status(200).json({
        success: false,
        message: 'No institution found for this email domain'
      });
    }
  } catch (error) {
    console.error('Error in institution lookup:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}