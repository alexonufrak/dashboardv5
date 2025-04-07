import { createAuthRouteHandlers } from '@/lib/app-router-auth';

// Force Node.js runtime for Auth0 compatibility
export const runtime = 'nodejs';

// Get the logout handler from our auth utilities
const { handleLogout } = createAuthRouteHandlers();

/**
 * Logout route handler
 * Delegates to Auth0 for logging out
 */
export async function GET(request) {
  return handleLogout(request);
}