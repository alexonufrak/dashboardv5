/**
 * Script to fix duplicate handler functions in API routes
 * 
 * This script addresses the error: "the name `handler` is defined multiple times"
 * that occurs in API routes that were updated to use Auth0 v4.
 * 
 * Usage: node scripts/fix-duplicate-handlers.js
 */

const fs = require('fs');
const path = require('path');

// Function to process a single file
function processFile(filePath) {
  console.log(`Processing file: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file contains both handler functions
    if (content.includes('async function handler(req, res)') && 
        content.includes('export default async function handler(req, res)')) {
      
      console.log(`  Found duplicate handler in: ${filePath}`);
      
      // Replace the first instance of handler with handlerImpl
      content = content.replace(
        /async function handler\(req, res\)/,
        'async function handlerImpl(req, res)'
      );
      
      // Replace any direct calls to handler with handlerImpl
      content = content.replace(
        /return handler\(req, res\)/g,
        'return handlerImpl(req, res)'
      );
      
      // Write the updated content back to the file
      fs.writeFileSync(filePath, content);
      console.log(`  Fixed: ${filePath}`);
      return true;
    } else {
      console.log(`  No duplicate handlers found: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`  Error processing ${filePath}:`, error);
    return false;
  }
}

// Function to walk a directory recursively
function walkDir(dirPath, callback, fileFilter = (f) => true) {
  fs.readdirSync(dirPath).forEach(file => {
    const filePath = path.join(dirPath, file);
    
    try {
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath, callback, fileFilter);
      } else if (fileFilter(filePath)) {
        callback(filePath);
      }
    } catch (error) {
      console.error(`Error accessing ${filePath}:`, error);
    }
  });
}

// Main function
function main() {
  const apiDir = path.join(__dirname, '..', 'pages', 'api');
  let fixedCount = 0;
  
  // Process all JavaScript files in the API directory
  walkDir(apiDir, (filePath) => {
    if (processFile(filePath)) {
      fixedCount++;
    }
  }, (filePath) => filePath.endsWith('.js'));
  
  console.log(`\nCompleted! Fixed ${fixedCount} files.`);
}

main();