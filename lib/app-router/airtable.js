/**
 * Server-side Airtable data fetching utilities for App Router
 * 
 * This file provides a foundation for server component data fetching
 * patterns that replace client-side React Query hooks.
 */

import { cache } from 'react';
import { notFound } from 'next/navigation';
import {
  getContactsTable,
  getEducationTable,
  getInstitutionsTable,
  getProgramsTable,
  getCohortsTable,
  getTeamsTable,
  getParticipationTable,
  getMilestonesTable,
  getSubmissionsTable,
  getEventsTable,
  getMembersTable,
} from '../airtable/tables/definitions';

/**
 * Base function for cached Airtable data fetching
 * Uses React's cache() to deduplicate requests within a render cycle
 */
export const fetchAirtableData = cache(async (tableFn, options = {}) => {
  const {
    id = null,
    formula = null,
    fields = null,
    view = null,
    sort = null,
    maxRecords = null,
    filterByFormula = null,
    pageSize = 100,
  } = options;

  try {
    const table = tableFn();

    // If an ID is provided, fetch a single record
    if (id) {
      const record = await table.find(id);
      return { record: record._rawJson };
    }

    // Otherwise, fetch a list of records with the provided options
    const query = {};

    if (fields) query.fields = fields;
    if (view) query.view = view;
    if (sort) query.sort = sort;
    if (maxRecords) query.maxRecords = maxRecords;
    if (filterByFormula || formula) query.filterByFormula = filterByFormula || formula;
    if (pageSize) query.pageSize = pageSize;

    const records = await table.select(query).all();
    return {
      records: records.map(record => record._rawJson),
    };
  } catch (error) {
    console.error('Error fetching Airtable data:', error);
    throw error;
  }
});

/**
 * Cached contacts fetching
 */
export const fetchContacts = cache(async (options = {}) => {
  return fetchAirtableData(getContactsTable, options);
});

/**
 * Fetch a single contact by ID
 */
export const fetchContactById = cache(async (id) => {
  try {
    const { record } = await fetchAirtableData(getContactsTable, { id });
    if (!record) {
      return null;
    }
    return record;
  } catch (error) {
    console.error(`Error fetching contact with ID ${id}:`, error);
    return null;
  }
});

/**
 * Fetch a contact by email
 */
export const fetchContactByEmail = cache(async (email) => {
  if (!email) return null;
  
  try {
    const formula = `{Email} = "${email.replace(/"/g, '\\"')}"`;
    const { records } = await fetchAirtableData(getContactsTable, { 
      filterByFormula: formula,
      maxRecords: 1
    });
    
    if (!records || records.length === 0) {
      return null;
    }
    
    return records[0];
  } catch (error) {
    console.error(`Error fetching contact with email ${email}:`, error);
    return null;
  }
});

/**
 * Fetch contact by Auth0 ID
 */
export const fetchContactByAuth0Id = cache(async (auth0Id) => {
  if (!auth0Id) return null;
  
  try {
    const formula = `{Auth0 ID} = "${auth0Id.replace(/"/g, '\\"')}"`;
    const { records } = await fetchAirtableData(getContactsTable, { 
      filterByFormula: formula,
      maxRecords: 1
    });
    
    if (!records || records.length === 0) {
      return null;
    }
    
    return records[0];
  } catch (error) {
    console.error(`Error fetching contact with Auth0 ID ${auth0Id}:`, error);
    return null;
  }
});

/**
 * Cached education records fetching
 */
export const fetchEducation = cache(async (options = {}) => {
  return fetchAirtableData(getEducationTable, options);
});

/**
 * Fetch a single education record by ID
 */
export const fetchEducationById = cache(async (id) => {
  try {
    const { record } = await fetchAirtableData(getEducationTable, { id });
    if (!record) {
      return null;
    }
    return record;
  } catch (error) {
    console.error(`Error fetching education with ID ${id}:`, error);
    return null;
  }
});

/**
 * Fetch education records for a specific contact
 */
export const fetchEducationByContactId = cache(async (contactId) => {
  if (!contactId) return [];
  
  try {
    const formula = `FIND("${contactId.replace(/"/g, '\\"')}", ARRAYJOIN({Contact}))`;
    const { records } = await fetchAirtableData(getEducationTable, { 
      filterByFormula: formula 
    });
    
    if (!records || records.length === 0) {
      return [];
    }
    
    return records;
  } catch (error) {
    console.error(`Error fetching education for contact ${contactId}:`, error);
    return [];
  }
});

/**
 * Cached institutions fetching
 */
export const fetchInstitutions = cache(async (options = {}) => {
  return fetchAirtableData(getInstitutionsTable, options);
});

/**
 * Fetch a single institution by ID
 */
export const fetchInstitutionById = cache(async (id) => {
  try {
    const { record } = await fetchAirtableData(getInstitutionsTable, { id });
    if (!record) {
      return notFound();
    }
    return record;
  } catch (error) {
    console.error(`Error fetching institution with ID ${id}:`, error);
    return notFound();
  }
});

/**
 * Cached programs fetching
 */
export const fetchPrograms = cache(async (options = {}) => {
  return fetchAirtableData(getProgramsTable, options);
});

/**
 * Fetch a single program by ID
 */
export const fetchProgramById = cache(async (id) => {
  try {
    const { record } = await fetchAirtableData(getProgramsTable, { id });
    if (!record) {
      return notFound();
    }
    return record;
  } catch (error) {
    console.error(`Error fetching program with ID ${id}:`, error);
    return notFound();
  }
});

/**
 * Cached cohorts fetching
 */
export const fetchCohorts = cache(async (options = {}) => {
  return fetchAirtableData(getCohortsTable, options);
});

