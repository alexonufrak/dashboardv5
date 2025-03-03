import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0'
import { getUserProfile, base, getTeamById, lookupInstitutionByEmail } from '@/lib/airtable'

/**
 * API handler to invite a new member to an existing team
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
export default withApiAuthRequired(async function inviteTeamMemberHandler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { teamId } = req.query

  try {
    // Get the user session
    const session = await getSession(req, res)
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    
    // Get the request body containing invitation data
    const { email, name, role = 'Member', overrideInstitutionCheck = false } = req.body
    
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' })
    }
    
    // Normalize email
    const normalizedEmail = email.trim().toLowerCase()
    
    // Get user profile from Airtable to confirm they're on the team
    const userProfile = await getUserProfile(session.user.sub, session.user.email)
    
    if (!userProfile || !userProfile.contactId) {
      return res.status(404).json({ error: 'User profile not found' })
    }
    
    // Check if user is a member of the team
    const team = await getTeamById(teamId, userProfile.contactId)
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' })
    }
    
    // Check if user is a member of the team
    const isTeamMember = team.members?.some(
      member => member.id === userProfile.contactId && member.status === 'Active'
    )
    
    if (!isTeamMember) {
      return res.status(403).json({ error: 'You must be a team member to invite others' })
    }
    
    // Check if the invitee's institution matches the team members' institution if not overridden
    if (!overrideInstitutionCheck) {
      // Get the user's institution
      const userInstitution = userProfile.institutionId
      
      // Check invitee's email domain
      const inviteeInstitution = await lookupInstitutionByEmail(normalizedEmail)
      
      // If both have institutions and they don't match, return a warning but allow with override
      if (userInstitution && inviteeInstitution && userInstitution !== inviteeInstitution.id) {
        return res.status(400).json({ 
          error: 'Institution mismatch', 
          warning: true,
          details: {
            userInstitution: userProfile.institution?.name || 'Unknown',
            inviteeInstitution: inviteeInstitution.name,
            message: 'The email domain appears to be from a different institution than yours. If this is intentional, please confirm.'
          }
        })
      }
    }
    
    // Get the required tables from Airtable
    const contactsTableId = process.env.AIRTABLE_CONTACTS_TABLE_ID
    const membersTableId = process.env.AIRTABLE_MEMBERS_TABLE_ID
    const formsTableId = process.env.AIRTABLE_FORMS_TABLE_ID
    
    if (!contactsTableId || !membersTableId || !formsTableId) {
      return res.status(500).json({ error: 'Required table IDs not configured' })
    }
    
    const contactsTable = base(contactsTableId)
    const membersTable = base(membersTableId)
    const formsTable = base(formsTableId)
    
    // Check if the contact already exists
    const filterByEmail = `LOWER({Email}) = "${email.toLowerCase()}"`
    
    const existingContacts = await contactsTable.select({
      filterByFormula: filterByEmail,
      maxRecords: 1
    }).firstPage()
    
    let contactId
    
    if (existingContacts && existingContacts.length > 0) {
      // Use the existing contact
      contactId = existingContacts[0].id
      console.log(`Using existing contact record: ${contactId}`)
    } else {
      // Create a new contact record
      console.log(`Creating new contact record for email: ${email}`)
      
      // Split name into first and last if provided
      let firstName = '', lastName = ''
      if (name) {
        const nameParts = name.trim().split(' ')
        firstName = nameParts[0] || ''
        lastName = nameParts.slice(1).join(' ') || ''
      }
      
      const newContact = await contactsTable.create({
        'Email': email.trim(),
        'First Name': firstName,
        'Last Name': lastName,
        'Source': 'Team Invite'
      })
      
      contactId = newContact.id
    }
    
    // Create a form record for the invitation
    console.log(`Creating form record for contact ${contactId}`)
    const formRecord = await formsTable.create({
      'Type': 'Team Invitation',
      'Status': 'Sent',
      'Contacts': [contactId],
    })
    
    // Create a member record for the invitation
    console.log(`Creating member record for contact ${contactId} in team ${teamId}`)
    const memberRecord = await membersTable.create({
      'Contact': [contactId],
      'Team': [teamId],
      'Status': 'Invited',
      'Form': [formRecord.id]
    })
    
    // Get the updated team to include the new member
    const updatedTeam = await getTeamById(teamId, userProfile.contactId)
    
    return res.status(200).json({
      success: true,
      team: updatedTeam,
      invite: {
        email,
        memberId: memberRecord.id,
        formId: formRecord.id,
        status: 'Invited'
      }
    })
  } catch (error) {
    console.error('Error inviting team member:', error)
    
    // Check for specific Airtable error types for better error messages
    if (error.statusCode === 422) {
      return res.status(422).json({ error: 'Invalid field data. Please check field names match the Airtable schema.' })
    } else if (error.statusCode === 404) {
      return res.status(404).json({ error: 'Required table not found. Please check environment variables.' })
    } else if (error.statusCode === 403) {
      return res.status(403).json({ error: 'Permission denied. Please check API key permissions.' })
    }
    
    return res.status(500).json({ error: 'Failed to invite team member: ' + error.message })
  }
})