import { handleUpload } from '@vercel/blob/client';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

export const config = {
  api: {
    bodyParser: false, // Required for handleUpload to work properly
  },
};

export default withApiAuthRequired(async function handler(req, res) {
  // Only allow POST for token generation and webhook handling
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session to authorize uploads
    const session = await getSession(req, res);
    if (!session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Following Vercel's exact pattern for handleUpload
    const jsonResponse = await handleUpload({
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Log the request for debugging
        console.log(`Token request for ${pathname}`);
        
        // Validate client payload if provided (contains teamId and milestoneId)
        let parsedPayload = {};
        if (clientPayload) {
          try {
            parsedPayload = JSON.parse(clientPayload);
            console.log('Client payload:', parsedPayload);
          } catch (e) {
            console.error("Invalid client payload:", e);
          }
        }

        // Here you can add additional validation based on the user or payload
        // For example, check if user has permission to upload to specific milestone
        console.log(`User ${session.user.email} uploading to ${pathname}`);
        
        return {
          // Allow common document and image formats
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
            'application/zip',
            'text/plain',
            // Add more as needed
          ],
          // Set max file size (5MB)
          maximumSizeInBytes: 5 * 1024 * 1024,
          // Set token expiration (10 minutes)
          validUntil: Date.now() + 10 * 60 * 1000,
          // Store metadata in token for use in webhook
          tokenPayload: JSON.stringify({
            userId: session.user.sub,
            userEmail: session.user.email,
            ...parsedPayload
          })
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This runs when the upload completes
        // Note: Won't work on localhost without tunneling (e.g., ngrok)
        try {
          const payload = JSON.parse(tokenPayload);
          console.log(`Upload completed for ${blob.pathname}`);
          console.log(`URL: ${blob.url}`);
          console.log(`User: ${payload.userEmail}`);
          console.log(`Team: ${payload.teamId}`);
          console.log(`Milestone: ${payload.milestoneId}`);
          
          // Here you could update a database with the file info
          // For example, store the file URL in your database
          
        } catch (error) {
          console.error("Error in upload completion webhook:", error);
        }
      }
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Error handling upload:", error);
    return res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});