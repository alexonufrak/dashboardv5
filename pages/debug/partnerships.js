import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0"
import Airtable from "airtable"

async function handler(req, res) {
  // Ensure this is only accessible in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: "Not found" });
  }
  
  const session = await getSession(req, res);
  if (!session || !session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { institutionId } = req.query;
    
    if (!institutionId) {
      return res.status(400).json({ error: "Institution ID is required" });
    }
    
    // Initialize Airtable
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    
    // Get the partnerships table
    const partnershipsTable = process.env.AIRTABLE_PARTNERSHIPS_TABLE_ID 
      ? base(process.env.AIRTABLE_PARTNERSHIPS_TABLE_ID) 
      : null;
      
    const cohortsTable = process.env.AIRTABLE_COHORTS_TABLE_ID 
      ? base(process.env.AIRTABLE_COHORTS_TABLE_ID) 
      : null;
    
    if (!partnershipsTable || !cohortsTable) {
      return res.status(500).json({ 
        error: "Missing table configuration",
        partnershipsTableConfigured: !!partnershipsTable,
        cohortsTableConfigured: !!cohortsTable
      });
    }
    
    // Fetch all partnerships
    const allPartnerships = await partnershipsTable.select().firstPage();
    
    // Filter for partnerships with this institution
    const matchedPartnerships = allPartnerships.filter(partnership => {
      const institutions = partnership.fields.Institution || [];
      return institutions.includes(institutionId);
    });
    
    // Extract cohort IDs
    const cohortIds = [];
    matchedPartnerships.forEach(partnership => {
      const partnershipCohorts = partnership.fields.Cohorts || [];
      partnershipCohorts.forEach(cohortId => {
        if (!cohortIds.includes(cohortId)) {
          cohortIds.push(cohortId);
        }
      });
    });
    
    // Fetch cohort details
    const cohorts = [];
    for (const cohortId of cohortIds) {
      try {
        const cohort = await cohortsTable.find(cohortId);
        cohorts.push({
          id: cohort.id,
          name: cohort.fields.Name || cohort.fields["Short Name"] || "Unnamed Cohort",
          status: cohort.fields.Status || "Unknown"
        });
      } catch (error) {
        console.error(`Error fetching cohort ${cohortId}:`, error);
      }
    }
    
    return res.status(200).json({
      institutionId,
      totalPartnerships: allPartnerships.length,
      partnerships: matchedPartnerships.map(p => ({
        id: p.id,
        institutionIds: p.fields.Institution || [],
        cohortIds: p.fields.Cohorts || [],
        type: p.fields.Type || "Unknown"
      })),
      cohortIds,
      cohorts
    });
    
  } catch (error) {
    console.error("Error in debug/partnerships API:", error);
    return res.status(500).json({ error: "Server error", message: error.message });
  }
}

export default withApiAuthRequired(handler);