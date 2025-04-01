#!/usr/bin/env node

/**
 * Script to update imports from the old monolithic Airtable implementation
 * to the new domain-driven architecture.
 * 
 * Usage:
 *   node scripts/update-airtable-imports.js --dry-run   # Preview changes without modifying files
 *   node scripts/update-airtable-imports.js             # Apply changes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Command line arguments
const isDryRun = process.argv.includes('--dry-run');
const verbose = process.argv.includes('--verbose');

// Configuration
const rootDir = path.resolve(__dirname, '..');
const excludeDirs = [
  'node_modules',
  '.git',
  '.next',
  'scripts',
  'public'
];

// Import mappings: old import -> new import
const importMappings = {
  // User-related functions
  'getUserByAuth0Id': { module: 'users', type: 'entity' },
  'getUserByEmail': { module: 'users', type: 'entity' },
  'getUserById': { module: 'users', type: 'entity' },
  'updateUserProfile': { module: 'users', type: 'entity' },
  'updateUserOnboarding': { module: 'users', type: 'entity' },
  'checkUserExists': { module: 'users', type: 'entity' },
  
  // Education-related functions
  'getEducation': { module: 'education', type: 'entity' },
  'updateEducation': { module: 'education', type: 'entity' },
  
  // Institution-related functions
  'getInstitution': { module: 'institutions', type: 'entity' },
  'lookupInstitutionByEmail': { module: 'institutions', type: 'entity' },
  'searchInstitutionsByName': { module: 'institutions', type: 'entity' },
  
  // Participation-related functions
  'getParticipationRecords': { module: 'participation', type: 'entity' },
  'getParticipationForCohort': { module: 'participation', type: 'entity' },
  'getParticipationForProgram': { module: 'participation', type: 'entity' },
  'createParticipationRecord': { module: 'participation', type: 'entity' },
  'updateParticipationRecord': { module: 'participation', type: 'entity' },
  'leaveProgram': { module: 'participation', type: 'entity' },
  
  // Team-related functions
  'getTeamById': { module: 'teams', type: 'entity' },
  'getTeamMembers': { module: 'teams', type: 'entity' },
  'createTeam': { module: 'teams', type: 'entity' },
  'updateTeam': { module: 'teams', type: 'entity' },
  'getTeamsForCohort': { module: 'teams', type: 'entity' },
  'removeTeamMember': { module: 'teams', type: 'entity' },
  'updateTeamMemberRole': { module: 'teams', type: 'entity' },
  
  // Cohort-related functions
  'getCohortById': { module: 'cohorts', type: 'entity' },
  'getCohortsByInstitution': { module: 'cohorts', type: 'entity' },
  'getCohortsByProgram': { module: 'cohorts', type: 'entity' },
  'getActiveCohorts': { module: 'cohorts', type: 'entity' },
  
  // Program-related functions
  'getProgramById': { module: 'programs', type: 'entity' },
  'getProgramsByInstitution': { module: 'programs', type: 'entity' },
  'getActivePrograms': { module: 'programs', type: 'entity' },
  'searchProgramsByName': { module: 'programs', type: 'entity' },
  
  // Submission-related functions
  'getSubmissionById': { module: 'submissions', type: 'entity' },
  'getSubmissionsByTeam': { module: 'submissions', type: 'entity' },
  'getSubmissionsByMilestone': { module: 'submissions', type: 'entity' },
  'createSubmission': { module: 'submissions', type: 'entity' },
  'updateSubmission': { module: 'submissions', type: 'entity' },
  
  // Points-related functions
  'getUserPointsTransactions': { module: 'points', type: 'entity' },
  'getTeamPointsTransactions': { module: 'points', type: 'entity' },
  'getRewardItems': { module: 'points', type: 'entity' },
  'getUserClaimedRewards': { module: 'points', type: 'entity' },
  'getUserPointsSummary': { module: 'points', type: 'entity' },
  'createPointsTransaction': { module: 'points', type: 'entity' },
  'claimReward': { module: 'points', type: 'entity' },
  
  // Resource-related functions
  'getResourcesByProgram': { module: 'resources', type: 'entity' },
  'getResourcesByCohort': { module: 'resources', type: 'entity' },
  'getGlobalResources': { module: 'resources', type: 'entity' },
  'getResourceById': { module: 'resources', type: 'entity' },
  'createResource': { module: 'resources', type: 'entity' },
  'updateResource': { module: 'resources', type: 'entity' },
  'deleteResource': { module: 'resources', type: 'entity' },
  
  // Event-related functions
  'getEventById': { module: 'events', type: 'entity' },
  'getUpcomingEvents': { module: 'events', type: 'entity' },
  'getEventsByProgram': { module: 'events', type: 'entity' },
  'getEventsByCohort': { module: 'events', type: 'entity' },
  'getEventsByUser': { module: 'events', type: 'entity' },
  'createEvent': { module: 'events', type: 'entity' },
  'updateEvent': { module: 'events', type: 'entity' },
  'deleteEvent': { module: 'events', type: 'entity' }
};

// Hook mappings: old function name -> hook name
const hookMappings = {
  // Profile hooks
  'getUserByAuth0Id': 'useProfileData',
  'updateUserProfile': 'useUpdateProfile',
  'checkUserExists': 'useCheckUserExists',
  
  // Participation hooks
  'getParticipationRecords': 'useParticipation',
  'getParticipationForProgram': 'useProgramParticipation',
  'getParticipationForCohort': 'useCohortParticipation',
  
  // Team hooks
  'getTeamById': 'useTeam',
  'getTeamMembers': 'useTeamMembers',
  'createTeam': 'useCreateTeam',
  'updateTeam': 'useUpdateTeam',
  'getTeamsForCohort': 'useTeamsByCohort',
  
  // Cohort hooks
  'getCohortById': 'useCohort',
  'getCohortsByInstitution': 'useCohortsByInstitution',
  'getCohortsByProgram': 'useCohortsByProgram',
  'getActiveCohorts': 'useActiveCohorts',
  
  // Program hooks
  'getProgramById': 'useProgram',
  'getProgramsByInstitution': 'useProgramsByInstitution',
  'getActivePrograms': 'useActivePrograms',
  
  // Submission hooks
  'getSubmissionById': 'useSubmission',
  'getSubmissionsByTeam': 'useTeamSubmissions',
  'getSubmissionsByMilestone': 'useMilestoneSubmissions',
  'createSubmission': 'useCreateSubmission',
  'updateSubmission': 'useUpdateSubmission',
  
  // Points hooks
  'getUserPointsTransactions': 'useUserPointsTransactions',
  'getTeamPointsTransactions': 'useTeamPointsTransactions',
  'getRewardItems': 'useRewardItems',
  'getUserClaimedRewards': 'useUserClaimedRewards',
  'getUserPointsSummary': 'useUserPointsSummary',
  'createPointsTransaction': 'useCreatePointsTransaction',
  'claimReward': 'useClaimReward',
  
  // Resource hooks
  'getResourcesByProgram': 'useProgramResources',
  'getResourcesByCohort': 'useCohortResources',
  'getGlobalResources': 'useGlobalResources',
  'getResourceById': 'useResource',
  'createResource': 'useCreateResource',
  'updateResource': 'useUpdateResource',
  'deleteResource': 'useDeleteResource',
  
  // Event hooks
  'getEventById': 'useEvent',
  'getUpcomingEvents': 'useUpcomingEvents',
  'getEventsByProgram': 'useProgramEvents',
  'getEventsByCohort': 'useCohortEvents',
  'getEventsByUser': 'useUserEvents',
  'createEvent': 'useCreateEvent',
  'updateEvent': 'useUpdateEvent',
  'deleteEvent': 'useDeleteEvent'
};

// Statistics
const stats = {
  filesChecked: 0,
  filesModified: 0,
  importsReplaced: 0
};

// Helper function to find all .js and .jsx files, excluding certain directories
function findJsFiles(dir, fileList = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.relative(rootDir, fullPath);
    
    // Skip excluded directories
    if (excludeDirs.some(excluded => relativePath.startsWith(excluded))) {
      continue;
    }
    
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findJsFiles(fullPath, fileList);
    } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.jsx'))) {
      // Skip already refactored files
      if (item.endsWith('.refactored.js')) {
        continue;
      }
      
      fileList.push(fullPath);
    }
  }
  
  return fileList;
}

// Helper function to detect if file uses React hooks
function usesReactHooks(content) {
  // Simple check for useState, useEffect, or other common hooks
  return /\b(useState|useEffect|useContext|useCallback|useMemo|useRef)\b/.test(content);
}

// Helper function to update imports in a file
function updateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check for import from old airtable.js
  const oldImportRegex = /import\s+{([^}]+)}\s+from\s+['"]@\/lib\/airtable['"]/g;
  const oldImportMatches = [...content.matchAll(oldImportRegex)];
  
  if (oldImportMatches.length === 0) {
    return false;
  }
  
  // Determine if the file is likely a React component or hook
  const isClientComponent = usesReactHooks(content);
  
  // Group imported functions by their target module
  let newImports = {};
  let functionsToReplace = [];
  
  for (const match of oldImportMatches) {
    const importedFunctions = match[1].split(',').map(f => f.trim());
    
    for (const func of importedFunctions) {
      if (importMappings[func]) {
        functionsToReplace.push(func);
        
        const { module, type } = importMappings[func];
        
        if (isClientComponent && hookMappings[func]) {
          // If this is a React component, use the hook import
          if (!newImports.hooks) {
            newImports.hooks = new Set();
          }
          newImports.hooks.add(hookMappings[func]);
        } else {
          // Otherwise use the entity import
          if (!newImports[module]) {
            newImports[module] = new Set();
          }
          newImports[module].add(func);
        }
      }
    }
  }
  
  if (Object.keys(newImports).length === 0) {
    return false;
  }
  
  // Replace old import statements
  content = content.replace(oldImportRegex, '');
  
  // Add new import statements at the beginning of the file
  let importStatements = [];
  
  // Add hook imports if any
  if (newImports.hooks) {
    const hooksList = Array.from(newImports.hooks).join(', ');
    importStatements.push(`import { ${hooksList} } from '@/lib/airtable/hooks';`);
    delete newImports.hooks; // Remove hooks to avoid processing them again
  }
  
  // Add entity imports
  for (const [module, funcs] of Object.entries(newImports)) {
    if (funcs.size === 0) continue;
    
    // Either import specific functions or the whole module based on count
    if (funcs.size <= 3) {
      // Import specific functions
      const funcsList = Array.from(funcs).join(', ');
      importStatements.push(`import { ${funcsList} } from '@/lib/airtable/entities';`);
    } else {
      // Import the whole module
      importStatements.push(`import { ${module} } from '@/lib/airtable/entities';`);
      
      // Replace function calls in the content
      for (const func of funcs) {
        const funcRegex = new RegExp(`\\b${func}\\(`, 'g');
        content = content.replace(funcRegex, `${module}.${func}(`);
      }
    }
  }
  
  // Add imports at the top of the file after any existing imports
  if (importStatements.length > 0) {
    // Find a good place to insert the new imports
    const lastImportMatch = content.match(/^import.*?;/ms);
    if (lastImportMatch) {
      const lastImportEnd = content.lastIndexOf(lastImportMatch[0]) + lastImportMatch[0].length;
      content = content.slice(0, lastImportEnd) + '\n' + importStatements.join('\n') + content.slice(lastImportEnd);
    } else {
      // If no imports found, add at the beginning
      content = importStatements.join('\n') + '\n\n' + content;
    }
    
    modified = true;
    stats.importsReplaced += functionsToReplace.length;
  }
  
  if (modified && !isDryRun) {
    fs.writeFileSync(filePath, content, 'utf8');
    stats.filesModified++;
  } else if (modified) {
    stats.filesModified++;
  }
  
  return modified;
}

// Main function
function main() {
  console.log(`🔍 Searching for JavaScript files to update...`);
  const jsFiles = findJsFiles(rootDir);
  stats.filesChecked = jsFiles.length;
  console.log(`Found ${jsFiles.length} JavaScript files to check.`);
  
  if (isDryRun) {
    console.log('🔍 Running in dry-run mode - no changes will be made.');
  }
  
  for (const filePath of jsFiles) {
    const relativePath = path.relative(rootDir, filePath);
    const wasModified = updateImports(filePath);
    
    if (wasModified && verbose) {
      console.log(`✅ Updated: ${relativePath}`);
    } else if (verbose) {
      console.log(`⏭️  Skipped: ${relativePath}`);
    }
  }
  
  console.log('\n===== Results =====');
  console.log(`Files checked: ${stats.filesChecked}`);
  console.log(`Files that would be modified: ${stats.filesModified}`);
  console.log(`Import statements replaced: ${stats.importsReplaced}`);
  
  if (isDryRun && stats.filesModified > 0) {
    console.log('\n⚠️  This was a dry run. Run without --dry-run to apply changes.');
  } else if (stats.filesModified > 0) {
    console.log('\n✅ Changes applied successfully!');
  } else {
    console.log('\n📝 No changes needed.');
  }
}

// Run the script
main();