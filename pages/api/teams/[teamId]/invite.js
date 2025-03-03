import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0'
import { 
  getUserProfile, 
  base, 
  getTeamById, 
  lookupInstitutionByEmail,
  createTeamInvitation
} from '@/lib/airtable'

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
    const { 
      email, 
      firstName, 
      lastName, 
      institutionId, 
      institutionName,
      role = 'Member',
      createInviteToken = false
    } = req.body
    
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' })
    }
    
    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ error: 'First name is required' })
    }
    
    if (!lastName || !lastName.trim()) {
      return res.status(400).json({ error: 'Last name is required' })
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
    
    // Check if the invitee's institution matches the team members' institution
    const userInstitutionId = userProfile.institutionId || 
                             (userProfile.Institution && userProfile.Institution.length > 0 ? userProfile.Institution[0] : null) ||
                             (userProfile["Institution (from Education)"] && userProfile["Institution (from Education)"].length > 0 ? 
                              userProfile["Institution (from Education)"][0] : null)
    
    // Determine invitee's institution - either from the provided institutionId or by looking up the email domain
    let inviteeInstitutionId = institutionId
    let inviteeInstitutionName = institutionName
    
    if (!inviteeInstitutionId) {
      // Look up institution by email domain if not provided
      const inviteeInstitution = await lookupInstitutionByEmail(normalizedEmail)
      if (inviteeInstitution) {
        inviteeInstitutionId = inviteeInstitution.id
        inviteeInstitutionName = inviteeInstitution.name
      }
    }
    
    // Both institutions must be known, and they must match
    if (userInstitutionId && inviteeInstitutionId && userInstitutionId !== inviteeInstitutionId) {
      return res.status(403).json({ 
        error: 'Members must belong to the same institution. You cannot invite members from other institutions.'
      })
    }
    
    // Get the required tables from Airtable
    const contactsTableId = process.env.AIRTABLE_CONTACTS_TABLE_ID
    const membersTableId = process.env.AIRTABLE_MEMBERS_TABLE_ID
    const educationTableId = process.env.AIRTABLE_EDUCATION_TABLE_ID
    
    if (!contactsTableId || !membersTableId || !educationTableId) {
      return res.status(500).json({ error: 'Required table IDs not configured' })
    }
    
    const contactsTable = base(contactsTableId)
    const membersTable = base(membersTableId)
    const educationTable = base(educationTableId)
    
    // Check if the contact already exists
    const filterByEmail = `LOWER({Email}) = "${normalizedEmail}"`
    
    const existingContacts = await contactsTable.select({
      filterByFormula: filterByEmail,
      maxRecords: 1
    }).firstPage()
    
    let contactId
    
    if (existingContacts && existingContacts.length > 0) {
      // Use the existing contact
      contactId = existingContacts[0].id
      console.log(`Using existing contact record: ${contactId}`)
      
      // Update contact with provided names if needed
      if (firstName || lastName) {
        await contactsTable.update(contactId, {
          'First Name': firstName.trim(),
          'Last Name': lastName.trim()
        })
      }
    } else {
      // Create a new contact record
      console.log(`Creating new contact record for email: ${normalizedEmail}`)
      
      const newContact = await contactsTable.create({
        'Email': normalizedEmail,
        'First Name': firstName.trim(),
        'Last Name': lastName.trim(),
        'Source': 'Team Invite'
      })
      
      contactId = newContact.id
    }
    
    // If we have institution information, create or update education record
    if (inviteeInstitutionId) {
      // Check if contact already has an education record
      const existingEducation = existingContacts && existingContacts.length > 0 && 
                               existingContacts[0].fields.Education && 
                               existingContacts[0].fields.Education.length > 0
        ? existingContacts[0].fields.Education[0]
        : null
      
      if (existingEducation) {
        // Update existing education record with institution
        await educationTable.update(existingEducation, {
          'Institution': [inviteeInstitutionId]
        })
      } else {
        // Create new education record
        const newEducation = await educationTable.create({
          'Contact': [contactId],
          'Institution': [inviteeInstitutionId]
        })
        
        // Update contact to link to education record
        await contactsTable.update(contactId, {
          'Education': [newEducation.id]
        })
      }
    }
    
    // Create a member record for the invitation
    console.log(`Creating member record for contact ${contactId} in team ${teamId}`)
    const memberRecord = await membersTable.create({
      'Contact': [contactId],
      'Team': [teamId],
      'Status': 'Invited'
    })
    
    // Get the updated team to include the new member
    const updatedTeam = await getTeamById(teamId, userProfile.contactId)
    
    // Create an invitation token if requested
    let inviteToken = null;
    let inviteUrl = null;
    
    if (createInviteToken) {
      try {
        console.log("Creating invitation token for team member");
        
        const invitation = await createTeamInvitation({
          email: normalizedEmail,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          teamId: teamId,
          memberId: memberRecord.id,
          createdById: userProfile.contactId,
          expiresInDays: 14 // Two weeks by default
        });
        
        if (invitation && invitation.token) {
          inviteToken = invitation.token;
          inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/signup/invited?token=${inviteToken}`;
          console.log(`Generated invitation URL: ${inviteUrl}`);
        }
      } catch (inviteError) {
        console.error("Error creating invitation token:", inviteError);
        // Continue even if token creation fails
      }
    }
    
    return res.status(200).json({
      success: true,
      team: updatedTeam,
      invite: {
        email: normalizedEmail,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        memberId: memberRecord.id,
        status: 'Invited',
        institutionId: inviteeInstitutionId,
        institutionName: inviteeInstitutionName,
        inviteToken,
        inviteUrl
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