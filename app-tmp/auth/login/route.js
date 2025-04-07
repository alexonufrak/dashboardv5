import { createAuthRouteHandlers } from '@/lib/app-router-auth';

// Force Node.js runtime for Auth0 compatibility
export const runtime = 'nodejs';

// Get the login handler from our auth utilities
const { handleLogin } = createAuthRouteHandlers();

/**
 * Login route handler
 * Delegates to Auth0 for authentication
 */
export async function GET(request) {
  return handleLogin(request);
}