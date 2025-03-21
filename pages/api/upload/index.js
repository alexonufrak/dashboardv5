import { handleUpload } from '@vercel/blob/client';
import { auth0 } from '@/lib/auth0';
import { FILE_UPLOAD, getAllowedMimeTypes } from '@/lib/constants';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    // Get the user session
    const session = await auth0.getSession(req);
    if (!session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check for valid request method
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if FILE_UPLOAD_READ_WRITE_TOKEN environment variable is set
    if (!process.env.FILE_UPLOAD_READ_WRITE_TOKEN) {
      console.error('FILE_UPLOAD_READ_WRITE_TOKEN environment variable is not set');
      
      // Return a specific error code that can be identified by the client
      return res.status(500).json({
        error: 'Server configuration error: Blob storage is not properly configured',
        code: 'MISSING_BLOB_TOKEN',
        message: 'Direct file uploads are currently not available. Please use the link option instead.'
      });
    }

    // Log successful token detection
    console.log('Using FILE_UPLOAD_READ_WRITE_TOKEN for Vercel Blob uploads');

    // Try to parse body for handleUpload, as it might be needed depending on the request type
    let body;
    try {
      if (req.method === 'POST' && req.headers['content-type']?.includes('application/json')) {
        body = await new Promise((resolve) => {
          let data = '';
          req.on('data', (chunk) => {
            data += chunk;
          });
          req.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              console.error('Error parsing request body as JSON:', e);
              resolve({});
            }
          });
        });
      }
    } catch (error) {
      console.error('Error handling request body:', error);
    }

    // Handle the upload with detailed error logging - this handles both token generation and upload completion
    const response = await handleUpload({
      request: req,
      token: process.env.FILE_UPLOAD_READ_WRITE_TOKEN, // Explicitly provide the custom token
      body, // Add the body parameter for JSON requests
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Log for debugging
        console.log(`Upload token requested for: ${pathname}`);
        
        // Parse client payload for additional metadata
        let metadata = {};
        try {
          if (clientPayload) {
            metadata = JSON.parse(clientPayload);
            console.log('Upload metadata:', metadata);
            
            // Validate payload has expected fields based on upload type
            if (metadata.teamId && metadata.milestoneId) {
              console.log(`Processing upload for team ${metadata.teamId}, milestone ${metadata.milestoneId}`);
            } else if (metadata.type === 'team-header') {
              console.log(`Processing team header image upload, timestamp: ${metadata.timestamp}`);
            } else {
              console.warn("Missing expected metadata fields in upload request");
            }
          }
        } catch (e) {
          console.error('Error parsing client payload:', e);
          // Don't throw here, just log and continue with empty metadata
        }
        
        // Set token expiration
        const now = new Date();
        const validUntil = now.setMinutes(now.getMinutes() + 30); // 30 minute token validity
        
        return {
          // Allow specific file types based on upload purpose
          allowedContentTypes: (() => {
            // Determine if this is a team header or milestone upload based on metadata
            if (metadata.type === 'team-header') {
              return getAllowedMimeTypes(FILE_UPLOAD.TEAM_IMAGE.ALLOWED_TYPES);
            } else {
              // Default to milestone submission allowed types (includes all image types)
              return getAllowedMimeTypes(FILE_UPLOAD.MILESTONE_SUBMISSION.ALLOWED_TYPES);
            }
          })(),
          maximumSizeInBytes: (() => {
            // Use different size limits based on upload type
            if (metadata.type === 'team-header') {
              return FILE_UPLOAD.TEAM_IMAGE.MAX_SIZE;
            } else {
              // For milestone submissions, we might need to chunk larger files
              // Vercel Blob might have its own limits on single file size
              // For safety, cap at a reasonable size (100MB) for single file upload
              return Math.min(FILE_UPLOAD.MILESTONE_SUBMISSION.MAX_SIZE, 100 * 1024 * 1024);
            }
          })(),
          validUntil,
          addRandomSuffix: true, // Add random suffix to prevent filename conflicts
          tokenPayload: JSON.stringify({
            userId: session.user.sub,
            email: session.user.email,
            timestamp: Date.now(),
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
          
          // Log additional useful information from the blob and payload
          console.log(`File uploaded: ${blob.pathname}`);
          console.log(`File size: ${blob.size} bytes`);
          console.log(`Content type: ${blob.contentType}`);
          console.log(`Upload time: ${new Date().toISOString()}`);
          
          if (payload.teamId && payload.milestoneId) {
            console.log(`Milestone submission: Team ${payload.teamId}, Milestone ${payload.milestoneId}`);
            
            // Here you could update a database to record the submission
            // This is a great place to update Airtable or another database with the submission details
            // await updateSubmissionRecord(payload.teamId, payload.milestoneId, blob.url);
          }
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
};