/**
 * Fetch a single cohort by ID
 */
export const fetchCohortById = cache(async (id) => {
  try {
    const { record } = await fetchAirtableData(getCohortsTable, { id });
    if (!record) {
      return notFound();
    }
    return record;
  } catch (error) {
    console.error(`Error fetching cohort with ID ${id}:`, error);
    return notFound();
  }
});

/**
 * Fetch cohorts for a specific program
 */
export const fetchCohortsByProgramId = cache(async (programId) => {
  if (!programId) return [];
  
  try {
    const formula = `FIND("${programId.replace(/"/g, '\\"')}", ARRAYJOIN({Program}))`;
    const { records } = await fetchAirtableData(getCohortsTable, { 
      filterByFormula: formula 
    });
    
    if (!records || records.length === 0) {
      return [];
    }
    
    return records;
  } catch (error) {
    console.error(`Error fetching cohorts for program ${programId}:`, error);
    return [];
  }
});

/**
 * Cached teams fetching
 */
export const fetchTeams = cache(async (options = {}) => {
  return fetchAirtableData(getTeamsTable, options);
});

/**
 * Fetch a single team by ID
 */
export const fetchTeamById = cache(async (id) => {
  try {
    const { record } = await fetchAirtableData(getTeamsTable, { id });
    if (!record) {
      return notFound();
    }
    return record;
  } catch (error) {
    console.error(`Error fetching team with ID ${id}:`, error);
    return notFound();
  }
});

/**
 * Fetch teams for a specific contact
 */
export const fetchTeamsByContactId = cache(async (contactId) => {
  if (!contactId) return [];
  
  // First get the member records
  try {
    const memberFormula = `FIND("${contactId.replace(/"/g, '\\"')}", ARRAYJOIN({Contact}))`;
    const { records: memberRecords } = await fetchAirtableData(getMembersTable, { 
      filterByFormula: memberFormula 
    });
    
    if (!memberRecords || memberRecords.length === 0) {
      return [];
    }
    
    // Get the team IDs from member records
    const teamIds = memberRecords
      .map(record => record.fields.Team?.[0])
      .filter(Boolean);
    
    if (teamIds.length === 0) {
      return [];
    }
    
    // Fetch teams by ID
    const teamPromises = teamIds.map(teamId => fetchTeamById(teamId));
    const teams = await Promise.all(teamPromises);
    
    return teams.filter(Boolean);
  } catch (error) {
    console.error(`Error fetching teams for contact ${contactId}:`, error);
    return [];
  }
});

/**
 * Cached events fetching
 */
export const fetchEvents = cache(async (options = {}) => {
  return fetchAirtableData(getEventsTable, options);
});

/**
 * Fetch upcoming events
 */
export const fetchUpcomingEvents = cache(async (limit = 5) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const formula = `AND({Start Date} >= '${today}', {Status} = 'Confirmed')`;
    
    const { records } = await fetchAirtableData(getEventsTable, {
      filterByFormula: formula,
      sort: [{ field: 'Start Date', direction: 'asc' }],
      maxRecords: limit
    });
    
    return records || [];
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }
});

/**
 * Cached participation records fetching
 */
export const fetchParticipation = cache(async (options = {}) => {
  return fetchAirtableData(getParticipationTable, options);
});

/**
 * Fetch participation records for a specific contact
 */
export const fetchParticipationByContactId = cache(async (contactId) => {
  if (!contactId) return [];
  
  try {
    const formula = `FIND("${contactId.replace(/"/g, '\\"')}", ARRAYJOIN({Contact}))`;
    const { records } = await fetchAirtableData(getParticipationTable, { 
      filterByFormula: formula 
    });
    
    if (!records || records.length === 0) {
      return [];
    }
    
    return records;
  } catch (error) {
    console.error(`Error fetching participation for contact ${contactId}:`, error);
    return [];
  }
});

/**
 * Helper function to get composite user profile
 * Fetches contact, education, teams, and other related data in parallel
 */
export const fetchUserProfile = cache(async (identifierType, identifier) => {
  try {
    // Step 1: Determine how to fetch the contact record
    let contactPromise;
    switch (identifierType) {
      case 'id':
        contactPromise = fetchContactById(identifier);
        break;
      case 'email':
        contactPromise = fetchContactByEmail(identifier);
        break;
      case 'auth0Id':
        contactPromise = fetchContactByAuth0Id(identifier);
        break;
      default:
        throw new Error(`Invalid identifier type: ${identifierType}`);
    }
    
    // Step 2: Fetch the contact record
    const contact = await contactPromise;
    
    if (!contact) {
      console.log(`No contact found for ${identifierType} ${identifier}`);
      return null;
    }
    
    const contactId = contact.id;
    
    // Step 3: Fetch related data in parallel
    const [education, teams, participation] = await Promise.all([
      fetchEducationByContactId(contactId),
      fetchTeamsByContactId(contactId),
      fetchParticipationByContactId(contactId)
    ]);
    
    // Step 4: Combine all data into a single profile object
    return {
      contact,
      education,
      teams,
      participation
    };
  } catch (error) {
    console.error(`Error fetching user profile for ${identifierType} ${identifier}:`, error);
    return null;
  }
});

/**
 * Fetch user profile by Auth0 ID
 */
export const fetchUserProfileByAuth0Id = cache(async (auth0Id) => {
  return fetchUserProfile('auth0Id', auth0Id);
});

/**
 * Fetch user profile by email
 */
export const fetchUserProfileByEmail = cache(async (email) => {
  return fetchUserProfile('email', email);
});

/**
 * Fetch user profile by ID
 */
export const fetchUserProfileById = cache(async (id) => {
  return fetchUserProfile('id', id);
});