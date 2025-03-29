import { auth0 } from '@/lib/auth0'
import { base } from '@/lib/airtable'

/**
 * API endpoint to get details for a specific cohort
 * @param {Object} req - Next.js API Request
 * @param {Object} res - Next.js API Response
 */
async function cohortDetailsHandler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the user session using Auth0 v4
    const session = await auth0.getSession(req, res)
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    
    // Get cohort ID from path parameter
    const { cohortId } = req.query
    
    if (!cohortId) {
      return res.status(400).json({ error: 'Cohort ID is required' })
    }
    
    // Get tables needed for cohort details
    const cohortsTable = base(process.env.AIRTABLE_COHORTS_TABLE_ID)
    const initiativesTable = base(process.env.AIRTABLE_INITIATIVES_TABLE_ID)
    const topicsTable = base(process.env.AIRTABLE_TOPICS_TABLE_ID)
    const classesTable = base(process.env.AIRTABLE_CLASSES_TABLE_ID)
    
    // Get cohort record
    const cohort = await cohortsTable.find(cohortId)
    
    if (!cohort) {
      return res.status(404).json({ error: 'Cohort not found' })
    }
    
    // Get initiative details if available
    let initiativeDetails = null
    if (cohort.fields.Initiative && cohort.fields.Initiative.length > 0) {
      try {
        const initiative = await initiativesTable.find(cohort.fields.Initiative[0])
        
        if (initiative) {
          initiativeDetails = {
            id: initiative.id,
            name: initiative.fields.Name || "Untitled Initiative",
            description: initiative.fields.Description || "",
            website: initiative.fields.Website || null,
            tagline: initiative.fields.Tagline || null,
            "Participation Type": initiative.fields["Participation Type"] || "Individual"
          }
        }
      } catch (error) {
        console.error(`Error fetching initiative for cohort ${cohortId}:`, error)
      }
    }
    
    // Get topic names if available
    let topicNames = []
    if (cohort.fields.Topics && cohort.fields.Topics.length > 0) {
      try {
        const topicIds = cohort.fields.Topics
        const topics = await Promise.all(
          topicIds.map(topicId => topicsTable.find(topicId))
        )
        
        topicNames = topics
          .filter(Boolean)
          .map(topic => topic.fields.Name || "Unknown Topic")
      } catch (error) {
        console.error(`Error fetching topics for cohort ${cohortId}:`, error)
      }
    }
    
    // Get class names if available
    let classNames = []
    if (cohort.fields.Classes && cohort.fields.Classes.length > 0) {
      try {
        const classIds = cohort.fields.Classes
        const classes = await Promise.all(
          classIds.map(classId => classesTable.find(classId))
        )
        
        classNames = classes
          .filter(Boolean)
          .map(cls => cls.fields.Name || "Unknown Class")
      } catch (error) {
        console.error(`Error fetching classes for cohort ${cohortId}:`, error)
      }
    }
    
    // Format cohort data
    const cohortData = {
      id: cohort.id,
      programId: cohort.fields.Program?.[0] || null,
      name: cohort.fields.Name || "Unnamed Cohort",
      description: cohort.fields.Description || "",
      "Short Name": cohort.fields["Short Name"] || "",
      "Start Date": cohort.fields["Start Date"] || null,
      "End Date": cohort.fields["End Date"] || null,
      "Application Deadline": cohort.fields["Application Deadline"] || null,
      "Status": cohort.fields.Status || "Unknown",
      "Location": cohort.fields.Location || null,
      "Format": cohort.fields.Format || null,
      "Application Form ID (Fillout)": cohort.fields["Application Form ID (Fillout)"] || null,
      "Action Button": cohort.fields["Action Button"] || "Apply Now",
      participationType: cohort.fields["Participation Type"] || 
                        (initiativeDetails ? initiativeDetails["Participation Type"] : "Individual"),
      initiativeDetails,
      topicNames,
      classNames
    }
    
    // Add cache control headers (5 minutes on server, 2 minutes on client)
    res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=300')
    
    return res.status(200).json({ 
      cohort: cohortData,
      _meta: {
        timestamp: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Error fetching cohort details:', error)
    return res.status(500).json({ error: 'Failed to fetch cohort details' })
  }
}

export default async function handlerImpl(req, res) {
  try {
    // Check for valid Auth0 session
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Call the original handler with the authenticated session
    return cohortDetailsHandler(req, res);
  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}