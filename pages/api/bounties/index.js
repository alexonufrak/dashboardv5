import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0'
import { getBaseTable, findRecordsByIdList, getSingleRecord } from '@/lib/airtable'
import { getUserProfile } from '@/lib/userProfile'

/**
 * API endpoint to fetch bounties from Airtable
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 */
export default withApiAuthRequired(async function handler(req, res) {
  try {
    const session = await getSession(req, res)
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // Get user profile data
    const userProfile = await getUserProfile(session.user)
    if (!userProfile) {
      return res.status(400).json({ error: 'User profile not found' })
    }

    // Get program ID from query parameter
    const { programId } = req.query
    if (!programId) {
      return res.status(400).json({ error: 'Program ID is required' })
    }

    // Initialize Airtable base
    const baseTable = getBaseTable('Bounties')
    
    // Construct filter based on programId and visibility
    // For now, just return all bounties for testing - in production this should filter by program
    const formula = `OR(Visibility = 'Public', Visibility = 'Published')`

    // Fetch bounties from Airtable
    const records = await baseTable.select({
      view: 'Grid view',
      filterByFormula: formula,
      sort: [{ field: 'Last Modified', direction: 'desc' }],
    }).all()

    // Map and return the bounties
    const bounties = records.map(record => ({
      id: record.id,
      title: record.fields.Title,
      classification: record.fields.Classification,
      status: record.fields.Status,
      prizeType: record.fields['Prize Type'],
      prizeValue: record.fields['Prize Value'],
      internshipTitle: record.fields['Internship Title'],
      internshipCompensation: record.fields['Internship Compensation'],
      internshipRequirements: record.fields['Internship Requirements'],
      internshipDescription: record.fields['Internship Description'],
      internshipOrganization: record.fields['Internship Organization'],
      organization: record.fields['Organization']?.[0] || null,
      description: record.fields['Additional Comments'],
      deliverables: record.fields['Deliverables'],
      submitter: record.fields['Submitter'],
      lastModified: record.fields['Last Modified'],
      visibility: record.fields['Visibility'],
    }))

    // Send the response
    res.status(200).json({ data: bounties })
  } catch (error) {
    console.error('Error fetching bounties:', error)
    res.status(500).json({ error: 'Failed to fetch bounties', details: error.message })
  }
})