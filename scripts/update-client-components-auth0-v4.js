/**
 * Script to update client-side components to use Auth0 v4
 * 
 * This script will update all client-side components to use Auth0 v4
 * - Change imports from '@auth0/nextjs-auth0/client' to '@auth0/nextjs-auth0'
 * - Change UserProvider to Auth0Provider
 * - Update withPageAuthRequired usage
 * 
 * Usage: node scripts/update-client-components-auth0-v4.js
 */

const fs = require('fs');
const path = require('path');

// Function to process a single file
function processFile(filePath) {
  console.log(`Processing file: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Update imports
  if (content.includes("import { UserProvider") && content.includes("from '@auth0/nextjs-auth0'")) {
    content = content.replace(/import \{ UserProvider([^\}]*)\} from '@auth0\/nextjs-auth0'/g, 
                           "import { Auth0Provider$1} from '@auth0/nextjs-auth0'");
    modified = true;
  }

  // Update UserProvider to Auth0Provider in JSX
  if (content.includes("<UserProvider")) {
    content = content.replace(/<UserProvider/g, "<Auth0Provider");
    content = content.replace(/<\/UserProvider>/g, "</Auth0Provider>");
    modified = true;
  }

  // Update withPageAuthRequired
  if (content.includes("import { withPageAuthRequired") && content.includes("from '@auth0/nextjs-auth0'")) {
    // Add comment to help with manual migration
    content = content.replace(/import \{ withPageAuthRequired([^\}]*)\} from '@auth0\/nextjs-auth0'/g, 
                           "// TODO: Auth0 v4 no longer exports withPageAuthRequired in the same way\n// Manual update required: use getServerSideProps with auth0.getSession(req, res) and middleware.js\n// Original import: import { withPageAuthRequired$1} from '@auth0/nextjs-auth0'");
    
    // Try to update withPageAuthRequired usage in getServerSideProps
    if (content.includes("export const getServerSideProps = withPageAuthRequired")) {
      content = content.replace(/export const getServerSideProps = withPageAuthRequired\((?:\(\) => )?\{([^}]*)\}\)/g, 
                             `export const getServerSideProps = async ({ req, res }) => {
  try {
    // Get the user session from Auth0
    const { auth0 } = await import('@/lib/auth0');
    const session = await auth0.getSession(req, res);
    
    // If no session, redirect to login
    if (!session) {
      return {
        redirect: {
          destination: '/api/auth/login',
          permanent: false,
        },
      };
    }
    
    // Original getServerSideProps logic
    $1
    
    return {
      props: {
        user: session.user
      }
    };
  } catch (error) {
    console.error('Auth error in getServerSideProps:', error);
    return {
      redirect: {
        destination: '/api/auth/login',
        permanent: false,
      },
    };
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
  const directories = [
    path.join(__dirname, '..', 'pages'),
    path.join(__dirname, '..', 'components')
  ];
  
  let updatedCount = 0;
  
  // Process all JavaScript files in the specified directories
  directories.forEach(dir => {
    walkDir(dir, (filePath) => {
      if (processFile(filePath)) {
        updatedCount++;
      }
    }, (filePath) => filePath.endsWith('.js') || filePath.endsWith('.jsx'));
  });
  
  console.log(`\nCompleted! Updated ${updatedCount} files.`);
}

main();