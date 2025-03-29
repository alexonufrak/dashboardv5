import { auth0 } from "@/lib/auth0"
import { base } from "@/lib/airtable"

// Use standard bodyParser for this endpoint since we're no longer handling direct file uploads here
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // For JSON only (file URLs and metadata)
    },
  },
}

/**
 * API endpoint to create a new milestone submission
 * Accepts file URLs (from Vercel Blob) and external links
 */
async function handlerImpl(req, res) {
  // Only allow POST method for submissions
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    // Get the current session and user
    const session = await auth0.getSession(req, res)
    if (!session?.user) {
      return res.status(401).json({ error: "Not authenticated" })
    }

    // Extract data from the request body
    const { teamId, milestoneId, fileUrls = [], link, comments } = req.body

    // Validate required fields
    if (!teamId) {
      return res.status(400).json({ error: "Team ID is required" })
    }

    if (!milestoneId) {
      return res.status(400).json({ error: "Milestone ID is required" })
    }

    // Make sure we have either files or a link
    if (fileUrls.length === 0 && !link) {
      return res.status(400).json({ error: "Please provide either file URLs or a link" })
    }

    // Get the Airtable table ID from environment variables
    const submissionsTableId = process.env.AIRTABLE_SUBMISSIONS_TABLE_ID

    if (!submissionsTableId) {
      return res.status(500).json({ error: "Submissions table not configured" })
    }

    // Initialize the submissions table
    const submissionsTable = base(submissionsTableId)

    // Process file attachments (using URLs instead of base64)
    let fileAttachments = []
    if (fileUrls && fileUrls.length > 0) {
      // Convert URLs to Airtable attachment format
      fileAttachments = fileUrls.map(fileInfo => ({
        url: fileInfo.url,
        filename: fileInfo.filename || fileInfo.url.split('/').pop() || 'file'
      }))
      
      console.log(`Processing ${fileAttachments.length} file URLs for submission`);
      
      // Log sample attachment for debugging
      if (fileAttachments.length > 0) {
        console.log(`Sample attachment: ${JSON.stringify(fileAttachments[0])}`);
      }
    }

    // Create submission record
    const record = {
      Team: [teamId],
      Comments: comments || "",
      Milestone: [milestoneId]
    }
    
    // Log the record creation for debugging
    console.log(`Creating submission record with Team: ${teamId}, Milestone: ${milestoneId}`)

    // Add link if provided
    if (link) {
      record.Link = link
    }

    // Add attachments if any
    if (fileAttachments.length > 0) {
      console.log(`Adding ${fileAttachments.length} file URL attachments to the record`);
      
      // Airtable accepts an array of objects with URL property
      record.Attachment = fileAttachments;
    }

    // Create the submission in Airtable
    try {
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
      
      // Fallback approach if there's an issue with attachments
      if (submitError.error === 'INVALID_ATTACHMENT_OBJECT' || 
          (submitError.message && submitError.message.includes('attachment'))) {
        console.log("Detected attachment error, attempting alternate submission method");
        
        try {
          // Remove attachments and just submit with a comment about files
          delete record.Attachment;
          
          // Add a note to the comments with the file URLs
          const fileUrlsList = fileAttachments.map(file => `- ${file.filename}: ${file.url}`).join('\n');
          record.Comments = (record.Comments || "") + 
            `\n\n[Note: Files were uploaded but couldn't be attached directly. Access them at the following URLs:]\n${fileUrlsList}`;
          
          // Try again without the attachments
          const submission = await submissionsTable.create(record);
          
          return res.status(201).json({
            success: true,
            warning: "Files were uploaded but couldn't be attached directly. URLs have been included in the comments.",
            submission: {
              id: submission.id,
              teamId,
              milestoneId,
              hasAttachments: false,
              attachmentCount: 0,
              fileUrls: fileAttachments.map(file => file.url),
              hasLink: !!link,
            }
          });
        } catch (retryError) {
          console.error("Retry submission without attachments also failed:", retryError);
          return res.status(500).json({ 
            error: "Failed to create submission", 
            details: "Couldn't attach files and fallback method also failed.",
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
    
    return res.status(500).json({ 
      error: "Failed to create submission", 
      details: error.message || "Unknown error"
    });
  }
}

export default async function handler(req, res) {
  try {
    // Check for valid Auth0 session
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Call the original handler with the authenticated session
    return handlerImpl(req, res);
  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}