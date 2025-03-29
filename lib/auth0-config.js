/**
 * Shared Auth0 configuration for v3
 * This ensures consistent configuration across all Auth0 SDK functionality
 */

// Global Auth0 configuration
export const initAuth0Config = () => {
  // Get base URL with proper protocol
  const baseURL = process.env.AUTH0_BASE_URL || 'https://hub.xfoundry.org';
  
  // Log the baseURL - this is critical for debugging
  console.log('Auth0 v3 SDK initialized with baseURL:', baseURL);
  
  return {
    baseURL: baseURL,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    secret: process.env.AUTH0_SECRET,
    authorizationParams: {
      scope: 'openid profile email'
    },
    routes: {
      callback: '/api/auth/callback',
      login: '/api/auth/login',
      logout: '/api/auth/logout'
    }
  };
};

// Export the config as a singleton
const auth0Config = initAuth0Config();
export default auth0Config;