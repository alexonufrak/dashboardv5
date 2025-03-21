import { auth0 } from '@/lib/auth0'
import { base } from '@/lib/airtable'
import { getCompleteUserProfile } from '@/lib/userProfile'

/**
 * API endpoint to fetch bounties from Airtable
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 */
export default async function handler(req, res) {
  try {
    const session = await auth0.getSession(req)
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // Get user profile data
    const userProfile = await getCompleteUserProfile(session.user)
    if (!userProfile) {
      return res.status(400).json({ error: 'User profile not found' })
    }

    // Get program ID from query parameter
    const { programId } = req.query
    if (!programId) {
      return res.status(400).json({ error: 'Program ID is required' })
    }

    // Initialize Airtable base and get bounties table
    const bountiesTable = base(process.env.AIRTABLE_BOUNTIES_TABLE_ID || 'Bounties')
    
    // Construct filter based on programId and visibility
    // For now, just return all bounties for testing - in production this should filter by program
    const formula = `OR(Visibility = 'Public', Visibility = 'Published')`

    // Fetch bounties from Airtable
    const records = await bountiesTable.select({
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

    // Add cache control headers - cache for 10 minutes on server, 5 minutes on client
    // Bounties don't change frequently
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=1800');
    
    // Send the response
    res.status(200).json({ 
      data: bounties,
      _meta: {
        timestamp: new Date().toISOString(),
        programId,
        count: bounties.length
      }
    })
  } catch (error) {
    console.error('Error fetching bounties:', error)
    res.status(500).json({ error: 'Failed to fetch bounties', details: error.message })
  }
}