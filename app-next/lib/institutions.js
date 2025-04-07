import { institutions } from '@/lib/airtable/entities';
import { cache } from 'react';

// Get a single institution by ID
export const getInstitution = cache(async (institutionId) => {
  if (!institutionId) return null;
  
  try {
    return await institutions.getInstitutionById(institutionId);
  } catch (error) {
    console.error(`Error fetching institution ${institutionId}:`, error);
    throw new Error(`Failed to fetch institution: ${error.message}`);
  }
});

// Get all institutions
export const getAllInstitutions = cache(async () => {
  try {
    return await institutions.getAllInstitutions();
  } catch (error) {
    console.error('Error fetching all institutions:', error);
    throw new Error(`Failed to fetch institutions: ${error.message}`);
  }
});

// Search institutions by name
export const searchInstitutions = cache(async (query) => {
  if (!query || query.length < 2) return [];
  
  try {
    return await institutions.searchInstitutionsByName(query);
  } catch (error) {
    console.error(`Error searching institutions with query ${query}:`, error);
    throw new Error(`Failed to search institutions: ${error.message}`);
  }
});

// Get partnerships for an institution
export const getInstitutionPartnerships = cache(async (institutionId) => {
  if (!institutionId) return null;
  
  try {
    return await institutions.getInstitutionPartnerships(institutionId);
  } catch (error) {
    console.error(`Error fetching partnerships for institution ${institutionId}:`, error);
    throw new Error(`Failed to fetch institution partnerships: ${error.message}`);
  }
});