/**
 * Client utilities for Auth0 Management API operations
 * 
 * This file provides client-side methods for calling the
 * /api/auth0/management API endpoints.
 */

/**
 * Check if a user exists in Auth0 by email
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} True if user exists
 */
export async function checkUserExists(email) {
  try {
    if (!email) {
      console.warn('No email provided to checkUserExists');
      return false;
    }
    
    // Call the management API endpoint with absolute URL
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.APP_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/auth0/management`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'checkUserExists',
        email: email.toLowerCase().trim()
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error checking if user exists:', errorData);
      return false;
    }
    
    const data = await response.json();
    return data.exists === true;
  } catch (error) {
    console.error('Error calling Auth0 management API:', error);
    return false;
  }
}

/**
 * Get a user by email from Auth0
 * @param {string} email - Email to look up
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUserByEmail(email) {
  try {
    if (!email) {
      console.warn('No email provided to getUserByEmail');
      return null;
    }
    
    // Call the management API endpoint with absolute URL
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.APP_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/auth0/management`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'getUserByEmail',
        email: email.toLowerCase().trim()
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error getting user by email:', errorData);
      return null;
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error calling Auth0 management API:', error);
    return null;
  }
}

/**
 * Update user metadata in Auth0
 * @param {string} userId - Auth0 user ID 
 * @param {Object} metadata - Metadata to update
 * @returns {Promise<Object|null>} Updated user or null on error
 */
export async function updateUserMetadata(userId, metadata) {
  try {
    if (!userId) {
      console.error('User ID is required for updateUserMetadata');
      return null;
    }
    
    if (!metadata || typeof metadata !== 'object') {
      console.error('Valid metadata object is required for updateUserMetadata');
      return null;
    }
    
    // Call the management API endpoint with absolute URL
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.APP_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/auth0/management`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'updateUserMetadata',
        userId,
        metadata
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error updating user metadata:', errorData);
      return null;
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error calling Auth0 management API:', error);
    return null;
  }
}