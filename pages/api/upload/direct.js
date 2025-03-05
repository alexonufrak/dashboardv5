import { put } from '@vercel/blob';
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Direct server-side upload using put method
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

    // Check if FILE_UPLOAD_READ_WRITE_TOKEN environment variable is set
    if (!process.env.FILE_UPLOAD_READ_WRITE_TOKEN) {
      console.error('FILE_UPLOAD_READ_WRITE_TOKEN environment variable is not set');
      return res.status(500).json({
        error: 'Server configuration error: Blob storage is not properly configured',
        code: 'MISSING_BLOB_TOKEN',
        message: 'Direct file uploads are currently not available. Please use the link option instead.'
      });
    }

    // Parse the incoming form data
    const form = new formidable.IncomingForm();
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form:', err);
        return res.status(400).json({ error: 'Failed to parse form data' });
      }

      try {
        // Get the first file from the uploaded files
        const file = files.file?.[0]; // formidable v3+ returns an array of files
        
        if (!file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        // Create a readable stream from the file
        const fileStream = fs.createReadStream(file.filepath);
        
        // Retrieve metadata from fields
        const metadata = fields.metadata ? JSON.parse(fields.metadata) : {};
        
        // Create path including folder structure
        const folderPath = fields.folderPath || `uploads/${session.user.sub}`;
        const timestamp = Date.now();
        const filename = file.originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fullPath = `${folderPath}/${timestamp}_${filename}`;
        
        console.log(`Uploading ${filename} to path: ${fullPath}`);
        
        // Upload file to Blob storage using put
        const blob = await put(fullPath, fileStream, {
          access: 'public',
          token: process.env.FILE_UPLOAD_READ_WRITE_TOKEN,
          contentType: file.mimetype || 'application/octet-stream',
          addRandomSuffix: true, // Add random suffix to prevent conflicts
        });
        
        console.log('File uploaded successfully:', blob.url);
        
        // Return the blob URL and other details
        return res.status(200).json({
          success: true,
          url: blob.url,
          downloadUrl: blob.downloadUrl,
          filename: file.originalFilename,
          contentType: file.mimetype,
          size: file.size,
          metadata
        });
        
      } catch (error) {
        console.error('Error uploading file to Blob storage:', error);
        return res.status(500).json({
          error: 'Failed to upload file',
          details: error.message
        });
      }
    });
  } catch (error) {
    console.error('Error in direct upload handler:', error);
    return res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
});