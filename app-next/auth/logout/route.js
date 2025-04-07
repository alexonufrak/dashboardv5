import { createAuthRouteHandlers } from '@/lib/app-router-auth';

/**
 * Auth Logout Route Handler
 * Implements Auth0 logout flow
 */
export async function GET(request) {
  const { handleLogout } = createAuthRouteHandlers();
  return handleLogout(request);
}

export const dynamic = 'force-dynamic';