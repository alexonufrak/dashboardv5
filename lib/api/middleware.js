/**
 * API Middleware Pattern
 * 
 * Creates standardized API handlers with consistent authentication,
 * error handling, and performance monitoring.
 * 
 * Compatible with Auth0 v4 and Next.js 14 Pages Router
 */
import { auth0 } from '@/lib/auth0';

// Force Node.js runtime for Auth0 compatibility
export const runtime = 'nodejs';

/**
 * Creates a standardized API handler with authentication and error handling
 * 
 * @param {Object} handlers - Method handlers object (GET, POST, etc.)
 * @param {Object} options - Configuration options
 * @returns {Function} Next.js API route handler
 */
export function createApiHandler(handlers, options = {}) {
  const { 
    requireAuth = true,
    cors = false,
    rateLimiting = false,
    cacheControl = 'no-store, private, no-cache, must-revalidate',
    errorHandler = defaultErrorHandler
  } = options;
  
  return async function apiHandler(req, res) {
    // Start timing for performance monitoring
    const startTime = Date.now();
    
    // Set standard headers
    if (cacheControl) {
      res.setHeader('Cache-Control', cacheControl);
    }
    
    // CORS handling if enabled
    if (cors) {
      res.setHeader('Access-Control-Allow-Credentials', true);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
      res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
      
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
    }
    
    try {
      // Apply rate limiting if enabled - implementation would go here
      if (rateLimiting) {
        // Implementation of rate limiting logic
      }
      
      // Authentication
      let session = null;
      let user = null;
      
      if (requireAuth) {
        session = await auth0.getSession(req, res);
        if (!session?.user) {
          return res.status(401).json({ 
            error: "Not authenticated",
            message: "You must be logged in to access this resource"
          });
        }
        user = session.user;
      }
      
      // Handle POST method override for PATCH/PUT (SameSite cookie workaround)
      let method = req.method;
      if (method === 'POST' && req.body?._method) {
        method = req.body._method.toUpperCase();
      }
      
      // Method handling
      const handler = handlers[method];
      
      if (!handler) {
        return res.status(405).json({ 
          error: "Method not allowed",
          message: `The method ${method} is not allowed for this endpoint`,
          allowedMethods: Object.keys(handlers)
        });
      }
      
      // Execute the appropriate handler
      await handler(req, res, { user, session, startTime });
      
      // Log performance metrics (only if response hasn't been sent yet)
      if (!res.writableEnded) {
        const duration = Date.now() - startTime;
        console.log(`[API] ${req.method} ${req.url} - ${duration}ms`);
      }
      
    } catch (error) {
      return errorHandler(error, req, res, startTime);
    }
  };
}

/**
 * Default error handler for API requests
 * 
 * @param {Error} error - The caught error
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 * @param {number} startTime - Request start time for performance tracking
 * @returns {Object} Error response
 */
function defaultErrorHandler(error, req, res, startTime) {
  // Log the error with context
  console.error(`[API Error] ${req.method} ${req.url}:`, error);
  
  // Determine appropriate status code
  const statusCode = error.status || error.statusCode || 500;
  
  // Check for specific Airtable schema errors
  let errorMessage = error.message;
  let errorType = error.name || 'UnknownError';
  
  if (error.message && error.message.includes('Unknown field name')) {
    errorMessage = 'Database schema error: Unknown field name referenced. The schema may have changed. Please contact support.';
    console.error('Schema error detected. Original error:', error.message);
    errorType = 'SchemaError';
  }
  
  // Check for network-related errors
  const isNetworkError = error.code === 'ECONNRESET' || 
                       error.code === 'ETIMEDOUT' || 
                       error.name === 'AbortError';
  
  if (isNetworkError) {
    errorMessage = 'Network error occurred while communicating with the database. Please try again.';
    errorType = 'NetworkError';
  }
  
  // Create standardized error response
  const errorResponse = {
    error: errorType,
    message: errorMessage,
    requestId: `req_${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
    processingTime: Date.now() - startTime
  };
  
  // Include stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = error.stack;
  }
  
  return res.status(statusCode).json(errorResponse);
}

/**
 * Creates a standardized response object with metadata
 * 
 * @param {any} data - The data to include in the response
 * @param {number} startTime - Request start time for performance tracking
 * @returns {Object} Formatted response object
 */
export function createApiResponse(data, startTime) {
  return {
    ...data,
    _meta: {
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime
    }
  };
}

export default {
  createApiHandler,
  createApiResponse
};