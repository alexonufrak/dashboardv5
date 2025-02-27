import Airtable from "airtable"

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID)

// Tables
// Add null checks to prevent errors if environment variables are missing
const contactsTable = process.env.AIRTABLE_CONTACTS_TABLE_ID 
  ? base(process.env.AIRTABLE_CONTACTS_TABLE_ID) 
  : null;

const institutionsTable = process.env.AIRTABLE_INSTITUTIONS_TABLE_ID 
  ? base(process.env.AIRTABLE_INSTITUTIONS_TABLE_ID) 
  : null;

const educationTable = process.env.AIRTABLE_EDUCATION_TABLE_ID 
  ? base(process.env.AIRTABLE_EDUCATION_TABLE_ID) 
  : null;

const programsTable = process.env.AIRTABLE_PROGRAMS_TABLE_ID 
  ? base(process.env.AIRTABLE_PROGRAMS_TABLE_ID) 
  : null;

const initiativesTable = process.env.AIRTABLE_INITIATIVES_TABLE_ID 
  ? base(process.env.AIRTABLE_INITIATIVES_TABLE_ID) 
  : null;

const cohortsTable = process.env.AIRTABLE_COHORTS_TABLE_ID 
  ? base(process.env.AIRTABLE_COHORTS_TABLE_ID) 
  : null;

const partnershipsTable = process.env.AIRTABLE_PARTNERSHIPS_TABLE_ID 
  ? base(process.env.AIRTABLE_PARTNERSHIPS_TABLE_ID) 
  : null;

const topicsTable = process.env.AIRTABLE_TOPICS_TABLE_ID 
  ? base(process.env.AIRTABLE_TOPICS_TABLE_ID) 
  : null;

const classesTable = process.env.AIRTABLE_CLASSES_TABLE_ID 
  ? base(process.env.AIRTABLE_CLASSES_TABLE_ID) 
  : null;

/**
 * Get user profile from Airtable by email instead of Auth0 user ID
 * @param {string} userId - Auth0 user ID (not used for lookup but kept for compatibility)
 * @param {string} email - User's email address
 * @returns {Promise<Object>} User profile data
 */
export async function getUserProfile(userId, email) {
  try {
    // Look for contact with matching email instead of Memberstack ID
    const records = await contactsTable
      .select({
        filterByFormula: `{Email}="${email}"`,
        maxRecords: 1,
      })
      .firstPage()

    if (records && records.length > 0) {
      return {
        contactId: records[0].id,
        ...records[0].fields,
      }
    }
    
    return null
  } catch (error) {
    console.error("Error fetching user profile:", error)
    throw new Error("Failed to fetch user profile")
  }
}

/**
 * Get institution details by ID
 * @param {string} institutionId - Airtable institution ID
 * @returns {Promise<Object>} Institution data
 */
export async function getInstitution(institutionId) {
  try {
    const institution = await institutionsTable.find(institutionId)
    
    if (institution) {
      return {
        id: institution.id,
        ...institution.fields,
      }
    }
    
    return null
  } catch (error) {
    console.error("Error fetching institution:", error)
    throw new Error("Failed to fetch institution details")
  }
}

/**
 * Update user profile in Airtable
 * @param {string} contactId - Airtable contact ID
 * @param {Object} data - Updated profile data
 * @returns {Promise<Object>} Updated profile
 */
