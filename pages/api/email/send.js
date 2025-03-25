import { auth0 } from '@/lib/auth0'
import { sendEmail } from '@/lib/email-service'

/**
 * API handler for sending emails
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
export default async function sendEmailHandler(req, res) {
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
    
    // Get the request body containing email data
    const { 
      templateType,
      templateData,
      to,
      subject,
      from
    } = req.body
    
    if (!templateType) {
      return res.status(400).json({ error: 'Template type is required' })
    }
    
    if (!templateData) {
      return res.status(400).json({ error: 'Template data is required' })
    }
    
    if (!to) {
      return res.status(400).json({ error: 'Recipient email is required' })
    }
    
    // Dynamically import the email template based on templateType
    let EmailTemplate
    
    try {
      const template = await import(`../../../emails/templates/${templateType}`)
      EmailTemplate = template.default
    } catch (error) {
      console.error(`Error loading email template '${templateType}':`, error)
      return res.status(400).json({ error: `Email template '${templateType}' not found` })
    }
    
    // Send the email
    const result = await sendEmail({
      from,
      to,
      subject,
      react: EmailTemplate(templateData)
    })
    
    if (!result.success) {
      return res.status(500).json({ error: 'Failed to send email', details: result.error })
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      data: result.data
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return res.status(500).json({ error: 'Failed to send email: ' + error.message })
  }
}