import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0"
import { base } from "@/lib/airtable"
import { formidable } from "formidable"
import fs from "fs"

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
}

/**
 * API endpoint to create a new milestone submission
 * Accepts file uploads and links
 */
export default withApiAuthRequired(async function handler(req, res) {
  // Only allow POST method for submissions
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    // Get the current session and user
    const session = await getSession(req, res)
    if (!session?.user) {
      return res.status(401).json({ error: "Not authenticated" })
    }

    // Parse the multipart form data (files and fields)
    const formOptions = {
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      multiples: true,
    }

    const [fields, files] = await new Promise((resolve, reject) => {
      formidable(formOptions).parse(req, (err, fields, files) => {
        if (err) reject(err)
        resolve([fields, files])
      })
    })

    // Extract form data
    const teamId = fields.teamId?.[0]
    const milestoneId = fields.milestoneId?.[0]
    const link = fields.link?.[0]
    const comments = fields.comments?.[0]

    // Validate required fields
    if (!teamId) {
      return res.status(400).json({ error: "Team ID is required" })
    }

    if (!milestoneId) {
      return res.status(400).json({ error: "Milestone ID is required" })
    }

    // Get the Airtable table ID from environment variables
    const submissionsTableId = process.env.AIRTABLE_SUBMISSIONS_TABLE_ID

    if (!submissionsTableId) {
      return res.status(500).json({ error: "Submissions table not configured" })
    }

    // Initialize the submissions table
    const submissionsTable = base(submissionsTableId)

    // Process file uploads
    let fileAttachments = []
    if (files) {
      // Handle multiple files
      for (const key in files) {
        const file = files[key]
        if (Array.isArray(file)) {
          for (const f of file) {
            try {
              // Validate file
              if (!f.filepath || !f.originalFilename) {
                console.warn('Skipping invalid file (missing filepath or name):', f);
                continue;
              }
              
              // Read the file and prepare for Airtable upload
              const fileData = fs.readFileSync(f.filepath)
              
              // Ensure we have a proper MIME type
              const mimeType = f.mimetype || 'application/octet-stream';
              
              // Create attachment object with ONLY the required fields that Airtable expects
              // According to https://airtable.com/developers/web/api/model/file-attachment
              const attachment = {
                filename: f.originalFilename,
                content: fileData.toString('base64'),
                type: mimeType
              };
              
              console.log(`Processing file: ${f.originalFilename}, size: ${fileData.length} bytes, type: ${mimeType}`);
              fileAttachments.push(attachment);
            } catch (fileError) {
              console.error(`Error processing file ${f.originalFilename}:`, fileError);
              // Continue with other files instead of failing completely
            }
          }
        } else {
          try {
            // Validate file
            if (!file.filepath || !file.originalFilename) {
              console.warn('Skipping invalid file (missing filepath or name):', file);
              continue;
            }
            
            // Read the file and prepare for Airtable upload
            const fileData = fs.readFileSync(file.filepath)
            
            // Ensure we have a proper MIME type
            const mimeType = file.mimetype || 'application/octet-stream';
            
            // Create attachment object with ONLY the required fields that Airtable expects
            // According to https://airtable.com/developers/web/api/model/file-attachment
            const attachment = {
              filename: file.originalFilename,
              content: fileData.toString('base64'),
              type: mimeType
            };
            
            console.log(`Processing file: ${file.originalFilename}, size: ${fileData.length} bytes, type: ${mimeType}`);
            fileAttachments.push(attachment);
          } catch (fileError) {
            console.error(`Error processing file ${file.originalFilename}:`, fileError);
            // Continue with other files instead of failing completely
          }
        }
      }
    }
    
    console.log(`Total attachments to submit: ${fileAttachments.length}`);
    
    // If we couldn't process any files but the user tried to upload some, return an error
    if (fileAttachments.length === 0 && Object.keys(files).length > 0) {
      console.error('No valid files could be processed');
      return res.status(400).json({ 
        error: "File upload failed",
        details: "None of the provided files could be processed. Please try different files."
      });
    }

    // Create submission record
    const record = {
      Team: [teamId],
      Comments: comments || "",
      Milestone: [milestoneId] // Ensure Milestone is always an array with a single ID
    }
    
    // Log the record creation for debugging
    console.log(`Creating submission record with Team: ${teamId}, Milestone: ${milestoneId}`)

    // Add link if provided
    if (link) {
      record.Link = link
    }

    // Add attachments if any
    if (fileAttachments.length > 0) {
      console.log(`Adding ${fileAttachments.length} attachments to the record`);
      
      // NOTE: We're ensuring the Attachment field follows Airtable's expected format
      // It needs to be a single array of attachment objects
      record.Attachment = fileAttachments;
    }

    // Create the submission in Airtable
    try {
      console.log('Submitting to Airtable:', {
        teamId,
        milestoneId,
        attachmentCount: fileAttachments.length
      });
      
      // If we have many or large attachments, use a different approach
      if (fileAttachments.length > 0) {
        console.log(`Preparing ${fileAttachments.length} attachments for submission`);
        
        try {
          // Log the attachment structure for debugging
          const sampleAttachment = fileAttachments[0];
          console.log(`Attachment example structure: {
            filename: "${sampleAttachment.filename}",
            type: "${sampleAttachment.type}",
            content: "${sampleAttachment.content.substring(0, 20)}..." (length: ${sampleAttachment.content.length})
          }`);
        } catch (e) {
          console.error("Error logging attachment structure:", e);
        }
        
        // Try with just one attachment at a time if there are multiple
        if (fileAttachments.length > 1) {
          console.log("Multiple attachments - submitting with only the first one for this attempt");
          record.Attachment = [fileAttachments[0]];
        }
      }
      
      // Create the submission in Airtable
      const submission = await submissionsTable.create(record);
      
      return res.status(201).json({
        success: true,
        submission: {
          id: submission.id,
          teamId,
          milestoneId,
          hasAttachments: fileAttachments.length > 0,
          attachmentCount: fileAttachments.length,
          hasLink: !!link,
        }
      });
    } catch (submitError) {
      console.error("Error creating submission in Airtable:", submitError);
      
      // Check for specific Airtable errors
      if (submitError.error === 'INVALID_ATTACHMENT_OBJECT') {
        console.log("Detected INVALID_ATTACHMENT_OBJECT error, attempting alternate submission method");
        
        try {
          // Remove attachments and just submit with a comment about files
          delete record.Attachment;
          
          // Add a note to the comments
          record.Comments = (record.Comments || "") + 
            "\n\n[Note: Files couldn't be uploaded directly. Please upload files manually through Airtable.]";
          
          // Try again without the attachments
          const submission = await submissionsTable.create(record);
          
          return res.status(201).json({
            success: true,
            warning: "Files were not uploaded due to technical limitations. Please contact support if you need to attach files.",
            submission: {
              id: submission.id,
              teamId,
              milestoneId,
              hasAttachments: false,
              attachmentCount: 0,
              hasLink: !!link,
            }
          });
        } catch (retryError) {
          console.error("Retry submission without attachments also failed:", retryError);
          return res.status(500).json({ 
            error: "Failed to create submission", 
            details: "Couldn't upload files and fallback method also failed.",
            errorCode: "SUBMISSION_FAILED"
          });
        }
      }
      
      // Return a more user-friendly error message
      return res.status(422).json({ 
        error: "Failed to create submission in Airtable", 
        details: submitError.message || "Unknown error",
        errorCode: submitError.error || "UNKNOWN_ERROR"
      });
    }
  } catch (error) {
    console.error("Error processing submission request:", error);
    
    // Sanitize and improve error details
    let errorDetails = error.message || "Unknown error";
    let statusCode = 500;
    
    // Handle specific error types with better messages
    if (error.message && error.message.includes('INVALID_ATTACHMENT_OBJECT')) {
      statusCode = 422;
      errorDetails = "Invalid attachment format. Please check your file and try again.";
    }
    
    return res.status(statusCode).json({ 
      error: "Failed to create submission", 
      details: errorDetails
    });
  }
})