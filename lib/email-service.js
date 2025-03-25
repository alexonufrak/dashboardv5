import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender address
const DEFAULT_FROM = 'xFoundry <noreply@notify.xfoundry.org>';

/**
 * Send an email using Resend
 * 
 * @param {Object} options - Email options
 * @param {string} options.from - Sender email address (optional)
 * @param {string|string[]} options.to - Recipient email address(es) 
 * @param {string|string[]} options.cc - CC recipients (optional)
 * @param {string|string[]} options.bcc - BCC recipients (optional)
 * @param {string} options.subject - Email subject
 * @param {JSX.Element} options.react - React email component
 * @param {Object} options.attachments - Email attachments (optional)
 * @param {Object} options.headers - Custom email headers (optional)
 * @returns {Promise<Object>} - Result of sending the email
 */
export async function sendEmail({ 
  from = DEFAULT_FROM,
  to,
  cc,
  bcc,
  subject,
  react,
  attachments,
  headers
}) {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      cc,
      bcc,
      subject,
      react,
      attachments,
      headers
    });

    if (error) {
      console.error('Email sending failed:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a team invitation email
 * 
 * @param {Object} options - Invitation options
 * @param {string} options.email - Recipient email address
 * @param {string} options.firstName - Recipient's first name
 * @param {string} options.lastName - Recipient's last name
 * @param {string} options.teamName - Name of the team they're invited to
 * @param {string} options.inviterName - Name of the person who sent the invite
 * @param {string} options.inviteUrl - URL to accept the invitation
 * @returns {Promise<Object>} - Result of sending the email
 */
export async function sendTeamInviteEmail({
  email,
  firstName,
  lastName,
  teamName,
  inviterName,
  inviteUrl
}) {
  // Dynamically import the email template to avoid SSR issues
  const { TeamInviteEmail } = await import('../emails/templates/team-invite-email');
  
  return sendEmail({
    to: email,
    subject: `You're invited to join ${teamName} on xFoundry`,
    react: TeamInviteEmail({
      firstName,
      lastName,
      teamName,
      inviterName,
      inviteUrl
    })
  });
}

/**
 * Send a welcome email to new users
 * 
 * @param {Object} options - Welcome email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.firstName - Recipient's first name
 * @returns {Promise<Object>} - Result of sending the email
 */
export async function sendWelcomeEmail({
  email,
  firstName
}) {
  // Dynamically import the email template to avoid SSR issues
  const { WelcomeEmail } = await import('../emails/templates/welcome-email');
  
  return sendEmail({
    to: email,
    subject: `Welcome to xFoundry!`,
    react: WelcomeEmail({
      firstName
    })
  });
}