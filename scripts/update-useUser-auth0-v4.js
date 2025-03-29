/**
 * Script to update useUser imports for Auth0 v4
 * 
 * This script will update all client-side components to use the correct useUser import path
 * - Change imports from '@auth0/nextjs-auth0' to '@auth0/nextjs-auth0'
 *   (the path is the same, but keeping this in the script for consistency)
 * 
 * Usage: node scripts/update-useUser-auth0-v4.js
 */

const fs = require('fs');
const path = require('path');

// Function to process a single file
function processFile(filePath) {
  console.log(`Processing file: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Update useUser import - path stays the same but we'll check for it
  if (content.includes("import { useUser") && content.includes("from '@auth0/nextjs-auth0'")) {
    // No change needed for useUser imports in Auth0 v4, but we log it
    console.log(`  Found useUser import in: ${filePath}`);
  }

  return false; // No changes made
}

// Function to walk a directory recursively
function walkDir(dirPath, callback, fileFilter = (f) => true) {
  fs.readdirSync(dirPath).forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath, callback, fileFilter);
    } else if (fileFilter(filePath)) {
      callback(filePath);
    }
  });
}

// Main function
function main() {
  const directories = [
    path.join(__dirname, '..', 'pages'),
    path.join(__dirname, '..', 'components')
  ];
  
  let foundCount = 0;
  
  // Process all JavaScript files in the specified directories
  directories.forEach(dir => {
    walkDir(dir, (filePath) => {
      if (filePath.includes('node_modules')) return;
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes("useUser") && content.includes("from '@auth0/nextjs-auth0'")) {
          console.log(`  Found useUser in: ${filePath}`);
          foundCount++;
        }
      } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
      }
    }, (filePath) => filePath.endsWith('.js') || filePath.endsWith('.jsx'));
  });
  
  console.log(`\nCompleted! Found ${foundCount} files with useUser imports.`);
}

main();