export async function updateUserProfile(contactId, data) {
  try {
    console.log("Updating user profile with data:", JSON.stringify(data, null, 2));
    
    // Validate the Degree Type to ensure it's one of the allowed values
    const validDegreeTypes = ["Undergraduate", "Graduate", "Doctorate", "Certificate"];
    const degreeType = validDegreeTypes.includes(data.DegreeType) ? data.DegreeType : null;
    
    if (!degreeType && data.DegreeType) {
      console.warn(`Invalid degree type: "${data.DegreeType}". Must be one of: ${validDegreeTypes.join(", ")}`);
    }
    
    // Parse graduation year (if provided)
    let graduationYear = null;
    if (data.GraduationYear) {
      // Remove any non-digit characters and convert to number
      graduationYear = parseInt(String(data.GraduationYear).replace(/\D/g, ''), 10);
      if (isNaN(graduationYear)) {
        console.warn("Invalid graduation year format:", data.GraduationYear);
        graduationYear = null;
      }
    }
    
    // Update the contact record with basic information
    const contactData = {
      "First Name": data.FirstName,
      "Last Name": data.LastName,
    };
    
    const updatedContact = await contactsTable.update(contactId, contactData);
    
    // Attempt to find existing education record if ID not provided
    let educationId = data.educationId;
    
    if (!educationId && updatedContact.fields.Education && updatedContact.fields.Education.length > 0) {
      educationId = updatedContact.fields.Education[0];
      console.log("Found existing education record from contact:", educationId);
    }
    
    // If we have an education record ID, update the education record
    if (educationId) {
      console.log(`Updating education record ${educationId} with academic information`);
      
      // Create education data object with only valid fields
      const educationData = {};
      
      // Only add degree type if it's valid
      if (degreeType) {
        educationData["Degree Type"] = degreeType;
      }
      
      // Only add graduation year if it's valid
      if (graduationYear) {
        educationData["Graduation Year"] = graduationYear;
      }
      
      // For Major in education records, it's a linked record
      if (data.Major) {
        educationData["Major"] = [data.Major]; // Format as array with single ID
      }
      
      // For Institution in education records, it's a linked record
      if (data.InstitutionId) {
        educationData["Institution"] = [data.InstitutionId]; // Format as array with single ID
      }
      
      // Only update if we have data to update
      if (Object.keys(educationData).length > 0) {
        console.log("Education data to update:", educationData);
        await educationTable.update(educationId, educationData);
      } else {
        console.log("No valid education data to update");
      }
    } 
    // Create a new education record if needed
    else if (data.InstitutionId || degreeType || graduationYear || data.Major) {
      console.log("Creating new education record");
      
      // Create basic education data with only valid fields
      const educationData = {
        "Contact": [contactId], // Link to the contact
      };
      
      // Add optional fields if available and valid
      if (data.InstitutionId) {
        educationData["Institution"] = [data.InstitutionId];
      }
      
      if (degreeType) {
        educationData["Degree Type"] = degreeType;
      }
      
      if (graduationYear) {
        educationData["Graduation Year"] = graduationYear;
      }
      
      if (data.Major) {
        educationData["Major"] = [data.Major];
      }
      
      console.log("New education data:", educationData);
      
      // Create new education record
      const newEducation = await educationTable.create(educationData);
      console.log("Created new education record:", newEducation.id);
      
      // Update the contact to link to this new education record
      await contactsTable.update(contactId, {
        "Education": [newEducation.id]
      });
    } else {
      console.log("No education data provided to create or update education record");
    }
    
    // Return the updated contact with its fields
    return {
      contactId: updatedContact.id,
      ...updatedContact.fields,
    };
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw new Error("Failed to update user profile");
  }
}

/**
 * Look up institution by email domain
 * @param {string} email - User's email address
 * @returns {Promise<Object|null>} Institution data or null if not found
 */
