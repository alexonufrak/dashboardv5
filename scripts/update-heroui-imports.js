// Script to update HeroUI imports from individual packages to the consolidated @heroui/react package
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Skip the heroui-dashboard directory as it's archived code
const ROOT_DIR = path.resolve(__dirname, '..');
const SKIP_DIRS = ['node_modules', 'heroui-dashboard', '.git'];

// Pattern to match imports from individual HeroUI packages
const IMPORT_REGEX = /import\s+{([^}]+)}\s+from\s+["']@heroui\/(button|code|input|kbd|link|listbox|navbar|snippet|switch)["'];?/g;

// Function to collect all imports from a file
async function processFile(filePath) {
  try {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.jsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.js')) {
      return;
    }

    const content = await readFile(filePath, 'utf8');
    if (!content.includes('@heroui/')) {
      return;
    }
    
    let updatedContent = content;
    let allImports = {};
    
    // Extract all imports from individual packages
    const matches = content.matchAll(IMPORT_REGEX);
    for (const match of matches) {
      const importedItems = match[1].trim().split(',').map(item => item.trim());
      const sourcePackage = match[2];
      
      for (const item of importedItems) {
        if (item) {
          allImports[item] = true;
        }
      }
      
      // Remove the original import statement
      updatedContent = updatedContent.replace(match[0], '');
    }
    
    // If we found imports to replace
    if (Object.keys(allImports).length > 0) {
      // Add consolidated import at the top
      const importNames = Object.keys(allImports).sort().join(', ');
      const newImport = `import { ${importNames} } from "@heroui/react";`;
      
      // Add the new import statement after any existing imports
      const importIndex = updatedContent.lastIndexOf('import');
      if (importIndex >= 0) {
        const endOfImportIndex = updatedContent.indexOf('\n', importIndex);
        if (endOfImportIndex >= 0) {
          updatedContent = 
            updatedContent.substring(0, endOfImportIndex + 1) + 
            newImport + '\n' +
            updatedContent.substring(endOfImportIndex + 1);
        }
      } else {
        // If no imports, add at the beginning
        updatedContent = newImport + '\n' + updatedContent;
      }
      
      // Write the updated content back to the file
      await writeFile(filePath, updatedContent, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Recursively scan directories
async function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Skip excluded directories
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.includes(entry.name)) {
        await scanDirectory(fullPath);
      }
    } else {
      await processFile(fullPath);
    }
  }
}

// Main function
async function main() {
  console.log('Starting HeroUI import update...');
  await scanDirectory(ROOT_DIR);
  console.log('HeroUI import update completed!');
}

main().catch(console.error);