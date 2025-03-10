import { NextApiRequest, NextApiResponse } from 'next';
import { handleUpload } from '@vercel/blob/client';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { createRecord, TABLES, formatAttachments } from '@/lib/airtableClient';

/**
 * API endpoint for secure client-side file uploads
 * Handles both token generation and upload notifications
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Get user session for auth check
    const session = await getSession(req, res);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Handle client uploads securely with Vercel Blob
    const response = await handleUpload({
      body: req.body,
      request: req,
      token: process.env.BLOB_READ_WRITE_TOKEN || process.env.FILE_UPLOAD_READ_WRITE_TOKEN,
      
      // Before generating the token, we validate the user and request
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Parse the client payload
        let parsedPayload = {};
        try {
          if (clientPayload) {
            parsedPayload = JSON.parse(clientPayload);
          }
        } catch (e) {
          console.error('Invalid client payload:', e);
        }
        
        // Validate that we have required data
        const { teamId, milestoneId } = parsedPayload as { teamId?: string; milestoneId?: string };
        
        if (!teamId || !milestoneId) {
          throw new Error('Missing required team or milestone information');
        }
        
        // Set file upload restrictions
        return {
          allowedContentTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/zip',
            'image/jpeg',
            'image/png',
            'image/gif',
            'text/plain',
            'text/csv',
            'application/json',
          ],
          maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
          tokenPayload: JSON.stringify({
            userId: session.user.sub,
            teamId,
            milestoneId,
          }),
        };
      },
      
      // When upload completes, we can update our database
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          if (!tokenPayload) {
            console.warn('No token payload received with upload');
            return;
          }
          
          // Parse token payload
          const { userId, teamId, milestoneId } = JSON.parse(tokenPayload);
          
          if (!teamId || !milestoneId) {
            console.error('Missing team or milestone ID in token payload');
            return;
          }
          
          // Format the file for Airtable
          const fileAttachment = formatAttachments([{
            url: blob.url,
            filename: blob.pathname.split('/').pop() || 'file',
          }]);
          
          // Create or update submission in Airtable
          // This is just recording the file, the actual submission
          // will be created when the user submits the entire form
          await createRecord('SUBMISSIONS', {
            Team: [teamId],
            Milestone: [milestoneId],
            Attachment: fileAttachment,
            Comments: `File uploaded by ${userId}`,
          });
          
          console.log('File upload recorded in Airtable');
        } catch (error) {
          console.error('Error handling completed upload:', error);
        }
      },
    });
    
    return res.status(200).json(response);
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
};

export default withApiAuthRequired(handler);

// Configure the API route to disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};