/**
 * Script to fix Auth0 client imports across the codebase
 * 
 * This script corrects imports from '@auth0/nextjs-auth0/client' to '@auth0/nextjs-auth0'
 * to make them compatible with Auth0 v4, which doesn't export modules from the /client subpath
 * in production builds.
 * 
 * Usage: node scripts/fix-auth0-client-imports.js
 */

const fs = require('fs');
const path = require('path');

// Function to process a single file
function processFile(filePath) {
  console.log(`Processing file: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Update imports from '@auth0/nextjs-auth0/client' to '@auth0/nextjs-auth0'
  if (content.includes("from '@auth0/nextjs-auth0/client'")) {
    content = content.replace(/from ['"]@auth0\/nextjs-auth0\/client['"]/g, 
                         "from '@auth0/nextjs-auth0'");
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`  Updated: ${filePath}`);
    return true;
  } else {
    console.log(`  No changes needed: ${filePath}`);
    return false;
  }
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
    path.join(__dirname, '..', 'components'),
    path.join(__dirname, '..', 'lib'),
    path.join(__dirname, '..', 'contexts')
  ];
  
  let updatedCount = 0;
  
  // Process all JavaScript files in the specified directories
  directories.forEach(dir => {
    if (fs.existsSync(dir)) {
      walkDir(dir, (filePath) => {
        if (processFile(filePath)) {
          updatedCount++;
        }
      }, (filePath) => filePath.endsWith('.js') || filePath.endsWith('.jsx'));
    } else {
      console.warn(`Directory not found: ${dir}`);
    }
  });
  
  console.log(`\nCompleted! Updated ${updatedCount} files.`);
}

main();