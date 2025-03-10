/**
 * Vercel Blob storage utility for file uploads
 * Handles client-side and server-side uploads to Vercel Blob
 */
import { put } from '@vercel/blob';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload a file to Vercel Blob from the server
 * @param file - The file to upload
 * @param options - Upload options including team and milestone info
 * @returns The blob object with URL
 */
export async function uploadFileToBlob(
  file: File | Blob | ArrayBuffer | ReadableStream,
  options: {
    fileName: string;
    teamId?: string;
    milestoneId?: string;
    contentType?: string;
    path?: string;
  }
) {
  const { fileName, teamId, milestoneId, contentType, path = 'uploads' } = options;
  
  // Create a safe filename with timestamp and random ID
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const uniqueId = uuidv4().slice(0, 8);
  const safeFilename = `${timestamp}-${uniqueId}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  
  // Create folder structure: uploads/[teamId]/[milestoneId]/
  const folderPath = teamId && milestoneId 
    ? `${path}/${teamId}/${milestoneId}`
    : teamId 
      ? `${path}/${teamId}` 
      : path;
  
  try {
    // Upload to Vercel Blob
    const blob = await put(`${folderPath}/${safeFilename}`, file, {
      access: 'public',
      contentType: contentType || undefined,
      addRandomSuffix: false, // We already added our own unique ID
    });
    
    return {
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: typeof file === 'object' && 'size' in file ? file.size : null,
      filename: safeFilename
    };
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Handles client-side upload requests for Vercel Blob
 * This function should be used in an API route handler
 * 
 * @param request - The incoming API request (NextApiRequest or equivalent)
 * @param response - The API response object (NextApiResponse or equivalent)
 * @param options - Additional options to customize the upload
 * @returns - JSON response for the client
 */
export async function handleClientUpload(
  request: any,
  response: any,
  options?: {
    allowedContentTypes?: string[];
    maxSizeInBytes?: number;
    onUploadComplete?: (blobInfo: any, metadata?: any) => Promise<void>;
  }
) {
  // Extract request body as HandleUploadBody type
  const body = request.body as HandleUploadBody;
  
  try {
    // Process the upload using Vercel Blob's handleUpload helper
    const jsonResponse = await handleUpload({
      body,
      request,
      
      // This function runs when the client requests a token for upload
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // You can add authentication/authorization logic here
        // e.g., check if the user is logged in and has permission to upload
        
        // Parse the client payload if it exists
        const metadata = clientPayload ? JSON.parse(clientPayload) : {};
        const { teamId, milestoneId } = metadata;
        
        // Return token configuration
        return {
          // Restrict allowed content types if specified, otherwise allow any file type
          allowedContentTypes: options?.allowedContentTypes || ['*/*'],
          
          // Set maximum file size (default 10MB)
          maximumSizeInBytes: options?.maxSizeInBytes || 10 * 1024 * 1024,
          
          // Pass any metadata back to the onUploadCompleted callback
          tokenPayload: JSON.stringify({
            teamId,
            milestoneId,
            pathname,
            ...metadata
          }),
        };
      },
      
      // This function runs after the upload completes
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Skip callback if running on localhost (webhooks won't work)
        if (process.env.NODE_ENV === 'development' && 
            !process.env.VERCEL_URL && 
            !process.env.NEXT_PUBLIC_VERCEL_URL) {
          console.log('Upload completed, but webhook callback skipped in local development');
          console.log('Blob URL:', blob.url);
          console.log('Metadata:', tokenPayload);
          return;
        }
        
        try {
          // Parse the metadata from the token payload
          const metadata = tokenPayload ? JSON.parse(tokenPayload) : {};
          
          // Call custom onUploadComplete handler if provided
          if (options?.onUploadComplete) {
            await options.onUploadComplete(blob, metadata);
          }
          
          console.log('Upload completed successfully:', blob.url);
        } catch (error) {
          console.error('Error in onUploadCompleted handler:', error);
          throw new Error('Failed to process completed upload');
        }
      },
    });
    
    // Return success response to the client
    return response.status(200).json(jsonResponse);
  } catch (error) {
    console.error('Error handling blob upload:', error);
    // Return error response
    // Note: For webhook callbacks, a non-200 response will cause Vercel to retry
    return response.status(400).json({ 
      error: (error as Error).message || 'Failed to process upload request' 
    });
  }
}