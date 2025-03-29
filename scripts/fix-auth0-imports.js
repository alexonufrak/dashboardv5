/**
 * Script to fix missing Auth0 imports in API files
 * This script finds all API files that use auth0.getSession but don't import auth0
 * and adds the import.
 */
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const glob = promisify(require('glob'));

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

async function fixAuth0Imports() {
  try {
    console.log('Searching for API files with missing Auth0 imports...');
    
    // Get all JS files in the API directory
    const apiFiles = await glob('pages/api/**/*.js', { cwd: process.cwd() });
    console.log(`Found ${apiFiles.length} API files to check.`);
    
    let fixedCount = 0;
    
    // Process each file
    for (const filePath of apiFiles) {
      const fullPath = path.join(process.cwd(), filePath);
      
      // Read the file content
      const content = await readFile(fullPath, 'utf-8');
      
      // Check if the file uses auth0.getSession but doesn't import auth0
      if (content.includes('auth0.getSession') && !content.match(/import.+auth0.+from/)) {
        console.log(`Fixing imports in ${filePath}`);
        
        // Determine the right import path based on file depth
        // Count directory levels to get the right relative path
        const depth = filePath.split('/').length - 2; // Subtract 'pages/api'
        const relativePath = '../'.repeat(depth);
        
        // Create import statement based on file depth
        let authImport = `import { auth0 } from '${relativePath}../lib/auth0';`;
        
        // For deeper files, use the @/ alias as more reliable
        if (depth > 1) {
          authImport = `import { auth0 } from '@/lib/auth0';`;
        }
        
        // Add the import after existing imports
        let updatedContent;
        if (content.includes('import ')) {
          // Find the last import statement
          const imports = content.match(/import[^;]*;/g) || [];
          if (imports.length > 0) {
            const lastImport = imports[imports.length - 1];
            updatedContent = content.replace(lastImport, `${lastImport}\n${authImport}`);
          } else {
            // No imports found, add at the beginning
            updatedContent = `${authImport}\n\n${content}`;
          }
        } else {
          // No imports at all, add at the beginning
          updatedContent = `${authImport}\n\n${content}`;
        }
        
        // Write the updated content back to the file
        await writeFile(fullPath, updatedContent, 'utf-8');
        fixedCount++;
      }
    }
    
    console.log(`\nFixed Auth0 imports in ${fixedCount} files.`);
    if (fixedCount === 0) {
      console.log('All API files already have proper Auth0 imports.');
    }
  } catch (error) {
    console.error('Error fixing Auth0 imports:', error);
    process.exit(1);
  }
}

// Run the function
fixAuth0Imports();