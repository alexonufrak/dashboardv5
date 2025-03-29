/**
 * Script to update page authentication for Auth0 v4
 * 
 * This script will update all pages using withPageAuthRequired with direct session checks
 * 
 * Usage: node scripts/update-page-auth-auth0-v4.js
 */

const fs = require('fs');
const path = require('path');

// Function to process a single file
function processFile(filePath) {
  console.log(`Processing file: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Skip files that don't use withPageAuthRequired
    if (!content.includes('withPageAuthRequired')) {
      console.log(`  No withPageAuthRequired found: ${filePath}`);
      return false;
    }
    
    // Extract the page path from the file path
    const relPath = filePath.replace(/^.*\/pages\//, '').replace(/\.js$/, '');
    const pagePath = '/' + (relPath === 'index' ? '' : relPath);
    
    // Create the replacement code
    const newAuthCode = `// Auth protection now handled in middleware.js for Auth0 v4
export const getServerSideProps = async ({ req, res }) => {
  try {
    // Get the user session, if available
    const { auth0 } = await import('@/lib/auth0');
    const session = await auth0.getSession(req, res);
    
    // If no session, middleware will redirect, but let's check just in case
    if (!session) {
      return {
        redirect: {
          destination: '/auth/login?returnTo=${pagePath}',
          permanent: false,
        },
      };
    }
    
    // Return session user data
    return {
      props: {
        user: session.user
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      redirect: {
        destination: '/auth/login?returnTo=${pagePath}',
        permanent: false,
      },
    };
  }
};`;
    
    // Replace withPageAuthRequired import
    if (content.includes("import { withPageAuthRequired }") || 
        content.includes("import {withPageAuthRequired}")) {
      content = content.replace(/import\s+\{\s*withPageAuthRequired\s*\}\s+from\s+['"]@auth0\/nextjs-auth0['"];?/g, '');
      modified = true;
    }
    
    // Replace withPageAuthRequired usage in getServerSideProps
    if (content.includes("export const getServerSideProps = withPageAuthRequired")) {
      content = content.replace(/export const getServerSideProps = withPageAuthRequired\([^)]*\);?/g, newAuthCode);
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`  Updated: ${filePath}`);
      return true;
    } else {
      console.log(`  No changes made: ${filePath}`);
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
  const pagesDir = path.join(__dirname, '..', 'pages');
  let updatedCount = 0;
  
  // Process all JavaScript files in the pages directory
  walkDir(pagesDir, (filePath) => {
    if (processFile(filePath)) {
      updatedCount++;
    }
  }, (filePath) => filePath.endsWith('.js') || filePath.endsWith('.jsx'));
  
  console.log(`\nCompleted! Updated ${updatedCount} files.`);
}

main();