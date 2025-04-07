import { createAuthRouteHandlers } from '@/lib/app-router-auth';

/**
 * Auth Login Route Handler
 * Implements Auth0 login flow
 */
export async function GET(request) {
  const { handleLogin } = createAuthRouteHandlers();
  return handleLogin(request);
}

export const dynamic = 'force-dynamic';