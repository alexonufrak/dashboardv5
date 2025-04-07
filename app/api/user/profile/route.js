import { withAuth, json } from '@/app/api-route';
import { getUserByAuth0Id } from '@/lib/airtable/entities/users';

/**
 * User Profile API Route
 * Returns the authenticated user's profile
 */
export const GET = withAuth(async (request, { session }) => {
  try {
    const user = session.user;
    
    // Get user profile from Airtable
    const profile = await getUserByAuth0Id(user.sub);
    
    if (!profile) {
      return json({ error: 'Profile not found' }, { status: 404 });
    }
    
    return json({ 
      profile,
      auth0User: {
        sub: user.sub,
        email: user.email,
        email_verified: user.email_verified,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
});

export const dynamic = 'force-dynamic';