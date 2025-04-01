import { executeQuery, getCachedOrFetch, handleAirtableError } from '../core';
import * as tables from '../tables';

/**
 * Fetches resources by program/initiative ID
 * @param {string} programId - The ID of the program/initiative
 * @returns {Promise<Array<Object>>} Array of resources
 */
export async function fetchResourcesByProgram(programId) {
  if (!programId) {
    throw new Error('Program ID is required');
  }

  try {
    const response = await executeQuery({
      table: tables.RESOURCES,
      operation: 'select',
      params: {
        filterByFormula: `{Initiative Record ID} = '${programId}'`,
        sort: [{ field: 'Name', direction: 'asc' }]
      }
    });

    return response ? response.map(normalizeResource) : [];
  } catch (error) {
    throw handleAirtableError(error, 'Error fetching program resources', { programId });
  }
}

/**
 * Fetches resources by cohort ID
 * @param {string} cohortId - The ID of the cohort
 * @returns {Promise<Array<Object>>} Array of resources
 */
export async function fetchResourcesByCohort(cohortId) {
  if (!cohortId) {
    throw new Error('Cohort ID is required');
  }

  try {
    const response = await executeQuery({
      table: tables.RESOURCES,
      operation: 'select',
      params: {
        filterByFormula: `{Cohort Record ID} = '${cohortId}'`,
        sort: [{ field: 'Name', direction: 'asc' }]
      }
    });

    return response ? response.map(normalizeResource) : [];
  } catch (error) {
    throw handleAirtableError(error, 'Error fetching cohort resources', { cohortId });
  }
}

/**
 * Fetches resources that are marked as global (available to all users)
 * @returns {Promise<Array<Object>>} Array of global resources
 */
export async function fetchGlobalResources() {
  try {
    const response = await executeQuery({
      table: tables.RESOURCES,
      operation: 'select',
      params: {
        filterByFormula: `{Is Global} = TRUE()`,
        sort: [{ field: 'Name', direction: 'asc' }]
      }
    });

    return response ? response.map(normalizeResource) : [];
  } catch (error) {
    throw handleAirtableError(error, 'Error fetching global resources');
  }
}

/**
 * Fetches a specific resource by ID
 * @param {string} resourceId - The ID of the resource
 * @returns {Promise<Object|null>} The resource record or null if not found
 */
export async function fetchResourceById(resourceId) {
  if (!resourceId) {
    throw new Error('Resource ID is required');
  }

  try {
    const response = await executeQuery({
      table: tables.RESOURCES,
      operation: 'find',
      id: resourceId
    });

    return response ? normalizeResource(response) : null;
  } catch (error) {
    throw handleAirtableError(error, 'Error fetching resource', { resourceId });
  }
}

/**
 * Creates a new resource
 * @param {Object} resourceData - Data for the new resource
 * @returns {Promise<Object>} The created resource record
 */
export async function createResource(resourceData) {
  if (!resourceData.name) {
    throw new Error('Resource name is required');
  }

  try {
    const fields = {
      'Name': resourceData.name,
      'Description': resourceData.description || '',
      'URL': resourceData.url || '',
      'Type': resourceData.type || 'Link',
      'Category': resourceData.category || 'General',
      'Is Global': resourceData.isGlobal || false
    };

    // Add optional fields if they exist
    if (resourceData.programId) {
      fields['Initiative Record ID'] = resourceData.programId;
    }

    if (resourceData.cohortId) {
      fields['Cohort Record ID'] = resourceData.cohortId;
    }

    if (resourceData.fileAttachments) {
      fields['File Attachments'] = resourceData.fileAttachments;
    }

    const response = await executeQuery({
      table: tables.RESOURCES,
      operation: 'create',
      data: { fields }
    });

    return response ? normalizeResource(response) : null;
  } catch (error) {
    throw handleAirtableError(error, 'Error creating resource', { resourceData });
  }
}

/**
 * Updates an existing resource
 * @param {string} resourceId - The ID of the resource to update
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object>} The updated resource
 */
