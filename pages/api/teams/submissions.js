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
            // Read the file and prepare for Airtable upload
            const fileData = fs.readFileSync(f.filepath)
            fileAttachments.push({
              filename: f.originalFilename,
              content: fileData.toString('base64'),
              type: f.mimetype
            })
          }
        } else {
          // Read the file and prepare for Airtable upload
          const fileData = fs.readFileSync(file.filepath)
          fileAttachments.push({
            filename: file.originalFilename,
            content: fileData.toString('base64'),
            type: file.mimetype
          })
        }
      }
    }

    // Create submission record
    const record = {
      Team: [teamId],
      Comments: comments || "",
      Milestone: [milestoneId]
    }

    // Add link if provided
    if (link) {
      record.Link = link
    }

    // Add attachments if any
    if (fileAttachments.length > 0) {
      record.Attachment = fileAttachments
    }

    // Create the submission in Airtable
    const submission = await submissionsTable.create(record)

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
    })
  } catch (error) {
    console.error("Error creating submission:", error)
    return res.status(500).json({ 
      error: "Failed to create submission", 
      details: error.message 
    })
  }
})