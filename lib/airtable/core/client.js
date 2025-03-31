import Airtable from 'airtable';

// Private variables
let airtableClient = null;
let baseId = null;

/**
 * Initialize the Airtable client with credentials
 * @param {Object} config Configuration options
 * @param {string} config.apiKey Airtable API key
 * @param {string} config.baseId Airtable base ID
 */
export function initializeClient(config) {
  if (!config.apiKey) {
    throw new Error('Airtable API key is required');
  }
  
  if (!config.baseId) {
    throw new Error('Airtable base ID is required');
  }
  
  baseId = config.baseId;
  airtableClient = new Airtable({ apiKey: config.apiKey });
  
  return airtableClient;
}

/**
 * Get the Airtable client, initializing if necessary
 * @returns {Object} Airtable client
 */
export function getClient() {
  if (!airtableClient) {
    initializeClient({
      apiKey: process.env.AIRTABLE_API_KEY,
      baseId: process.env.AIRTABLE_BASE_ID
    });
  }
  
  return airtableClient;
}

/**
 * Get a base instance for making requests
 * @returns {Object} Airtable base
 */
export function getBase() {
  const client = getClient();
  return client.base(baseId || process.env.AIRTABLE_BASE_ID);
}

/**
 * Execute a query function with proper error handling
 * @param {Function} queryFn The function that performs the Airtable query
 * @returns {Promise<*>} The result of the query
 */
export async function executeQuery(queryFn) {
  try {
    return await queryFn();
  } catch (error) {
    // Add request ID and timestamp
    const enhancedError = new Error(`Airtable query failed: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.requestId = `req_${Date.now().toString(36)}`;
    enhancedError.timestamp = new Date().toISOString();
    
    // Log detailed error information for debugging
    console.error('Airtable query error:', {
      message: error.message,
      requestId: enhancedError.requestId,
      timestamp: enhancedError.timestamp,
      status: error.statusCode,
      stack: error.stack
    });
    
    throw enhancedError;
  }
}

export default {
  initializeClient,
  getClient,
  getBase,
  executeQuery
};