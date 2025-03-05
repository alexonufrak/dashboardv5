#!/usr/bin/env node

/**
 * This script patches the Vercel Blob SDK to use a custom environment variable name.
 * It modifies the node_modules/@vercel/blob/dist/chunk-VMBKF2I4.js file.
 */

const fs = require('fs');
const path = require('path');

// Define the path to the Vercel Blob module
const blobModulePath = path.resolve(
  __dirname,
  '../node_modules/@vercel/blob/dist/chunk-VMBKF2I4.js'
);

// Define the custom environment variable name
const CUSTOM_ENV_VAR = 'FILE_UPLOAD_READ_WRITE_TOKEN';

// Check if the file exists
if (!fs.existsSync(blobModulePath)) {
  console.error(`Error: ${blobModulePath} not found`);
  console.error('Make sure @vercel/blob is installed in your project');
  process.exit(1);
}

try {
  // Read the file
  let content = fs.readFileSync(blobModulePath, 'utf8');
  
  // Backup the original file
  fs.writeFileSync(`${blobModulePath}.backup`, content);
  console.log(`Backup created at ${blobModulePath}.backup`);
  
  // Replace the default environment variable name with our custom one
  content = content.replace(
    /if \(process\.env\.BLOB_READ_WRITE_TOKEN\) {/g,
    `if (process.env.${CUSTOM_ENV_VAR} || process.env.BLOB_READ_WRITE_TOKEN) {`
  );
  
  content = content.replace(
    /return process\.env\.BLOB_READ_WRITE_TOKEN;/g,
    `return process.env.${CUSTOM_ENV_VAR} || process.env.BLOB_READ_WRITE_TOKEN;`
  );
  
  content = content.replace(
    /"No token found. Either configure the `BLOB_READ_WRITE_TOKEN` environment variable, or pass a `token` option to your calls."/g,
    `"No token found. Either configure the \`${CUSTOM_ENV_VAR}\` environment variable, or pass a \`token\` option to your calls."`
  );
  
  // Also update the error message in client.js
  const clientJsPath = path.resolve(
    __dirname,
    '../node_modules/@vercel/blob/dist/client.js'
  );
  
  if (fs.existsSync(clientJsPath)) {
    let clientContent = fs.readFileSync(clientJsPath, 'utf8');
    fs.writeFileSync(`${clientJsPath}.backup`, clientContent);
    
    clientContent = clientContent.replace(
      /token \? "Invalid `token` parameter" : "Invalid `BLOB_READ_WRITE_TOKEN`"/g,
      `token ? "Invalid \`token\` parameter" : "Invalid \`${CUSTOM_ENV_VAR}\`"`
    );
    
    fs.writeFileSync(clientJsPath, clientContent);
    console.log(`Updated ${clientJsPath}`);
  }
  
  // Write the modified content back to the file
  fs.writeFileSync(blobModulePath, content);
  console.log(`Successfully patched ${blobModulePath}`);
  console.log(`Vercel Blob SDK now uses ${CUSTOM_ENV_VAR} environment variable`);
} catch (error) {
  console.error('Error patching Vercel Blob module:', error);
  process.exit(1);
}