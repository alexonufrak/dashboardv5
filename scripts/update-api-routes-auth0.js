/**
 * Script to update API routes to use Auth0 v3
 * 
 * This script will update all API routes in /pages/api directory to use Auth0 v3
 * - Change imports from '@/lib/auth0' to '@auth0/nextjs-auth0'
 * - Change auth0.getSession(req) to getSession(req, res)
 * - Wrap handler functions with withApiAuthRequired
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

  // Skip files that are already using Auth0 v3
  if (content.includes("import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0'") ||
      content.includes("import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0'")) {
    console.log(`  Already using Auth0 v3: ${filePath}`);
    return false;
  }

  // Update imports
  if (content.includes("import { auth0 } from '@/lib/auth0'")) {
    content = content.replace(/import \{ auth0 \} from '@\/lib\/auth0'/g, "import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0'");
    modified = true;
  }

  // Update session handling
  if (content.includes("const session = await auth0.getSession(req)")) {
    content = content.replace(/const session = await auth0\.getSession\(req\)/g, "const session = await getSession(req, res)");
    modified = true;
  }

  // Update handler function
  if (!content.includes("export default withApiAuthRequired") && content.includes("export default async function")) {
    // Extract the function name
    const fnNameMatch = content.match(/export default async function (\w+)\(/);
    const fnName = fnNameMatch ? fnNameMatch[1] : "handler";
    
    // Replace the export with withApiAuthRequired wrapper
    content = content.replace(/export default async function \w+\(/, `async function ${fnName}(`);
    
    // Add the export with withApiAuthRequired
    if (content.includes("// In Auth0 v4")) {
      content = content.replace(/\/\/ In Auth0 v4.+$/m, `// In Auth0 v3, we use withApiAuthRequired to protect API routes\nexport default withApiAuthRequired(${fnName})`);
    } else {
      // Add at the end if the comment doesn't exist
      content = content.replace(/export default async function/, `async function`);
      content += `\n\nexport default withApiAuthRequired(${fnName})`;
    }
    
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