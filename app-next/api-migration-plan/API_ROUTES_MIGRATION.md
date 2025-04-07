# API Routes Migration Plan

This document outlines the plan for migrating API routes from Pages Router to App Router. The migration will be done systematically by category.

## Migration Strategy

1. Create equivalent Route Handlers in the App Router
2. Ensure authentication is properly handled
3. Update data fetching to use modern patterns
4. Test each endpoint thoroughly
5. Update client components to use the new endpoints when ready

## API Route Categories

### User & Profile (Priority 1) ✅ COMPLETED
- [x] `/api/user/profile` → `/api/user/profile/route.js` (implemented as example)
- [x] `/api/user/profile-v3` → `/api/user/profile-v3/route.js` (implemented as example)
- [x] `/api/user/profile-v2` → `/api/user/profile-v2/route.js`
- [x] `/api/user/lookup` → `/api/user/lookup/route.js`
- [x] `/api/user/metadata` → `/api/user/metadata/route.js`
- [x] `/api/user/check-email` → `/api/user/check-email/route.js`
- [x] `/api/user/check-email-v2` (covered by the above implementation)
- [x] `/api/user/check-application` → `/api/user/check-application/route.js`
- [x] `/api/user/check-initiative-conflicts` → `/api/user/check-initiative-conflicts/route.js`
- [x] `/api/user/majors` → `/api/user/majors/route.js`
- [x] `/api/user/team` → `/api/user/team/route.js`
- [x] `/api/user/onboarding-completed` → `/api/user/onboarding-completed/route.js`
- [x] `/api/user/onboarding-completed-v2` → `/api/user/onboarding-completed-v2/route.js`
- [x] `/api/user/participation` → `/api/user/participation/route.js`
- [x] `/api/user/participation-v2` → `/api/user/participation-v2/route.js`

### Authentication (Priority 1) ✅ COMPLETED
- [x] `/api/auth/debug-session` → `/api/auth/debug-session/route.js`
- [x] `/api/auth0/management` → `/api/auth0/management/route.js`
- [x] `/api/debug/auth-status` → `/api/debug/auth-status/route.js`

### Education & Institutions (Priority 2) ✅ COMPLETED
- [x] `/api/education/mine` → `/api/education/mine/route.js`
- [x] `/api/education/[educationId]` → `/api/education/[educationId]/route.js`
- [x] `/api/institutions/index` → `/api/institutions/route.js`
- [x] `/api/institutions/[institutionId]/index` → `/api/institutions/[institutionId]/route.js`
- [x] `/api/institutions/[institutionId]/partnerships` → `/api/institutions/[institutionId]/partnerships/route.js`
- [x] `/api/institution-lookup` → `/api/institution-lookup/route.js`

### Contacts (Priority 2)
- [x] `/api/contacts/me` → `/api/contacts/me/route.js`
- [x] `/api/contacts/check` → `/api/contacts/check/route.js`

### Teams (Priority 2) ✅ COMPLETED
- [x] `/api/teams/index` → `/api/teams/route.js`
- [x] `/api/teams/[teamId]` → `/api/teams/[teamId]/route.js`
- [x] `/api/teams/create` → `/api/teams/create/route.js`
- [x] `/api/teams/create-v2` (covered by the above implementation)
- [x] `/api/teams/joinable` → `/api/teams/joinable/route.js`
- [x] `/api/teams/submissions` → `/api/teams/submissions/route.js`
- [x] `/api/teams/[teamId]/cohorts` → `/api/teams/[teamId]/cohorts/route.js`
- [x] `/api/teams/[teamId]/submissions` → `/api/teams/[teamId]/submissions/route.js`
- [x] `/api/teams/[teamId]/invite` → `/api/teams/[teamId]/invite/route.js`
- [x] `/api/teams/[teamId]/leave` → `/api/teams/[teamId]/leave/route.js`
- [x] `/api/teams/[teamId]/members/[memberId]` → `/api/teams/[teamId]/members/[memberId]/route.js`
- [x] `/api/teams/members/[teamId]` → `/api/teams/members/[teamId]/route.js`
- [x] `/api/teams/members/update-v2` → `/api/teams/members/update-v2/route.js`

### Participation & Applications (Priority 2)
- [x] `/api/participation/mine` → `/api/participation/mine/route.js`
- [x] `/api/participation/leave-v2` → `/api/participation/leave-v2/route.js`
- [x] `/api/participation/[participationId]/leave` → `/api/participation/[participationId]/leave/route.js`
- [x] `/api/applications/mine` → `/api/applications/mine/route.js`
- [x] `/api/applications/create` → `/api/applications/create/route.js`
- [x] `/api/applications/check` → `/api/applications/check/route.js`
- [x] `/api/applications/update-status` → `/api/applications/update-status/route.js`

### Programs & Cohorts (Priority 3) ✅ COMPLETED
- [x] `/api/cohorts/public` → `/api/cohorts/public/route.js`
- [x] `/api/cohorts/[cohortId]` → `/api/cohorts/[cohortId]/route.js`
- [x] `/api/cohorts/[cohortId]/details` → `/api/cohorts/[cohortId]/details/route.js`
- [x] `/api/cohorts/[cohortId]/milestones` → `/api/cohorts/[cohortId]/milestones/route.js`
- [x] `/api/programs/details-v2` → `/api/programs/details-v2/route.js`
- [x] `/api/programs/[programId]/partnerships` → `/api/programs/[programId]/partnerships/route.js`

