import { executeQuery, getCachedOrFetch, handleAirtableError } from '../core';
import * as tables from '../tables';

/**
 * Fetches an event by its ID
 * @param {string} eventId - The ID of the event to fetch
 * @returns {Promise<Object|null>} The event record or null if not found
 */
export async function fetchEventById(eventId) {
  if (!eventId) {
    throw new Error('Event ID is required');
  }

  try {
    const response = await executeQuery({
      table: tables.EVENTS,
      operation: 'find',
      id: eventId
    });

    return response ? normalizeEvent(response) : null;
  } catch (error) {
    throw handleAirtableError(error, 'Error fetching event', { eventId });
  }
}

/**
 * Fetches upcoming events
 * @param {number} limit - Maximum number of events to return
 * @returns {Promise<Array<Object>>} Array of upcoming events
 */
export async function fetchUpcomingEvents(limit = 10) {
  try {
    const now = new Date().toISOString();
    
    const response = await executeQuery({
      table: tables.EVENTS,
      operation: 'select',
      params: {
        filterByFormula: `{Start Date/Time} > '${now}'`,
        sort: [{ field: 'Start Date/Time', direction: 'asc' }],
        maxRecords: limit
      }
    });

    return response ? response.map(normalizeEvent) : [];
  } catch (error) {
    throw handleAirtableError(error, 'Error fetching upcoming events', { limit });
  }
}

/**
 * Fetches events by program/initiative ID
 * @param {string} programId - The ID of the program/initiative
 * @returns {Promise<Array<Object>>} Array of events
 */
export async function fetchEventsByProgram(programId) {
  if (!programId) {
    throw new Error('Program ID is required');
  }

  try {
    const response = await executeQuery({
      table: tables.EVENTS,
      operation: 'select',
      params: {
        filterByFormula: `{Initiative Record ID} = '${programId}'`,
        sort: [{ field: 'Start Date/Time', direction: 'asc' }]
      }
    });

    return response ? response.map(normalizeEvent) : [];
  } catch (error) {
    throw handleAirtableError(error, 'Error fetching program events', { programId });
  }
}

/**
 * Fetches events by cohort ID
 * @param {string} cohortId - The ID of the cohort
 * @returns {Promise<Array<Object>>} Array of events
 */
export async function fetchEventsByCohort(cohortId) {
  if (!cohortId) {
    throw new Error('Cohort ID is required');
  }

  try {
    const response = await executeQuery({
      table: tables.EVENTS,
      operation: 'select',
      params: {
        filterByFormula: `{Cohort Record ID} = '${cohortId}'`,
        sort: [{ field: 'Start Date/Time', direction: 'asc' }]
      }
    });

    return response ? response.map(normalizeEvent) : [];
  } catch (error) {
    throw handleAirtableError(error, 'Error fetching cohort events', { cohortId });
  }
}

/**
 * Fetches events for a specific user based on their program/cohort participation
 * @param {string} userId - The Auth0 ID of the user
 * @returns {Promise<Array<Object>>} Array of events relevant to the user
 */
export async function fetchEventsByUser(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    // First, fetch the user's participation records
    const participationResponse = await executeQuery({
      table: tables.PARTICIPATION,
      operation: 'select',
      params: {
        filterByFormula: `{User Auth0 ID} = '${userId}'`,
      }
    });

    if (!participationResponse || participationResponse.length === 0) {
      return [];
    }

    // Extract cohort and program IDs from participation
    const cohortIds = [];
    const programIds = [];

    participationResponse.forEach(record => {
      const cohortId = record.fields['Cohort Record ID'];
      const programId = record.fields['Initiative Record ID'];
      
      if (cohortId) cohortIds.push(cohortId);
      if (programId) programIds.push(programId);
    });

    // Build filter formula for events
    let filterFormula = '';
    
    if (cohortIds.length > 0) {
      const cohortFilters = cohortIds.map(id => `{Cohort Record ID} = '${id}'`);
      filterFormula += `OR(${cohortFilters.join(', ')})`;
    }
    
    if (programIds.length > 0) {
      const programFilters = programIds.map(id => `{Initiative Record ID} = '${id}'`);
      const programFormula = `OR(${programFilters.join(', ')})`;
      
      if (filterFormula) {
        filterFormula = `OR(${filterFormula}, ${programFormula})`;
      } else {
        filterFormula = programFormula;
      }
    }
    
    // If user has no participations, return empty array
    if (!filterFormula) {
      return [];
    }

    // Fetch events relevant to the user
    const eventsResponse = await executeQuery({
      table: tables.EVENTS,
      operation: 'select',
      params: {
        filterByFormula: filterFormula,
        sort: [{ field: 'Start Date/Time', direction: 'asc' }]
      }
    });

    return eventsResponse ? eventsResponse.map(normalizeEvent) : [];
  } catch (error) {
    throw handleAirtableError(error, 'Error fetching user events', { userId });
  }
}

/**
 * Creates a new event
 * @param {Object} eventData - Data for the new event
 * @returns {Promise<Object>} The created event record
 */
