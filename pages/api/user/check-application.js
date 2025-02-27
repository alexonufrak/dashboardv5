import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { base } from '../../../lib/airtable';

/**
 * API endpoint to check if a user has applied to a specific cohort
 */
export default withApiAuthRequired(async function checkApplication(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cohortId, contactId } = req.query;
    
    if (!cohortId || !contactId) {
      return res.status(400).json({
        error: 'Missing required parameters',
        hasApplied: false
      });
    }

    // Initialize Applications table
    const applicationsTable = process.env.AIRTABLE_APPLICATIONS_TABLE_ID
      ? base(process.env.AIRTABLE_APPLICATIONS_TABLE_ID)
      : null;

    if (!applicationsTable) {
      console.error("Applications table not configured");
      return res.status(500).json({
        error: 'Applications table not configured',
        hasApplied: false
      });
    }

    // Look for applications with matching contactId and cohortId
    const records = await applicationsTable.select({
      filterByFormula: `AND({Contact} = "${contactId}", {Cohort} = "${cohortId}")`,
      maxRecords: 1
    }).firstPage();

    // Return whether user has applied
    return res.status(200).json({
      hasApplied: records.length > 0
    });
  } catch (error) {
    console.error('Error checking application:', error);
    return res.status(500).json({
      error: 'Failed to check application',
      hasApplied: false
    });
  }
});