export async function updateResource(resourceId, updateData) {
  if (!resourceId) {
    throw new Error('Resource ID is required');
  }

  try {
    const fields = {};
    
    // Only include fields that are being updated
    if (updateData.name !== undefined) {
      fields['Name'] = updateData.name;
    }
    
    if (updateData.description !== undefined) {
      fields['Description'] = updateData.description;
    }
    
    if (updateData.url !== undefined) {
      fields['URL'] = updateData.url;
    }
    
    if (updateData.type !== undefined) {
      fields['Type'] = updateData.type;
    }

    if (updateData.category !== undefined) {
      fields['Category'] = updateData.category;
    }

    if (updateData.isGlobal !== undefined) {
      fields['Is Global'] = updateData.isGlobal;
    }

    if (updateData.programId !== undefined) {
      fields['Initiative Record ID'] = updateData.programId;
    }

    if (updateData.cohortId !== undefined) {
      fields['Cohort Record ID'] = updateData.cohortId;
    }

    if (updateData.fileAttachments !== undefined) {
      fields['File Attachments'] = updateData.fileAttachments;
    }

    const response = await executeQuery({
      table: tables.RESOURCES,
      operation: 'update',
      id: resourceId,
      data: { fields }
    });

    return response ? normalizeResource(response) : null;
  } catch (error) {
    throw handleAirtableError(error, 'Error updating resource', { resourceId, updateData });
  }
}

/**
 * Deletes a resource
 * @param {string} resourceId - The ID of the resource to delete
 * @returns {Promise<Object>} The deleted resource record
 */
export async function deleteResource(resourceId) {
  if (!resourceId) {
    throw new Error('Resource ID is required');
  }

  try {
    const response = await executeQuery({
      table: tables.RESOURCES,
      operation: 'delete',
      id: resourceId
    });

    return response ? normalizeResource(response) : null;
  } catch (error) {
    throw handleAirtableError(error, 'Error deleting resource', { resourceId });
  }
}

/**
 * Gets resources by program/initiative ID with caching
 * @param {string} programId - The ID of the program/initiative
 * @returns {Promise<Array<Object>>} Array of resources
 */
export async function getResourcesByProgram(programId) {
  return getCachedOrFetch(`program_resources_${programId}`, () => fetchResourcesByProgram(programId));
}

/**
 * Gets resources by cohort ID with caching
 * @param {string} cohortId - The ID of the cohort
 * @returns {Promise<Array<Object>>} Array of resources
 */
export async function getResourcesByCohort(cohortId) {
  return getCachedOrFetch(`cohort_resources_${cohortId}`, () => fetchResourcesByCohort(cohortId));
}

/**
 * Gets global resources with caching
 * @returns {Promise<Array<Object>>} Array of global resources
 */
export async function getGlobalResources() {
  return getCachedOrFetch('global_resources', () => fetchGlobalResources());
}

/**
 * Gets a resource by ID with caching
 * @param {string} resourceId - The ID of the resource
 * @returns {Promise<Object|null>} The resource record or null if not found
 */
export async function getResourceById(resourceId) {
  return getCachedOrFetch(`resource_${resourceId}`, () => fetchResourceById(resourceId));
}

/**
 * Normalizes a resource record from Airtable format to a consistent application format
 * @param {Object} record - The Airtable record
 * @returns {Object} Normalized resource object
 */
function normalizeResource(record) {
  if (!record || !record.fields) {
    return null;
  }

  const fields = record.fields;
  
  return {
    id: record.id,
    name: fields['Name'] || 'Untitled Resource',
    description: fields['Description'] || '',
    url: fields['URL'] || '',
    type: fields['Type'] || 'Link',
    category: fields['Category'] || 'General',
    isGlobal: fields['Is Global'] || false,
    programId: fields['Initiative Record ID'] || null,
    programName: fields['Initiative Name'] || null,
    cohortId: fields['Cohort Record ID'] || null,
    cohortName: fields['Cohort Name'] || null,
    fileAttachments: fields['File Attachments'] || [],
    createdTime: fields['Created Time'] || null,
    updatedTime: fields['Last Modified Time'] || null
  };
}

export default {
  createResource,
  deleteResource,
  fetchGlobalResources,
  fetchResourceById,
  fetchResourcesByCohort,
  fetchResourcesByProgram,
  getGlobalResources,
  getResourceById,
  getResourcesByCohort,
  getResourcesByProgram,
  updateResource
};