export async function createEvent(eventData) {
  if (!eventData.name) {
    throw new Error('Event name is required');
  }
  
  if (!eventData.startDateTime) {
    throw new Error('Event start date/time is required');
  }

  try {
    const fields = {
      'Name': eventData.name,
      'Description': eventData.description || '',
      'Start Date/Time': eventData.startDateTime,
      'End Date/Time': eventData.endDateTime || eventData.startDateTime,
      'Location': eventData.location || '',
      'URL': eventData.url || '',
      'Type': eventData.type || 'General',
      'Status': eventData.status || 'Scheduled'
    };

    // Add optional fields if they exist
    if (eventData.programId) {
      fields['Initiative Record ID'] = eventData.programId;
    }

    if (eventData.cohortId) {
      fields['Cohort Record ID'] = eventData.cohortId;
    }

    const response = await executeQuery({
      table: tables.EVENTS,
      operation: 'create',
      data: { fields }
    });

    return response ? normalizeEvent(response) : null;
  } catch (error) {
    throw handleAirtableError(error, 'Error creating event', { eventData });
  }
}

/**
 * Updates an existing event
 * @param {string} eventId - The ID of the event to update
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object>} The updated event
 */
export async function updateEvent(eventId, updateData) {
  if (!eventId) {
    throw new Error('Event ID is required');
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
    
    if (updateData.startDateTime !== undefined) {
      fields['Start Date/Time'] = updateData.startDateTime;
    }
    
    if (updateData.endDateTime !== undefined) {
      fields['End Date/Time'] = updateData.endDateTime;
    }
    
    if (updateData.location !== undefined) {
      fields['Location'] = updateData.location;
    }
    
    if (updateData.url !== undefined) {
      fields['URL'] = updateData.url;
    }
    
    if (updateData.type !== undefined) {
      fields['Type'] = updateData.type;
    }
    
    if (updateData.status !== undefined) {
      fields['Status'] = updateData.status;
    }

    if (updateData.programId !== undefined) {
      fields['Initiative Record ID'] = updateData.programId;
    }

    if (updateData.cohortId !== undefined) {
      fields['Cohort Record ID'] = updateData.cohortId;
    }

    const response = await executeQuery({
      table: tables.EVENTS,
      operation: 'update',
      id: eventId,
      data: { fields }
    });

    return response ? normalizeEvent(response) : null;
  } catch (error) {
    throw handleAirtableError(error, 'Error updating event', { eventId, updateData });
  }
}

/**
 * Deletes an event
 * @param {string} eventId - The ID of the event to delete
 * @returns {Promise<Object>} The deleted event record
 */
export async function deleteEvent(eventId) {
  if (!eventId) {
    throw new Error('Event ID is required');
  }

  try {
    const response = await executeQuery({
      table: tables.EVENTS,
      operation: 'delete',
      id: eventId
    });

    return response ? normalizeEvent(response) : null;
  } catch (error) {
    throw handleAirtableError(error, 'Error deleting event', { eventId });
  }
}

/**
 * Gets an event by ID with caching
 * @param {string} eventId - The ID of the event
 * @returns {Promise<Object|null>} The event record or null if not found
 */
export async function getEventById(eventId) {
  return getCachedOrFetch(`event_${eventId}`, () => fetchEventById(eventId));
}

/**
 * Gets upcoming events with caching
 * @param {number} limit - Maximum number of events to return
 * @returns {Promise<Array<Object>>} Array of upcoming events
 */
export async function getUpcomingEvents(limit = 10) {
  return getCachedOrFetch(`upcoming_events_${limit}`, () => fetchUpcomingEvents(limit));
}

/**
 * Gets events by program/initiative ID with caching
 * @param {string} programId - The ID of the program/initiative
 * @returns {Promise<Array<Object>>} Array of events
 */
export async function getEventsByProgram(programId) {
  return getCachedOrFetch(`program_events_${programId}`, () => fetchEventsByProgram(programId));
}

/**
 * Gets events by cohort ID with caching
 * @param {string} cohortId - The ID of the cohort
 * @returns {Promise<Array<Object>>} Array of events
 */
export async function getEventsByCohort(cohortId) {
  return getCachedOrFetch(`cohort_events_${cohortId}`, () => fetchEventsByCohort(cohortId));
}

/**
 * Gets events for a specific user with caching
 * @param {string} userId - The Auth0 ID of the user
 * @returns {Promise<Array<Object>>} Array of events relevant to the user
 */
export async function getEventsByUser(userId) {
  return getCachedOrFetch(`user_events_${userId}`, () => fetchEventsByUser(userId));
}

/**
 * Normalizes an event record from Airtable format to a consistent application format
 * @param {Object} record - The Airtable record
 * @returns {Object} Normalized event object
 */
function normalizeEvent(record) {
  if (!record || !record.fields) {
    return null;
  }

  const fields = record.fields;
  
  return {
    id: record.id,
    name: fields['Name'] || 'Untitled Event',
    description: fields['Description'] || '',
    startDateTime: fields['Start Date/Time'] || null,
    endDateTime: fields['End Date/Time'] || null,
    location: fields['Location'] || '',
    url: fields['URL'] || '',
    type: fields['Type'] || 'General',
    status: fields['Status'] || 'Scheduled',
    programId: fields['Initiative Record ID'] || null,
    programName: fields['Initiative Name'] || null,
    cohortId: fields['Cohort Record ID'] || null,
    cohortName: fields['Cohort Name'] || null,
    createdTime: fields['Created Time'] || null,
    updatedTime: fields['Last Modified Time'] || null
  };
}