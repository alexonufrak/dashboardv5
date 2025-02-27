import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const institutionsTable = process.env.AIRTABLE_INSTITUTIONS_TABLE_ID 
  ? base(process.env.AIRTABLE_INSTITUTIONS_TABLE_ID) 
  : null;

export default async function handler(req, res) {
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

    const domain = domainMatch[1];
    
    // Check if institutions table is initialized
    if (!institutionsTable) {
      return res.status(500).json({ error: 'Institutions table not configured' });
    }

    // Search for institutions with this domain
    // We're looking for institutions where the Domains field (an array) contains the domain
    const records = await institutionsTable.select({
      filterByFormula: `FIND("${domain}", {Domains})`,
      fields: ['Name', 'Domains'],
      maxRecords: 1
    }).firstPage();

    if (records && records.length > 0) {
      // Found a matching institution
      return res.status(200).json({
        success: true,
        institution: {
          id: records[0].id,
          name: records[0].fields.Name,
          domains: records[0].fields.Domains
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