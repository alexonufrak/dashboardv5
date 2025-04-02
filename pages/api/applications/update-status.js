import { auth0 } from '@/lib/auth0';
import { updateApplicationStatus, getApplicationById } from '@/lib/airtable/entities/applications';
import { getUserByAuth0Id } from '@/lib/airtable/entities/users';
import { createParticipationRecord } from '@/lib/airtable/entities/participation';

/**
 * API endpoint to update application status
 * Only admin users can update status
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
async function updateApplicationStatusHandler(req, res) {
  try {
    // Get the user session
    const session = await auth0.getSession(req, res);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Check if user has admin role
    const { user } = session;
    const roles = user[`${process.env.AUTH0_AUDIENCE}/roles`] || [];
    const isAdmin = roles.some(role => 
      role === 'admin' || 
      role === 'superadmin' || 
      role === 'program-admin'
    );
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Not authorized to update application status' });
    }
    
    // Get application ID and new status from request body
    const { id, status } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Application ID is required' });
    }
    
    if (!status) {
      return res.status(400).json({ error: 'New status is required' });
    }
    
    // Valid status values
    const validStatuses = ['Submitted', 'Under Review', 'Approved', 'Rejected', 'Waitlisted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status value',
        validValues: validStatuses
      });
    }
    
    // Get the original application to check if status is changing to Approved
    const originalApplication = await getApplicationById(id);
    if (!originalApplication) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Update the application status
    const updatedApplication = await updateApplicationStatus(id, status);
    
    // If status is changing to Approved, create participation record
    if (status === 'Approved' && originalApplication.status !== 'Approved') {
      try {
        // Create participation record
        const participationResult = await createParticipationRecord({
          contactId: updatedApplication.contactId,
          cohortId: updatedApplication.cohortId
        });
        
        console.log('Created participation record after approval:', participationResult);
        
        // Return with participation info
        return res.status(200).json({
          success: true,
          application: updatedApplication,
          participation: participationResult
        });
      } catch (participationError) {
        console.error('Error creating participation record:', participationError);
        
        // Still return success for the status update, but with error info
        return res.status(200).json({
          success: true,
          application: updatedApplication,
          participationError: 'Failed to create participation record'
        });
      }
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      application: updatedApplication
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    return res.status(500).json({
      error: 'Failed to update application status',
      message: error.message
    });
  }
}

export default async function handlerImpl(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Check for valid Auth0 session
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Call the handler with the authenticated session
    return updateApplicationStatusHandler(req, res);
  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}