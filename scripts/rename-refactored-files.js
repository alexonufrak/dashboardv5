#!/usr/bin/env node

/**
 * Script to rename .refactored.js files to their final names
 * as part of the Airtable architecture migration
 * 
 * Usage:
 *   node scripts/rename-refactored-files.js --dry-run   # Preview changes without renaming
 *   node scripts/rename-refactored-files.js             # Apply changes
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
  'public'
];

// Statistics
const stats = {
  filesFound: 0,
  filesRenamed: 0
};

// Helper function to find all .refactored.js files, excluding certain directories
function findRefactoredFiles(dir, fileList = []) {
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
      findRefactoredFiles(fullPath, fileList);
    } else if (stat.isFile() && item.endsWith('.refactored.js')) {
      fileList.push(fullPath);
    }
  }
  
  return fileList;
}

// Helper function to rename a file from .refactored.js to .js
function renameFile(filePath) {
  const newPath = filePath.replace('.refactored.js', '.js');
  
  // Check if the target file already exists
  if (fs.existsSync(newPath)) {
    const backupPath = `${newPath}.backup`;
    console.log(`⚠️  Target file exists, creating backup at ${path.relative(rootDir, backupPath)}`);
    
    if (!isDryRun) {
      fs.copyFileSync(newPath, backupPath);
    }
  }
  
  // Rename the file
  if (!isDryRun) {
    fs.renameSync(filePath, newPath);
  }
  
  return newPath;
}

// Main function
function main() {
  console.log(`🔍 Searching for refactored files to rename...`);
  const refactoredFiles = findRefactoredFiles(rootDir);
  stats.filesFound = refactoredFiles.length;
  console.log(`Found ${refactoredFiles.length} refactored files.`);
  
  if (isDryRun) {
    console.log('🔍 Running in dry-run mode - no changes will be made.');
  }
  
  for (const filePath of refactoredFiles) {
    const relativePath = path.relative(rootDir, filePath);
    const newRelativePath = relativePath.replace('.refactored.js', '.js');
    
    console.log(`${isDryRun ? 'Would rename' : 'Renaming'} ${relativePath} → ${newRelativePath}`);
    
    if (!isDryRun) {
      const newPath = renameFile(filePath);
      stats.filesRenamed++;
    } else {
      stats.filesRenamed++;
    }
  }
  
  console.log('\n===== Results =====');
  console.log(`Files found: ${stats.filesFound}`);
  console.log(`Files ${isDryRun ? 'that would be' : ''} renamed: ${stats.filesRenamed}`);
  
  if (isDryRun && stats.filesRenamed > 0) {
    console.log('\n⚠️  This was a dry run. Run without --dry-run to apply changes.');
  } else if (stats.filesRenamed > 0) {
    console.log('\n✅ Changes applied successfully!');
  } else {
    console.log('\n📝 No changes needed.');
  }
}

// Run the script
main();