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

    console.log(`Looking up institution for domain: "${domain}"`);
    
    // For better performance with many institutions, try to filter down the query first with FIND
    // This will give us candidates that might contain the domain as a substring
    const recordsQuery = await institutionsTable.select({
      fields: ['Name', 'Domains'],
      filterByFormula: `OR(FIND("${domain},", {Domains}), FIND("${domain}", {Domains}))`
    }).firstPage();
    
    console.log(`Pre-filtered ${recordsQuery.length} institutions that might contain domain`);
    
    // If no results from the pre-filter, try to get all records as a fallback
    const records = recordsQuery.length > 0 ? recordsQuery : 
      await institutionsTable.select({
        fields: ['Name', 'Domains'],
      }).firstPage();
    
    console.log(`Found ${records.length} total institutions to check`);
    
    // Filter records manually to match exact domains
    const matchingRecords = records.filter(record => {
      if (!record.fields.Domains) return false;
      
      // Get the domains string
      const domainsString = record.fields.Domains;
      console.log(`Institution: ${record.fields.Name}, Domains: ${domainsString}`);
      
      // Split domains by comma and trim whitespace
      const domainList = domainsString.split(',').map(d => d.trim());
      
      // Log the domains list for debugging
      console.log(`Parsed domains list: ${JSON.stringify(domainList)}`);
      
      // Check if the domain matches exactly with any domain in the list
      const matches = domainList.includes(domain);
      if (matches) {
        console.log(`✓ MATCH FOUND: ${domain} in ${record.fields.Name}`);
      }
      return matches;
    });

    if (matchingRecords && matchingRecords.length > 0) {
      // Found a matching institution
      return res.status(200).json({
        success: true,
        institution: {
          id: matchingRecords[0].id,
          name: matchingRecords[0].fields.Name,
          domains: matchingRecords[0].fields.Domains
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