### Dashboard Elements (Priority 3) ✅ COMPLETED
- [x] `/api/dashboard/overview-v2` → `/api/dashboard/overview-v2/route.js`
- [x] `/api/events/upcoming-v2` → `/api/events/upcoming/route.js`
- [x] `/api/resources/available-v2` → `/api/resources/available-v2/route.js`
- [x] `/api/points/achievements` → `/api/points/achievements/route.js`
- [x] `/api/points/transactions` → `/api/points/transactions/route.js`
- [x] `/api/points/user-summary-v2` → `/api/points/user-summary-v2/route.js`
- [x] `/api/submissions/team-v2` → `/api/submissions/team-v2/route.js`

### Partnerships (Priority 3) ✅ COMPLETED
- [x] `/api/partnerships/index` → `/api/partnerships/route.js`
- [x] `/api/partnerships/[partnershipId]` → `/api/partnerships/[partnershipId]/route.js`

### Invites & Email (Priority 4) ✅ COMPLETED
- [x] `/api/invite/[token]` → `/api/invite/[token]/route.js`
- [x] `/api/invite/accept` → `/api/invite/accept/route.js`
- [x] `/api/email/send` → `/api/email/send/route.js`
- [x] `/api/email/send-team-invite` → `/api/email/send-team-invite/route.js`

### Rewards & Bounties (Priority 4) ✅ COMPLETED
- [x] `/api/rewards/index` → `/api/rewards/route.js`
- [x] `/api/rewards/available-v2` → `/api/rewards/available-v2/route.js`
- [x] `/api/rewards/claim` → `/api/rewards/claim/route.js`
- [x] `/api/rewards/claim-v2` → `/api/rewards/claim-v2/route.js`
- [x] `/api/rewards/claimed` → `/api/rewards/claimed/route.js`
- [x] `/api/bounties/index` → `/api/bounties/route.js`

### Uploads (Priority 4) ✅ COMPLETED
- [x] `/api/upload/index` → `/api/upload/route.js`
- [x] `/api/upload/direct` → `/api/upload/direct/route.js`

### Debug (Priority 5) ✅ COMPLETED
- [x] `/api/debug/team-data` → `/api/debug/team-data/route.js`
- [x] `/api/debug/ddd-test` → `/api/debug/ddd-test/route.js`

## Implementation Notes

### Authentication
All Route Handlers should use the new auth helpers from `lib/app-router-auth.js`:
```javascript
import { getCurrentUser, requireAuth } from '@/lib/app-router-auth';

// For protected routes that should redirect if not authenticated
export async function GET(request) {
  await requireAuth(); // This redirects if not authenticated
  // ...
}

// For routes that handle authentication themselves
export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  // ...
}
```

### Error Handling
All Route Handlers should implement comprehensive error handling:
```javascript
try {
  // Route handler logic
} catch (error) {
  console.error("API error:", error);
  return NextResponse.json({ 
    error: "Error message",
    message: error.message
  }, { status: 500 });
}
```

### Headers
Set appropriate cache control and content type headers:
```javascript
const headers = {
  'Cache-Control': 'no-store, private, no-cache, must-revalidate',
  'Content-Type': 'application/json'
};

return NextResponse.json(data, { headers });
```

### Performance Tracking
Include performance metrics when appropriate:
```javascript
const startTime = Date.now();
// ... route handler logic
return NextResponse.json({
  data,
  _meta: {
    processingTime: Date.now() - startTime,
    timestamp: new Date().toISOString()
  }
});
```

## Migration Patterns

### Common Route Handler Structure

```javascript
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/app-router-auth';

// Force Node.js runtime for Auth0 compatibility
export const runtime = 'nodejs';

// GET handler
export async function GET(request) {
  const startTime = Date.now();
  
  try {
    // Get authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Parse URL parameters if needed
    const { searchParams } = new URL(request.url);
    const param = searchParams.get('param');
    
    // Handler logic
    // ...
    
    // Return successful response
    return NextResponse.json({
      data,
      _meta: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        appRouter: true
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, private, no-cache, must-revalidate'
      }
    });
  } catch (error) {
    console.error('API error:', error);
    
    return NextResponse.json({ 
      error: 'Error message',
      message: error.message,
      _meta: {
        errorType: error.name || 'UnknownError',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
```

### Dynamic Route Handler Structure

```javascript
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/app-router-auth';

// Force Node.js runtime for Auth0 compatibility
export const runtime = 'nodejs';

// GET handler for dynamic route
export async function GET(request, { params }) {
  const startTime = Date.now();
  const { id } = params; // Extract route parameter
  
  try {
    // Get authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Handler logic using the id parameter
    // ...
    
    // Return successful response
    return NextResponse.json({
      data,
      _meta: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        appRouter: true
      }
    });
  } catch (error) {
    console.error(`API error for ID ${id}:`, error);
    
    return NextResponse.json({ 
      error: 'Error message',
      message: error.message,
      _meta: {
        errorType: error.name || 'UnknownError',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
```