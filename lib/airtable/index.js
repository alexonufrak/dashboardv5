/**
 * xFoundry Airtable Integration Library
 * Domain-driven design implementation for Airtable data access
 */

// Import all sub-modules
import * as core from './core';
import * as tables from './tables';
import * as entities from './entities';
import * as hooks from './hooks';

// Export sub-modules
export {
  core,
  tables,
  entities,
  hooks
};

// Re-export frequently used functions from entities
export const {
  getUserByAuth0Id,
  getUserByEmail,
  updateUserProfile,
  checkUserExists
} = entities.users;

export const {
  getInstitution,
  lookupInstitutionByEmail
} = entities.institutions;

// Export module initialization function
export function initialize(config = {}) {
  // Initialize the Airtable client with configuration
  core.client.initializeClient({
    apiKey: config.apiKey || process.env.AIRTABLE_API_KEY,
    baseId: config.baseId || process.env.AIRTABLE_BASE_ID
  });
  
  console.log('Airtable integration initialized');
  
  return {
    core,
    tables,
    entities,
    hooks
  };
}

// Default export with main functionality
export default {
  initialize,
  core,
  tables,
  entities,
  hooks
};