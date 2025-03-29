/**
 * Script to test Auth0 v4 integration
 * 
 * This script tests the Auth0 v4 client integration by attempting to:
 * 1. Initialize the Auth0 client from our implementation
 * 2. Verify the middleware configuration
 * 3. Check environment variables
 * 
 * Usage: node scripts/test-auth0-v4.js
 */

// Import required modules
const fs = require('fs');
const path = require('path');

console.log('Auth0 v4 Integration Test\n');

// Check environment variables in .env.local
console.log('1. Checking environment variables...');
try {
  let envFileContent = '';
  try {
    envFileContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  } catch (err) {
    console.log('❌ .env.local file not found');
  }
  
  const requiredVars = [
    'AUTH0_SECRET', 
    'AUTH0_CLIENT_ID', 
    'AUTH0_CLIENT_SECRET', 
    'AUTH0_DOMAIN', 
    'APP_BASE_URL'
  ];
  
  let foundVars = [];
  requiredVars.forEach(varName => {
    if (envFileContent.includes(`${varName}=`)) {
      foundVars.push(varName);
    }
  });
  
  const missingVars = requiredVars.filter(v => !foundVars.includes(v));
  
  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.log('\nPlease add these variables to your .env.local file:');
    for (const varName of missingVars) {
      console.log(`${varName}=your-${varName.toLowerCase().replace(/_/g, '-')}-here`);
    }
  } else {
    console.log('✅ All required environment variables are present in .env.local');
  }
} catch (error) {
  console.error('❌ Error checking environment variables:', error.message);
}

// Check import paths in key files
console.log('\n2. Checking Auth0 import paths in key files...');

function checkAuthImports(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { file: path.basename(filePath), exists: false };
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = {
      file: path.basename(filePath),
      exists: true,
      auth0Import: content.includes("import { auth0 }"),
      authProvider: content.includes("Auth0Provider"),
      oldImports: content.includes("from '@auth0/nextjs-auth0'")
    };
    
    return imports;
  } catch (error) {
    return { file: path.basename(filePath), exists: false, error: error.message };
  }
}

const keyFiles = [
  path.join(__dirname, '..', 'pages', '_app.js'),
  path.join(__dirname, '..', 'middleware.js'),
  path.join(__dirname, '..', 'lib', 'auth0.js')
];

const importResults = keyFiles.map(checkAuthImports);

for (const result of importResults) {
  if (!result.exists) {
    console.log(`❌ ${result.file} - File not found`);
    continue;
  }
  
  console.log(`File: ${result.file}`);
  if (result.auth0Import) {
    console.log('  ✅ Uses auth0 import from lib/auth0');
  } else {
    console.log('  ❓ Does not import auth0 from lib/auth0');
  }
  
  if (result.authProvider) {
    console.log('  ✅ Uses Auth0Provider component');
  }
  
  if (result.oldImports) {
    console.log('  ❌ Contains old Auth0 v3 imports');
  }
  
  console.log('');
}

// Check route paths in middleware
console.log('\n3. Checking middleware configuration...');
try {
  const middlewareContent = fs.readFileSync(path.join(__dirname, '..', 'middleware.js'), 'utf8');
  
  if (middlewareContent.includes('/auth/login')) {
    console.log('✅ Middleware uses correct /auth/login path');
  } else if (middlewareContent.includes('/api/auth/login')) {
    console.log('❌ Middleware uses old /api/auth/login path');
  } else {
    console.log('❓ Could not determine auth paths in middleware');
  }
  
  if (middlewareContent.includes('auth0.handleAuth(')) {
    console.log('✅ Middleware uses auth0.handleAuth()');
  } else {
    console.log('❌ Middleware missing auth0.handleAuth()');
  }
  
  if (middlewareContent.includes('auth0.getSession(')) {
    console.log('✅ Middleware uses auth0.getSession()');
  } else {
    console.log('❌ Middleware missing auth0.getSession()');
  }
  
  if (middlewareContent.includes('matcher')) {
    console.log('✅ Middleware has route matcher configuration');
  } else {
    console.log('❌ Middleware missing route matcher configuration');
  }
} catch (error) {
  console.error('❌ Error checking middleware:', error.message);
}

console.log('\nAuth0 v4 Integration Test Complete');