export async function lookupInstitutionByEmail(email) {
  try {
    if (!email || !institutionsTable) {
      return null;
    }
    
    // Extract domain from email
    const domainMatch = email.match(/@(.+)$/);
    if (!domainMatch || !domainMatch[1]) {
      return null;
    }
    
    const domain = domainMatch[1];
    console.log(`Looking up institution for domain: "${domain}"`);
    
    // Pre-filter with FIND to get candidates
    const recordsQuery = await institutionsTable.select({
      fields: ['Name', 'Domains'],
      filterByFormula: `OR(FIND("${domain},", {Domains}), FIND("${domain}", {Domains}))`
    }).firstPage();
    
    // If no results, try to get all records as fallback
    const records = recordsQuery.length > 0 ? recordsQuery : 
      await institutionsTable.select({
        fields: ['Name', 'Domains'],
      }).firstPage();
    
    // Filter records manually to match exact domains
    const matchingRecords = records.filter(record => {
      if (!record.fields.Domains) return false;
      
      // Split domains by comma and trim whitespace
      const domainList = record.fields.Domains.split(',').map(d => d.trim());
      
      // Check if domain matches exactly
      return domainList.includes(domain);
    });
    
    if (matchingRecords && matchingRecords.length > 0) {
      // Return the first matching institution
      return {
        id: matchingRecords[0].id,
        name: matchingRecords[0].fields.Name,
        domains: matchingRecords[0].fields.Domains
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error looking up institution by email:", error);
    return null;
  }
}

/**
 * Get education record by ID
 * @param {string} educationId - Airtable education record ID
 * @returns {Promise<Object>} Education data
 */
export async function getEducation(educationId) {
  try {
    const education = await educationTable.find(educationId)
    
    if (education) {
      return {
        id: education.id,
        ...education.fields,
      }
    }
    
    return null
  } catch (error) {
    console.error("Error fetching education record:", error)
    throw new Error("Failed to fetch education details")
  }
}

/**
 * Get program (major) details by ID
 * @param {string} programId - Airtable program ID
 * @returns {Promise<Object>} Program data
 */
export async function getProgram(programId) {
  try {
    if (!programsTable) {
      console.error("Programs table not initialized - missing environment variable");
      return null;
    }
    
    const program = await programsTable.find(programId);
    
    if (program) {
      return {
        id: program.id,
        ...program.fields,
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching program:", error);
    return null;
  }
}

/**
 * Get all programs (majors)
 * @returns {Promise<Array>} Array of program data objects
 */
export async function getAllPrograms() {
  try {
    if (!programsTable) {
      console.error("Programs table not initialized - missing environment variable");
      return [];
    }
    
    // Get all programs from the Programs table
    const records = await programsTable.select({
      sort: [{ field: "Major", direction: "asc" }]
    }).firstPage();
    
    return records.map(record => ({
      id: record.id,
      name: record.fields.Major || "Unnamed Major",
      ...record.fields
    }));
  } catch (error) {
    console.error("Error fetching programs:", error);
    return [];
  }
}

/**
 * Get initiative details by ID
 * @param {string} initiativeId - Airtable initiative ID
 * @returns {Promise<Object>} Initiative data
 */
export async function getInitiative(initiativeId) {
  try {
    if (!initiativesTable) {
      console.error("Initiatives table not initialized - missing environment variable");
      return null;
    }
    
    const initiative = await initiativesTable.find(initiativeId);
    
    if (initiative) {
      return {
        id: initiative.id,
        ...initiative.fields,
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching initiative:", error);
    return null;
  }
}

/**
 * Get topic details by ID
 * @param {string} topicId - Airtable topic ID
 * @returns {Promise<Object>} Topic data
 */
export async function getTopic(topicId) {
  try {
    if (!topicsTable) {
      console.error("Topics table not initialized - missing environment variable");
      return null;
    }
    
    const topic = await topicsTable.find(topicId);
    
    if (topic) {
      return {
        id: topic.id,
        ...topic.fields,
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching topic:", error);
    return null;
  }
}

/**
 * Get class details by ID
 * @param {string} classId - Airtable class ID
 * @returns {Promise<Object>} Class data
 */
export async function getClass(classId) {
  try {
    if (!classesTable) {
      console.error("Classes table not initialized - missing environment variable");
      return null;
    }
    
    const classRecord = await classesTable.find(classId);
    
    if (classRecord) {
      return {
        id: classRecord.id,
        ...classRecord.fields,
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching class:", error);
    return null;
  }
}

/**
 * Get cohorts available for an institution
 * @param {string} institutionId - Airtable institution ID
 * @returns {Promise<Array>} List of cohorts
 */
export async function getCohortsByInstitution(institutionId) {
  try {
    if (!partnershipsTable || !cohortsTable || !initiativesTable || !topicsTable || !classesTable) {
      console.error("Required tables not initialized - missing environment variables");
      return [];
    }
    
    console.log(`Looking for partnerships with institution ID: ${institutionId}`);
    
    // Step 1: Get partnerships with this institution ID - direct approach
    let partnerships = [];
    try {
      // Just get ALL partnerships and filter client-side - most reliable approach
      const allPartnerships = await partnershipsTable.select().firstPage();
      
      // Filter for partnerships that include our institution ID
      partnerships = allPartnerships.filter(partnership => {
        const institutions = partnership.fields.Institution || [];
        return institutions.includes(institutionId);
      });
      
      console.log(`Found ${partnerships.length} partnerships for institution ${institutionId}`);
    } catch (error) {
      console.error("Error fetching partnerships:", error);
      return [];
    }
    
    if (partnerships.length === 0) {
      console.log("No partnerships found for this institution");
      return [];
    }
    
    // Step 2: Get cohort IDs from partnerships
    const cohortIds = [];
    partnerships.forEach(partnership => {
      const partnershipCohorts = partnership.fields.Cohorts || [];
      partnershipCohorts.forEach(cohortId => {
        if (!cohortIds.includes(cohortId)) {
          cohortIds.push(cohortId);
        }
      });
    });
    
    console.log(`Found ${cohortIds.length} unique cohort IDs:`, cohortIds);
    
    if (cohortIds.length === 0) {
      console.log("No cohorts found in partnerships");
      return [];
    }
    
    // Step 3: Fetch each cohort directly by ID for maximum reliability
    const cohorts = [];
    const initiativeIds = new Set(); // Track unique initiative IDs
    const topicIds = new Set(); // Track unique topic IDs
    const classIds = new Set(); // Track unique class IDs
    
    for (const cohortId of cohortIds) {
      try {
        const cohort = await cohortsTable.find(cohortId);
        console.log(`Fetched cohort ${cohortId}, status: ${cohort.fields.Status}`);
        
        // Only process cohorts with "Applications Open" status
        if (cohort.fields.Status === "Applications Open") {
          // Track initiative IDs for later lookup
          if (cohort.fields.Initiative && cohort.fields.Initiative.length > 0) {
            cohort.fields.Initiative.forEach(id => initiativeIds.add(id));
          }
          
          // Track topic IDs for later lookup
          if (cohort.fields.Topics && cohort.fields.Topics.length > 0) {
            cohort.fields.Topics.forEach(id => topicIds.add(id));
          }
          
          // Track class IDs for later lookup
          if (cohort.fields.Classes && cohort.fields.Classes.length > 0) {
            cohort.fields.Classes.forEach(id => classIds.add(id));
          }
          
          cohorts.push({
            id: cohort.id,
            ...cohort.fields
          });
        }
      } catch (error) {
        console.error(`Error fetching cohort ${cohortId}:`, error);
      }
    }
    
    // Step 4: Fetch all linked records in batches
    
    // 4.1: Fetch initiatives
    const initiativeDetails = {};
    if (initiativeIds.size > 0) {
      try {
        // Create a filter formula to get all initiatives at once
        const initiativeIdsArray = Array.from(initiativeIds);
        const initiativeConditions = initiativeIdsArray.map(id => `RECORD_ID()="${id}"`).join(",");
        const filterFormula = `OR(${initiativeConditions})`;
        
        const initiatives = await initiativesTable
          .select({
            filterByFormula: filterFormula
          })
          .firstPage();
        
        // Create a lookup map for initiatives
        initiatives.forEach(initiative => {
          initiativeDetails[initiative.id] = {
            name: initiative.fields.Name || "Untitled Initiative",
            description: initiative.fields.Description || ""
          };
        });
        
        console.log(`Fetched ${initiatives.length} initiatives`);
      } catch (error) {
        console.error("Error fetching initiatives:", error);
      }
    }
    
    // 4.2: Fetch topics
    const topicDetails = {};
    if (topicIds.size > 0) {
      try {
        const topicIdsArray = Array.from(topicIds);
        const topicConditions = topicIdsArray.map(id => `RECORD_ID()="${id}"`).join(",");
        const filterFormula = `OR(${topicConditions})`;
        
        const topics = await topicsTable
          .select({
            filterByFormula: filterFormula
          })
          .firstPage();
        
        topics.forEach(topic => {
          topicDetails[topic.id] = {
            name: topic.fields.Name || "Untitled Topic",
            description: topic.fields.Description || ""
          };
        });
        
        console.log(`Fetched ${topics.length} topics:`, topicDetails);
      } catch (error) {
        console.error("Error fetching topics:", error);
      }
    }
    
    // 4.3: Fetch classes
    const classDetails = {};
    if (classIds.size > 0) {
      try {
        const classIdsArray = Array.from(classIds);
        const classConditions = classIdsArray.map(id => `RECORD_ID()="${id}"`).join(",");
        const filterFormula = `OR(${classConditions})`;
        
        const classes = await classesTable
          .select({
            filterByFormula: filterFormula
          })
          .firstPage();
        
        classes.forEach(classItem => {
          classDetails[classItem.id] = {
            name: classItem.fields.Name || "Untitled Class"
          };
        });
        
        console.log(`Fetched ${classes.length} classes:`, classDetails);
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    }
    
    // Step 5: Enhance cohorts with all details
    const enhancedCohorts = cohorts.map(cohort => {
      const result = { ...cohort };
      
      // Add initiative details if available
      if (cohort.Initiative && cohort.Initiative.length > 0) {
        const initiativeId = cohort.Initiative[0];
        if (initiativeDetails[initiativeId]) {
          result.initiativeDetails = initiativeDetails[initiativeId];
        }
      }
      
      // Add topic details if available
      if (cohort.Topics && cohort.Topics.length > 0) {
        const topicNames = cohort.Topics.map(topicId => 
          topicDetails[topicId]?.name || "Unknown Topic"
        ).filter(name => name !== "Unknown Topic"); // Only include topics we found
        
        if (topicNames.length > 0) {
          result.topicNames = topicNames;
        }
      }
      
      // Add class details if available
      if (cohort.Classes && cohort.Classes.length > 0) {
        const classNames = cohort.Classes.map(classId => 
          classDetails[classId]?.name || "Unknown Class"
        ).filter(name => name !== "Unknown Class"); // Only include classes we found
        
        if (classNames.length > 0) {
          result.classNames = classNames;
        }
      }
      
      return result;
    });
    
    console.log(`Found ${enhancedCohorts.length} open cohorts with details`);
    
    // Log a sample cohort
    if (enhancedCohorts.length > 0) {
      console.log("Sample cohort with details:", enhancedCohorts[0]);
    }
    
    return enhancedCohorts;
  } catch (error) {
    console.error("Error in getCohortsByInstitution:", error);
    return [];
  }
}

/**
 * Get teams where the user is a member
 * @param {string} contactId - Airtable contact ID
 * @returns {Promise<Object|null>} Team data with members or null if no team found
 */
export async function getUserTeams(contactId) {
  try {
    if (!contactId) {
      console.error("Contact ID is required to fetch user teams");
      return null;
    }
    
    // Get the Teams table ID from environment variables
    const teamsTableId = process.env.AIRTABLE_TEAMS_TABLE_ID;
    if (!teamsTableId) {
      console.error("Teams table ID not configured");
      return null;
    }
    
    // Initialize the teams table
    const teamsTable = base(teamsTableId);
    
    // Get the Members table ID from environment variables  
    const membersTableId = process.env.AIRTABLE_MEMBERS_TABLE_ID;
    if (!membersTableId) {
      console.error("Members table ID not configured");
      return null;
    }
    
    // Initialize the members table
    const membersTable = base(membersTableId);
    
    // First, we need to get the Contact record to find the Members links
    const contactsTable = base(process.env.AIRTABLE_CONTACTS_TABLE_ID);
    
    // Get the contact record with its Member links
    console.log(`Getting contact record ${contactId} to find member links`);
    const contactRecord = await contactsTable.find(contactId);
    
    if (!contactRecord || !contactRecord.fields.Members || !contactRecord.fields.Members.length) {
      console.log(`No Members found in contact record ${contactId}`);
      return null;
    }
    
    // Get the Member record IDs linked to this contact
    const memberIds = contactRecord.fields.Members;
    console.log(`Found ${memberIds.length} member records linked to contact ${contactId}:`, memberIds);
    
    // Get the Member records
    let memberRecords = [];
    for (let i = 0; i < memberIds.length; i++) {
      try {
        const memberRecord = await membersTable.find(memberIds[i]);
        memberRecords.push(memberRecord);
      } catch (error) {
        console.error(`Error fetching member record ${memberIds[i]}:`, error);
      }
    }
    
    console.log(`Retrieved ${memberRecords.length} member records`);
    
    if (memberRecords.length === 0) {
      return null;
    }
    
    // Filter to get active member records with Team links
    const activeMembers = memberRecords.filter(member => {
      const status = member.fields.Status ? String(member.fields.Status).trim().toLowerCase() : '';
      console.log("Member record:", member); // Log the entire member record
      console.log(`  Status from record: ${member.fields.Status}, processed status: ${status}`); // Log status values
      return status === "active" &&
             member.fields.Team &&
             member.fields.Team.length > 0;
    });
    
    if (activeMembers.length === 0) {
      console.log("No active member records with team links found");
      return null;
    }
    
    console.log(`Found ${activeMembers.length} active member records with team links`);
    
    // Get the team ID from the first active member record
    const teamId = activeMembers[0].fields.Team[0];
    console.log(`Using team ID: ${teamId}`);
    
    // Get the team details
    const team = await teamsTable.find(teamId);
    
    if (!team) {
      console.log(`Team ${teamId} not found`);
      return null;
    }
    
    console.log(`Found team:`, team.fields);
    
    // Get all members of this team using the member IDs from the team record
    console.log(`Getting all members of team ${teamId} by member IDs`);
    const teamMemberIds = team.fields.Members || [];
    console.log("Team member IDs:", teamMemberIds);

    // Process in batches to avoid formula length limits
    const memberBatches = [];
    for (let i = 0; i < teamMemberIds.length; i += 10) {
        const batchIds = teamMemberIds.slice(i, i + 10);
        const conditions = batchIds.map(id => `RECORD_ID()="${id}"`).join(",");
        memberBatches.push(
            membersTable.select({
                filterByFormula: `OR(${conditions})`,
                fields: ["Contact", "Status"]
            }).firstPage()
        );
    }

    const teamMembersResults = await Promise.all(memberBatches);
    const teamMembers = teamMembersResults.flat();
    
    // Get contact IDs for all members
    const memberContactIds = teamMembers
      // .filter(member => member.fields.Status === "Active") // Only get active members - commented out to include all members regardless of status
      .map(member => member.fields.Contact?.[0])
      .filter(Boolean);
    
    console.log(`Found ${memberContactIds.length} active members for this team`);
    
    // Create a lookup mapping of contact IDs to member records
    const memberLookup = {};
    teamMembers.forEach(member => {
      if (member.fields.Contact && member.fields.Contact.length > 0) {
        memberLookup[member.fields.Contact[0]] = {
          id: member.id,
          status: member.fields.Status
        };
      }
    });
    
    // Fetch all member contacts in a single query
    let memberContacts = [];
    if (memberContactIds.length > 0) {
      const contactBatches = [];
      
      // Process in batches of 10 to avoid filter length limitations
      for (let i = 0; i < memberContactIds.length; i += 10) {
        const batchIds = memberContactIds.slice(i, i + 10);
        const conditions = batchIds.map(id => `RECORD_ID()="${id}"`).join(",");
        const formula = `OR(${conditions})`;
        
        contactBatches.push(
          contactsTable.select({
            filterByFormula: formula,
            fields: ["First Name", "Last Name", "Email"]
          }).firstPage()
        );
      }
      
      const contactResults = await Promise.all(contactBatches);
      memberContacts = contactResults.flat();
    }
    
    // Map contact details to member records
    const members = memberContacts.map(contact => {
      const memberInfo = memberLookup[contact.id] || {};
      const firstName = contact.fields["First Name"] || "";
      const lastName = contact.fields["Last Name"] || "";
      
      return {
        id: contact.id,
        name: `${firstName} ${lastName}`.trim(),
        email: contact.fields.Email,
        status: memberInfo.status || "Inactive",
        isCurrentUser: contact.id === contactId
      };
    });
    
    // Use the actual field names from the team record
    const teamName = team.fields.Name || team.fields["Team Name"];
    let teamPoints = null;
    if (team.fields["Team Points"] !== undefined) {
      teamPoints = team.fields["Team Points"];
    } else if (team.fields["Total Points"] !== undefined) {
      teamPoints = team.fields["Total Points"];
    } else if (team.fields.Points !== undefined) {
      teamPoints = team.fields.Points;
    }
    
    // Return the team with member details
    return {
      id: team.id,
      name: teamName,
      description: team.fields.Description,
      points: teamPoints,
      members: members
    };
  } catch (error) {
    console.error("Error fetching user teams:", error);
    return null;
  }
}

export default {
  getUserProfile,
  getInstitution,
  getEducation,
  getProgram,
  getAllPrograms,
  getInitiative,
  getTopic,
  getClass,
  getCohortsByInstitution,
  updateUserProfile,
  getUserTeams,
  lookupInstitutionByEmail,
}