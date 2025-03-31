/**
 * Standardized Airtable error with additional context
 */
export class AirtableError extends Error {
  constructor(message, originalError = null, context = {}) {
    super(message);
    this.name = 'AirtableError';
    this.originalError = originalError;
    this.statusCode = originalError?.statusCode;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.requestId = `req_${Date.now().toString(36)}`;
  }
  
  /**
   * Format the error for logging
   * @returns {Object} Formatted error object
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: this.timestamp,
      requestId: this.requestId,
      originalError: this.originalError ? {
        message: this.originalError.message,
        stack: this.originalError.stack
      } : null
    };
  }
}

/**
 * Handle Airtable errors with proper categorization
 * @param {Error} error The error to handle
 * @param {string} operation Description of the operation that failed
 * @param {Object} context Additional context data
 * @returns {AirtableError} Enhanced error object
 */
export function handleAirtableError(error, operation, context = {}) {
  // Create user-friendly error message based on error type
  let userMessage;
  
  // Check if it's a rate limit error
  if (error.statusCode === 429) {
    userMessage = 'Rate limit exceeded. Please try again in a few moments.';
  } 
  // Check if it's an authentication error
  else if (error.statusCode === 401 || error.statusCode === 403) {
    userMessage = 'Authentication failed. Please contact support.';
  }
  // Check if it's a not found error
  else if (error.statusCode === 404) {
    userMessage = 'The requested data could not be found.';
  }
  // Handle timeout errors
  else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
    userMessage = 'The request timed out. Please try again.';
  }
  // Handle network errors
  else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    userMessage = 'Network error. Please check your connection.';
  }
  // Handle invalid JSON responses
  else if (error.message && error.message.includes('JSON')) {
    userMessage = 'Invalid response from server. Please try again.';
  }
  // Default error message
  else {
    userMessage = `An error occurred while ${operation}. Please try again or contact support.`;
  }
  
  // Create enhanced error
  return new AirtableError(
    userMessage,
    error,
    {
      operation,
      ...context
    }
  );
}

export default {
  AirtableError,
  handleAirtableError
};