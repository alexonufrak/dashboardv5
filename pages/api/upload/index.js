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

    const response = await handleUpload({
      request: req,
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
    console.error('Error in upload handler:', error);
    return res.status(400).json({
      error: error.message || 'Something went wrong with the upload',
    });
  }
});