import { handleUpload } from '@vercel/blob/client';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default withApiAuthRequired(async function handler(req, res) {
  try {
    // Get the user session
    const session = await getSession(req, res);
    if (!session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check for valid request method
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if BLOB_READ_WRITE_TOKEN environment variable is set
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN environment variable is not set');
      return res.status(500).json({
        error: 'Server configuration error: Blob storage is not properly configured'
      });
    }

    // Handle the upload with detailed error logging
    const response = await handleUpload({
      body: req.body, // Add this if handling JSON requests
      request: req,
      token: process.env.BLOB_READ_WRITE_TOKEN, // Explicitly provide the token
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Log for debugging
        console.log(`Upload token requested for: ${pathname}`);
        
        // Parse client payload
        let metadata = {};
        try {
          metadata = clientPayload ? JSON.parse(clientPayload) : {};
          console.log('Upload metadata:', metadata);
        } catch (e) {
          console.error('Error parsing client payload:', e);
          // Don't throw here, just log and continue with empty metadata
        }
        
        return {
          allowedContentTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/zip',
            'text/plain',
            'image/svg+xml'
          ],
          maximumSizeInBytes: 5 * 1024 * 1024, // 5MB
          tokenPayload: JSON.stringify({
            userId: session.user.sub,
            email: session.user.email,
            ...metadata
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This won't work in local dev without tunneling
        console.log('Upload completed:', blob.url);
        try {
          const payload = JSON.parse(tokenPayload);
          console.log('Upload completed by:', payload.email);
        } catch (e) {
          console.error('Error parsing token payload:', e);
        }
      },
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in upload handler:', error.message);
    console.error('Error stack:', error.stack);
    
    // Provide more detailed error response
    let errorMessage = 'Something went wrong with the upload';
    
    if (error.message && error.message.includes('token')) {
      errorMessage = 'Authentication error with blob storage. Please check your environment variables.';
    } else if (error.message && error.message.includes('exceeded')) {
      errorMessage = 'File size exceeds the maximum allowed limit.';
    } else if (error.message && error.message.includes('content type')) {
      errorMessage = 'File type not allowed.';
    }
    
    return res.status(400).json({
      error: errorMessage,
      details: error.message
    });
  }
});