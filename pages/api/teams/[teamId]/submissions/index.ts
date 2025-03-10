import { NextApiRequest, NextApiResponse } from 'next';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import {
  queryRecords,
  createRecord,
  TABLES,
  formatAttachments
} from '@/lib/airtableClient';
import { uploadFileToBlob } from '@/lib/blobStorage';
import formidable from 'formidable';
import fs from 'fs';

/**
 * API route for team submissions
 * GET: List all submissions for a team
 * POST: Create a new submission
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Get the user session for auth
  const session = await getSession(req, res);
  
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Get team ID from URL
  const { teamId } = req.query;
  
  if (!teamId || Array.isArray(teamId)) {
    return res.status(400).json({ error: 'Invalid team ID' });
  }
  
  try {
    // Handle GET request - List submissions
    if (req.method === 'GET') {
      // Get optional milestone filter
      const { milestoneId } = req.query;
      
      // Build filter formula
      let filterFormula = `FIND("${teamId}", ARRAYJOIN({Team})) > 0`;
      
      // Add milestone filter if provided
      if (milestoneId && !Array.isArray(milestoneId)) {
        filterFormula = `AND(${filterFormula}, FIND("${milestoneId}", ARRAYJOIN({Milestone})) > 0)`;
      }
      
      // Query submissions
      const submissions = await queryRecords('SUBMISSIONS', filterFormula, {
        sort: [{ field: 'Created Time', direction: 'desc' }]
      });
      
      // Format submissions for API response
      const formattedSubmissions = submissions.map((submission: {
        id: string;
        Milestone?: string[];
        Name?: string[];
        Comments?: string;
        Attachment?: any[];
        'Created Time'?: string;
        Member?: string[];
      }) => ({
        id: submission.id,
        teamId,
        milestoneId: submission.Milestone ? submission.Milestone[0] : null,
        milestoneName: submission.Name ? submission.Name[0] : null,
        description: submission.Comments || '',
        attachments: (submission.Attachment || []).map((attachment: any) => ({
          url: attachment.url,
          filename: attachment.filename,
          size: attachment.size,
          type: attachment.type
        })),
        createdAt: submission['Created Time'],
        contributorIds: submission.Member || []
      }));
      
      return res.status(200).json({ submissions: formattedSubmissions });
    }
    
    // Handle POST request - Create new submission
    if (req.method === 'POST') {
      // Parse form data with files
      const form = new formidable.IncomingForm({
        keepExtensions: true,
        multiples: true,
      });
      
      const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          resolve([fields, files]);
        });
      });
      
      // Extract submission data
      const milestoneId = Array.isArray(fields.milestoneId) 
        ? (fields.milestoneId[0] as string)
        : (fields.milestoneId as string | undefined) || '';
      
      const description = Array.isArray(fields.description)
        ? (fields.description[0] as string)
        : (fields.description as string | undefined) || '';
      
      const contributorIds = Array.isArray(fields.contributors) 
        ? (fields.contributors as string[])
        : fields.contributors 
          ? [(fields.contributors as string)] 
          : [];
      
      const notes = Array.isArray(fields.notes)
        ? (fields.notes[0] as string)
        : (fields.notes as string | undefined) || '';
      
      const links = Array.isArray(fields.links) 
        ? (fields.links as string[]) 
        : fields.links
          ? [(fields.links as string)]
          : [];
      
      // Validate required fields
      if (!milestoneId) {
        return res.status(400).json({ error: 'Missing milestone ID' });
      }
      
      // Process file uploads (if any)
      const fileAttachments = [];
      
      // Handle file uploads through Vercel Blob
      if (files.files) {
        const fileArray = Array.isArray(files.files) ? files.files : [files.files];
        
        for (const file of fileArray) {
          // Read file as buffer instead of stream
          const fileBuffer = fs.readFileSync(file.filepath);
          
          // Upload file to Vercel Blob as ArrayBuffer
          const blobFile = await uploadFileToBlob(fileBuffer, {
            fileName: file.originalFilename || 'file',
            contentType: file.mimetype || 'application/octet-stream', // Provide fallback
            teamId,
            milestoneId,
          });
          
          fileAttachments.push({
            url: blobFile.url,
            filename: file.originalFilename || blobFile.filename
          });
        }
      }
      
      // Add any links as text in the description
      let finalDescription = description || '';
      if (links.length > 0) {
        finalDescription += '\n\nLinks:\n' + links.join('\n');
      }
      
      if (notes) {
        finalDescription += '\n\nAdditional Notes:\n' + notes;
      }
      
      // Create submission record in Airtable
      const submissionData: Record<string, any> = {
        Team: [teamId],
        Milestone: [milestoneId],
        Comments: finalDescription,
        Member: contributorIds.length > 0 ? contributorIds : undefined
      };
      
      // Add attachments if we have any
      if (fileAttachments.length > 0) {
        submissionData['Attachment'] = formatAttachments(fileAttachments);
      }
      
      // Create the submission record
      const submission = await createRecord('SUBMISSIONS', submissionData);
      
      return res.status(201).json({
        submission: {
          id: submission.id,
          teamId,
          milestoneId,
          description: finalDescription,
          attachments: fileAttachments,
          links,
          contributorIds,
          createdAt: submission['Created Time']
        }
      });
    }
    
    // Handle unsupported methods
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Submission API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error?.message || 'Unknown error occurred'
    });
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default withApiAuthRequired(handler);