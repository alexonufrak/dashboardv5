# File Storage Implementation

This document describes the file storage implementation used in the xFoundry Dashboard. The implementation uses Vercel Blob for storing user-uploaded files and integrates with Airtable for tracking submission metadata.

## Overview

The file storage system consists of three main components:

1. **Client-side Upload Component** (`FileUpload.tsx`): Handles user interactions, file validation, and uploads
2. **Upload API Endpoint** (`/api/upload.ts`): Processes client file uploads securely
3. **Airtable Integration** (`airtableClient.ts`): Records file metadata in Airtable

## Implementation Details

### Vercel Blob Integration

Vercel Blob provides a simple, serverless blob storage system optimized for Next.js applications. Our implementation supports both:

- **Client-side uploads**: Secure, browser-based uploads directly to Vercel Blob
- **Server-side uploads**: Uploads processed through our API endpoints

Files are organized in a structured path format: `/uploads/[teamId]/[milestoneId]/[filename]`

### Environment Variables

The following environment variables are required for the file storage implementation:

```
# For Vercel Blob
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# If using the patch script
FILE_UPLOAD_READ_WRITE_TOKEN=your_vercel_blob_token

# For Airtable integration
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id
AIRTABLE_SUBMISSIONS_TABLE_ID=your_airtable_submissions_table_id
```

### Uploading Flow

1. User selects files via `FileUpload` component
2. Client validates file types and sizes
3. For client-side uploads:
   - Component uses `@vercel/blob/client` to initiate upload
   - A token is requested from `/api/upload` endpoint
   - Upload progress is tracked and displayed to user
   - Once upload completes, Vercel Blob notifies our webhook
4. The API records the file URL and metadata in Airtable
5. The submission form includes uploaded file URLs in its submission data

### Security Considerations

- All uploads require authentication via Auth0
- The server verifies team and milestone IDs before generating upload tokens
- File types are restricted to allowed formats (.pdf, .doc, .docx, etc.)
- File sizes are limited to 10MB per file
- Vercel Blob's token system prevents unauthorized access

### Code Structure

- **`lib/blobStorage.ts`**: Utility functions for working with Vercel Blob
- **`lib/airtableClient.ts`**: Airtable API client for data persistence
- **`components/milestone/FileUpload.tsx`**: UI component for uploads
- **`pages/api/upload.ts`**: API endpoint for client-side uploads

## Migrating from Previous Implementation

The current implementation replaces the previous mock upload system with a real Vercel Blob integration. Key improvements include:

- Real file uploads instead of simulation
- Progress tracking based on actual upload status
- Secure token-based upload permissions
- Proper integration with Airtable for tracking file submissions

## Usage Examples

### Client-Side Upload Component

```jsx
<FileUpload
  value={files}
  onChange={handleFilesChanged}
  maxSize={10} // 10MB
  maxFiles={5}
  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.jpg,.jpeg,.png"
  teamId={teamData?.id}
  milestoneId={milestone.id}
  onUploadComplete={handleUploadComplete}
/>
```

### Server-Side Upload Utility

```typescript
import { uploadFileToBlob } from '@/lib/blobStorage';

// Inside an API route or server component
const blobFile = await uploadFileToBlob(fileStream, {
  fileName: file.originalFilename || 'file',
  contentType: file.mimetype,
  teamId,
  milestoneId,
});
```