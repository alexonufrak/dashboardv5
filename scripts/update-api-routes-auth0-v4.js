/**
 * Script to update API routes to use Auth0 v4
 * 
 * This script will update all API routes in /pages/api directory to use Auth0 v4
 * - Change imports from '@auth0/nextjs-auth0' to '@/lib/auth0'
 * - Change getSession(req, res) to auth0.getSession(req, res)
 * - Replace withApiAuthRequired with direct session checks and error handling
 * 
 * Usage: node scripts/update-api-routes-auth0-v4.js
 */

const fs = require('fs');
const path = require('path');

// Function to process a single file
function processFile(filePath) {
  console.log(`Processing file: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Skip files that are already using Auth0 v4
  if (content.includes("import { auth0 } from '@/lib/auth0'")) {
    console.log(`  Already using Auth0 v4: ${filePath}`);
    return false;
  }

  // Update imports
  if (content.includes("import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0'") ||
      content.includes("import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0'")) {
    content = content.replace(/import \{ (?:withApiAuthRequired, getSession|getSession, withApiAuthRequired) \} from '@auth0\/nextjs-auth0'/g, 
                            "import { auth0 } from '@/lib/auth0'");
    modified = true;
  }

  // Update session handling
  if (content.includes("const session = await getSession(req, res)")) {
    content = content.replace(/const session = await getSession\(req, res\)/g, 
                            "const session = await auth0.getSession(req, res)");
    modified = true;
  }

  // Update handler function - replace withApiAuthRequired wrapper
  if (content.includes("export default withApiAuthRequired(")) {
    // Extract the function name from the wrapper
    const fnNameMatch = content.match(/export default withApiAuthRequired\((\w+)\)/);
    if (fnNameMatch) {
      const fnName = fnNameMatch[1];
      
      // Rename the original handler function
      const handlerVarName = `${fnName}Impl`;
      content = content.replace(new RegExp(`async function ${fnName}\\(req, res\\)`), `async function ${handlerVarName}(req, res)`);
      
      // Replace the withApiAuthRequired wrapper with direct export
      content = content.replace(/export default withApiAuthRequired\(\w+\)/, `export default async function handler(req, res) {
  try {
    // Check for valid Auth0 session
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Call the original handler with the authenticated session
    return ${handlerVarName}(req, res);
  } catch (error) {
    console.error('API authentication error:', error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}`);
      
      modified = true;
    }
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
  const apiDir = path.join(__dirname, '..', 'pages', 'api');
  let updatedCount = 0;
  
  // Process all JavaScript files in the API directory
  walkDir(apiDir, (filePath) => {
    if (processFile(filePath)) {
      updatedCount++;
    }
  }, (filePath) => filePath.endsWith('.js'));
  
  console.log(`\nCompleted! Updated ${updatedCount} files.`);
}

main();