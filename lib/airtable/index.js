// Re-export everything from the core module
export * from './core';

// Re-export everything from the tables module
export * from './tables';

// Re-export everything from the entities module
export * from './entities';

// Re-export everything from the hooks module
export * from './hooks';

// Export a default object with all the modules
import * as core from './core';
import * as tables from './tables';
import * as entities from './entities';
import * as hooks from './hooks';

// Default export with all modules
export default {
  core,
  tables,
  entities,
  hooks
};