import { executeQuery, getCachedOrFetch, handleAirtableError } from '../core';
import * as tables from '../tables';

/**
 * Fetches a submission record by its ID
 * @param {string} submissionId - The ID of the submission to fetch
 * @returns {Promise<Object|null>} The submission record or null if not found
 */
export async function fetchSubmissionById(submissionId) {
  if (!submissionId) {
    throw new Error('Submission ID is required');
  }

  try {
    const response = await executeQuery({
      table: tables.MILESTONE_SUBMISSIONS,
      operation: 'find',
      id: submissionId
    });

    return response ? normalizeSubmission(response) : null;
  } catch (error) {
    throw handleAirtableError(error, 'Error fetching submission', { submissionId });
  }
}

/**
 * Fetches submission records by team ID
 * @param {string} teamId - The ID of the team
 * @returns {Promise<Array<Object>>} Array of submission records
 */
export async function fetchSubmissionsByTeam(teamId) {
  if (!teamId) {
    throw new Error('Team ID is required');
  }

  try {
    const response = await executeQuery({
      table: tables.MILESTONE_SUBMISSIONS,
      operation: 'select',
      params: {
        filterByFormula: `{Team Record ID} = '${teamId}'`,
        sort: [{ field: 'Created Time', direction: 'desc' }]
      }
    });

    return response ? response.map(normalizeSubmission) : [];
  } catch (error) {
    throw handleAirtableError(error, 'Error fetching team submissions', { teamId });
  }
}

/**
 * Fetches submission records by cohort milestone ID
 * @param {string} milestoneId - The ID of the milestone
 * @returns {Promise<Array<Object>>} Array of submission records
 */
export async function fetchSubmissionsByMilestone(milestoneId) {
  if (!milestoneId) {
    throw new Error('Milestone ID is required');
  }
  
  try {
    const response = await executeQuery({
      table: tables.MILESTONE_SUBMISSIONS,
      operation: 'select',
      params: {
        filterByFormula: `{Milestone Record ID} = '${milestoneId}'`,
        sort: [{ field: 'Created Time', direction: 'desc' }]
      }
    });

    return response ? response.map(normalizeSubmission) : [];
  } catch (error) {
    throw handleAirtableError(error, 'Error fetching milestone submissions', { milestoneId });
  }
}

/**
 * Creates a new milestone submission
 * @param {Object} submissionData - Data for the new submission
 * @returns {Promise<Object>} The created submission record
 */
export async function createSubmission(submissionData) {
  if (!submissionData.teamId) {
    throw new Error('Team ID is required for submission');
  }
  
  if (!submissionData.milestoneId) {
    throw new Error('Milestone ID is required for submission');
  }

  try {
    const fields = {
      'Team Record ID': submissionData.teamId,
      'Milestone Record ID': submissionData.milestoneId,
      'Submission Text': submissionData.text || '',
      'Submission Link': submissionData.link || '',
      'Files': submissionData.files || [],
      'Status': submissionData.status || 'Submitted'
    };

    const response = await executeQuery({
      table: tables.MILESTONE_SUBMISSIONS,
      operation: 'create',
      data: { fields }
    });

    return response ? normalizeSubmission(response) : null;
  } catch (error) {
    throw handleAirtableError(error, 'Error creating submission', { submissionData });
  }
}

/**
 * Updates an existing submission
 * @param {string} submissionId - The ID of the submission to update
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object>} The updated submission
 */
export async function updateSubmission(submissionId, updateData) {
  if (!submissionId) {
    throw new Error('Submission ID is required');
  }

  try {
    const fields = {};
    
    // Only include fields that are being updated
    if (updateData.text !== undefined) {
      fields['Submission Text'] = updateData.text;
    }
    
    if (updateData.link !== undefined) {
      fields['Submission Link'] = updateData.link;
    }
    
    if (updateData.files !== undefined) {
      fields['Files'] = updateData.files;
    }
    
    if (updateData.status !== undefined) {
      fields['Status'] = updateData.status;
    }
    
    if (updateData.feedback !== undefined) {
      fields['Feedback'] = updateData.feedback;
    }

    const response = await executeQuery({
      table: tables.MILESTONE_SUBMISSIONS,
      operation: 'update',
      id: submissionId,
      data: { fields }
    });

    return response ? normalizeSubmission(response) : null;
  } catch (error) {
    throw handleAirtableError(error, 'Error updating submission', { submissionId, updateData });
  }
}

/**
 * Gets a submission by ID (with caching)
 * @param {string} submissionId - The ID of the submission to fetch
 * @returns {Promise<Object|null>} The submission record or null if not found
 */
export async function getSubmissionById(submissionId) {
  return getCachedOrFetch(`submission_${submissionId}`, () => fetchSubmissionById(submissionId));
}

/**
 * Gets submissions by team ID (with caching)
 * @param {string} teamId - The ID of the team
 * @returns {Promise<Array<Object>>} Array of submission records
 */
export async function getSubmissionsByTeam(teamId) {
  return getCachedOrFetch(`team_submissions_${teamId}`, () => fetchSubmissionsByTeam(teamId));
}

/**
 * Gets submissions by milestone ID (with caching)
 * @param {string} milestoneId - The ID of the milestone
 * @returns {Promise<Array<Object>>} Array of submission records
 */
export async function getSubmissionsByMilestone(milestoneId) {
  return getCachedOrFetch(`milestone_submissions_${milestoneId}`, () => fetchSubmissionsByMilestone(milestoneId));
}

/**
 * Normalizes a submission record from Airtable format to a consistent application format
 * @param {Object} record - The Airtable record
 * @returns {Object} Normalized submission object
 */
function normalizeSubmission(record) {
  if (!record || !record.fields) {
    return null;
  }

  const fields = record.fields;
  
  return {
    id: record.id,
    teamId: fields['Team Record ID'] || null,
    milestoneId: fields['Milestone Record ID'] || null,
    teamName: fields['Team Name'] || null,
    milestoneName: fields['Milestone Name'] || null,
    text: fields['Submission Text'] || '',
    link: fields['Submission Link'] || '',
    files: fields['Files'] || [],
    status: fields['Status'] || 'Pending',
    feedback: fields['Feedback'] || '',
    createdTime: fields['Created Time'] || null,
    updatedTime: fields['Last Modified Time'] || null,
    submittedBy: fields['Submitted By'] ? {
      id: fields['Submitted By Record ID'] || null,
      name: fields['Submitted By Name'] || null,
      email: fields['Submitted By Email'] || null
    } : null,
    reviewedBy: fields['Reviewed By'] ? {
      id: fields['Reviewed By Record ID'] || null,
      name: fields['Reviewed By Name'] || null
    } : null
  };
}