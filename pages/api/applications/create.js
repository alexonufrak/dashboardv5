import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0'
import { getUserProfile, base } from '@/lib/airtable'

/**
 * API handler to create a new application
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
export default withApiAuthRequired(async function createApplicationHandler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the user session
    const session = await getSession(req, res)
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    
    // Get the request body containing application data
    const { cohortId, teamId, participationType } = req.body
    
    if (!cohortId) {
      return res.status(400).json({ error: 'Cohort ID is required' })
    }
    
    // Only require team ID for team applications
    // We get the participation type from the client to avoid having to re-fetch the cohort
    if (participationType === 'Team' && !teamId) {
      return res.status(400).json({ error: 'Team ID is required for team applications' })
    }
    
    // Get user profile from Airtable
    const userProfile = await getUserProfile(session.user.sub, session.user.email)
    
    if (!userProfile || !userProfile.contactId) {
      return res.status(404).json({ error: 'User profile not found' })
    }
    
    // Use the imported base from lib/airtable.js
    
    // Get the Applications table ID from environment variables
    const applicationsTableId = process.env.AIRTABLE_APPLICATIONS_TABLE_ID
    if (!applicationsTableId) {
      return res.status(500).json({ error: 'Applications table ID not configured' })
    }
    
    // Initialize the applications table
    const applicationsTable = base(applicationsTableId)
    
    // Create the application record
    console.log(`Creating application for contact ${userProfile.contactId}, cohort ${cohortId}, team ${teamId}`)
    
    // Prepare application data - using only the current field names
    const applicationData = {
      'Contact': [userProfile.contactId],
      'Cohort': [cohortId],
      'Status': 'Submitted',
      'Submission Date': new Date().toISOString()
    }
    
    // If team ID is provided, add it to the application
    if (teamId) {
      applicationData['Team'] = [teamId]
    }
    
    // Create the application record
    const applicationRecord = await applicationsTable.create(applicationData)
    
    // Check if application was created successfully
    if (!applicationRecord || !applicationRecord.id) {
      throw new Error('Failed to create application record')
    }
    
    // Return success response
    return res.status(201).json({
      id: applicationRecord.id,
      status: 'Submitted',
      contactId: userProfile.contactId,
      cohortId: cohortId,
      teamId: teamId,
      submissionDate: applicationRecord.fields['Submission Date']
    })
  } catch (error) {
    console.error('Error creating application:', error)
    console.error('Error details:', error.message, error.stack)
    
    // Check for specific Airtable error types for better error messages
    if (error.statusCode === 422) {
      return res.status(422).json({ error: 'Invalid field data in application creation. Please check field names match the Airtable schema.' })
    } else if (error.statusCode === 404) {
      return res.status(404).json({ error: 'Applications table not found. Please check environment variables.' })
    } else if (error.statusCode === 403) {
      return res.status(403).json({ error: 'Permission denied to create application. Please check API key permissions.' })
    }
    
    return res.status(500).json({ error: 'Failed to create application: ' + error.message })
  }
})