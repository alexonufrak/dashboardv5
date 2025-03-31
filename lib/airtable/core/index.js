import * as clientModule from './client';
import * as cacheModule from './cache';
import * as throttleModule from './throttle';
import * as errorsModule from './errors';

// Re-export all modules
export const client = clientModule;
export const cache = cacheModule;
export const throttle = throttleModule;
export const errors = errorsModule;

// Re-export specific functions and constants that are commonly used
export const { 
  getBase, 
  executeQuery 
} = clientModule;

export const { 
  getCachedOrFetch, 
  createCacheKey, 
  clearCacheByType, 
  CACHE_TYPES 
} = cacheModule;

export const { 
  throttleRequests 
} = throttleModule;

export const { 
  handleAirtableError, 
  AirtableError 
} = errorsModule;

// Default export with all core utilities
export default {
  ...clientModule,
  ...cacheModule,
  ...throttleModule,
  ...errorsModule
};