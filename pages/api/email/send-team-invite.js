import { auth0 } from '@/lib/auth0'
import { getUserProfile, getTeamById } from '@/lib/airtable'
import { sendTeamInviteEmail } from '@/lib/email-service'

/**
 * API handler for sending team invitation emails
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
export default async function sendTeamInviteEmailHandler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the user session to ensure authentication
    const session = await auth0.getSession(req)
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    
    // Get the request body containing invitation data
    const { 
      email,
      firstName,
      lastName,
      teamId,
      inviteUrl
    } = req.body
    
    if (!email) {
      return res.status(400).json({ error: 'Recipient email is required' })
    }
    
    if (!firstName) {
      return res.status(400).json({ error: 'Recipient first name is required' })
    }
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' })
    }
    
    if (!inviteUrl) {
      return res.status(400).json({ error: 'Invite URL is required' })
    }
    
    // Get user profile to get inviter details
    const userProfile = await getUserProfile(session.user.sub, session.user.email)
    
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' })
    }
    
    // Get team details
    const team = await getTeamById(teamId, userProfile.contactId)
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' })
    }
    
    // Check if user is a member of the team
    const isTeamMember = team.members?.some(
      member => member.id === userProfile.contactId && member.status === 'Active'
    )
    
    if (!isTeamMember) {
      return res.status(403).json({ error: 'You must be a team member to send team invitations' })
    }
    
    // Send the invitation email
    const result = await sendTeamInviteEmail({
      email,
      firstName,
      lastName: lastName || '',
      teamName: team.name,
      inviterName: `${userProfile.firstName} ${userProfile.lastName}`,
      inviteUrl
    })
    
    if (!result.success) {
      return res.status(500).json({ error: 'Failed to send invitation email', details: result.error })
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Invitation email sent successfully',
      data: result.data
    })
  } catch (error) {
    console.error('Error sending invitation email:', error)
    return res.status(500).json({ error: 'Failed to send invitation email: ' + error.message })
  }
}