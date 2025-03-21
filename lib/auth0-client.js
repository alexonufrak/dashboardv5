import { Auth0Client } from '@auth0/nextjs-auth0/server';

/**
 * Handle the environment variables mapping from v3 to v4
 * 
 * v3 -> v4 mapping:
 * - AUTH0_BASE_URL -> APP_BASE_URL
 * - AUTH0_ISSUER_BASE_URL -> AUTH0_DOMAIN (without scheme)
 */

// Map domain from old to new format
const oldDomain = process.env.AUTH0_ISSUER_BASE_URL;
const domain = oldDomain ? oldDomain.replace(/^https?:\/\//, '') : process.env.AUTH0_DOMAIN;

// Map base URL from old to new format
const appBaseUrl = process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL || 'http://localhost:3000';

// Get client ID and secret
const clientId = process.env.AUTH0_CLIENT_ID;
const clientSecret = process.env.AUTH0_CLIENT_SECRET;

// Get secret for cookie encryption
const secret = process.env.AUTH0_SECRET || process.env.AUTH0_COOKIE_SECRET;

/**
 * Create the Auth0 client instance for the application
 * 
 * This follows the Auth0 NextJS SDK v4 pattern
 */
export const auth0 = new Auth0Client({
  // Required v4 configuration with v3 fallbacks
  domain,
  clientId,
  clientSecret,
  secret,
  appBaseUrl,
  
  // Authorization parameters that get sent to Auth0
  authorizationParameters: {
    // Add scopes needed for your application
    scope: 'openid profile email',
    
    // Include audience if it was previously set as an environment variable
    ...(process.env.AUTH0_AUDIENCE ? { audience: process.env.AUTH0_AUDIENCE } : {}),
  },
  
  // Session configuration
  session: {
    // Enable rolling sessions (recommended)
    rollingDuration: 24 * 60 * 60, // 24 hours
    absoluteDuration: 7 * 24 * 60 * 60, // 7 days
  },
});

/**
 * Simplified wrapper for backward compatibility with the old Auth0 API
 */
export const getSession = async (req) => {
  try {
    return await auth0.getSession(req);
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

/**
 * This is a backward compatibility helper for pages using the old API
 * In v4, this is no longer needed as you can just use the getSession method
 */
export const withPageAuthRequired = (options) => {
  console.warn('withPageAuthRequired is deprecated in Auth0 v4, using fallback implementation');
  
  // Simple implementation to maintain compatibility
  return async (context) => {
    const session = await getSession(context.req);
    
    if (!session) {
      return {
        redirect: {
          destination: '/auth/login',
          permanent: false,
        },
      };
    }
    
    // If options is a function, call it with the session
    if (typeof options === 'function') {
      return options(context);
    }
    
    // Otherwise, return the session
    return {
      props: {
        user: session.user,
        ...((options?.getServerSideProps) 
          ? await options.getServerSideProps(context)
          : {}),
      },
    };
  };
};

/**
 * Backward compatibility for client hooks and components
 */
// Export backward compatible hooks and components
export * from '@auth0/nextjs-auth0';

// Export Auth0Provider as a backward compatibility wrapper for UserProvider
export { default as UserProvider } from './auth0-provider-compat';