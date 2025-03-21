/**
 * Script to update API routes to use Auth0 v4
 * 
 * This script will update all API routes in /pages/api directory to use Auth0 v4
 * - Change imports from '@auth0/nextjs-auth0' to '@/lib/auth0'
 * - Change handler function from withApiAuthRequired to direct async function
 * - Update session handling from getSession(req, res) to auth0.getSession(req)
 * 
 * Usage: node scripts/update-api-routes-auth0.js
 */

const fs = require('fs');
const path = require('path');

// Function to process a single file
function processFile(filePath) {
  console.log(`Processing file: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Update imports
  if (content.includes("import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0'") ||
      content.includes("import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0'")) {
    content = content.replace(/import \{ (?:getSession, withApiAuthRequired|withApiAuthRequired, getSession) \} from '@auth0\/nextjs-auth0'/g, "import { auth0 } from '@/lib/auth0'");
    modified = true;
  } else if (content.includes("import { getSession } from '@auth0/nextjs-auth0'")) {
    content = content.replace(/import \{ getSession \} from '@auth0\/nextjs-auth0'/g, "import { auth0 } from '@/lib/auth0'");
    modified = true;
  } else if (content.includes("import { withApiAuthRequired } from '@auth0/nextjs-auth0'")) {
    content = content.replace(/import \{ withApiAuthRequired \} from '@auth0\/nextjs-auth0'/g, "import { auth0 } from '@/lib/auth0'");
    modified = true;
  }

  // Update handler function
  if (content.includes("export default withApiAuthRequired(")) {
    // Extract the function name if present
    const fnNameMatch = content.match(/export default withApiAuthRequired\(async function (\w+)\(/);
    const fnName = fnNameMatch ? fnNameMatch[1] : "handler";
    
    content = content.replace(/export default withApiAuthRequired\(async function(?:\s+\w+)?\s*\(/g, `export default async function ${fnName}(`);
    content = content.replace(/\}\)\;(?:\s*)$/, "};");
    modified = true;
  }

  // Update session handling
  if (content.includes("const session = await getSession(req, res)") ||
      content.includes("const session = await getSession(req)")) {
    content = content.replace(/const session = await getSession\(req(?:, res)?\)/g, "const session = await auth0.getSession(req)");
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
    return true;
  } else {
    console.log(`No changes needed: ${filePath}`);
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