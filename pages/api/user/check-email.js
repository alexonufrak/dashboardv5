import { getSession } from '@auth0/nextjs-auth0';
import { base } from '../../../lib/airtable';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required',
        exists: false
      });
    }

    // Search Airtable for a contact with matching email
    const records = await base('Contacts').select({
      filterByFormula: `{Email} = "${email}"`,
      maxRecords: 1
    }).firstPage();

    const userExists = records.length > 0;

    return res.status(200).json({ 
      exists: userExists,
      message: userExists ? 'User exists' : 'User does not exist'
    });
  } catch (error) {
    console.error('Error checking user:', error);
    return res.status(500).json({ 
      error: 'Failed to check user',
      exists: false
    });
  }
}