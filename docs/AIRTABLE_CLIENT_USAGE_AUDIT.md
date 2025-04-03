# Airtable Client Usage Audit

This document provides a comprehensive inventory of client-side components and hooks that directly access Airtable entities, which need to be refactored to use the API-first approach.

## Executive Summary

We've conducted a thorough audit of the codebase to identify all instances where client-side code directly accesses Airtable entities. This audit forms the foundation for our migration plan toward a consistent API-first pattern.

### Key Findings:

1. **Most client components already use the API-first pattern** - The majority of the codebase correctly accesses data through API endpoints.
2. **Two critical contexts were found using direct entity access** - We identified and fixed UserContext.js (ENG-56) 
3. **Hook library needs migration** - Several hooks in the `/lib/airtable/hooks/` directory still use direct entity access.

### Recommendations:

1. **Phase 1: Migrate Remaining Core Hooks** - Refactor the hooks in `/lib/airtable/hooks/` to use API endpoints instead of direct entity access
2. **Phase 2: Add Linting Rules** - Implement linting rules to prevent future direct entity imports
3. **Phase 3: Create Comprehensive Documentation** - Document all API endpoints and their usage patterns

## Detailed Inventory

### 1. Completed Migrations

| File | Import | API Alternative | Status |
| ---- | ------ | --------------- | ------ |
| `/contexts/UserContext.js` | `import usersModule from "@/lib/airtable/entities/users"` | `/api/user/profile-v3` and `/api/applications/mine` | ✅ Fixed |
| `/lib/airtable/hooks/useContact.js` | `useMyContactByEmail` hook | `/api/contacts/me` | ✅ Fixed |

### 2. Required Hook Migrations

| File | Import | API Alternative | Priority |
| ---- | ------ | --------------- | -------- |
| `/lib/airtable/hooks/useContact.js` | `import { users } from '../entities'` | `/api/contacts/me` | High |
| `/lib/airtable/hooks/useMyContact` and `useContactByAuth0Id` | Direct Airtable access | `/api/contacts/me` or `/api/user/lookup` | High |
| `/lib/airtable/hooks/useEducation.js` | `import { education } from '../entities'` | `/api/education/mine` and `/api/education/[educationId]` | High |
| `/lib/airtable/hooks/useEducationRecords.js` | `import { education, institutions } from '../entities'` | `/api/education/mine` and `/api/institutions` | Medium |
| `/lib/airtable/hooks/useApplications.js` | `import { applications } from '../entities'` | `/api/applications/mine` and `/api/applications/create` | Medium |
| `/lib/airtable/hooks/useTeams.js` | `import { teams } from '../entities'` | `/api/teams/[teamId]` and related endpoints | Medium |
| `/lib/airtable/hooks/usePrograms.js` | `import { programs } from '../entities'` | `/api/programs/details-v2` | Medium |
| `/lib/airtable/hooks/useCohorts.js` | `import { cohorts } from '../entities'` | `/api/cohorts/[cohortId]` and `/api/cohorts/public` | Medium |
| `/lib/airtable/hooks/useEvents.js` | `import { events } from '../entities'` | `/api/events/upcoming-v2` | Low |
| `/lib/airtable/hooks/useResources.js` | `import { resources } from '../entities'` | `/api/resources/available-v2` | Low |
| `/lib/airtable/hooks/usePoints.js` | `import { points } from '../entities'` | `/api/points/user-summary-v2` | Low |
| `/lib/airtable/hooks/useSubmissions.js` | `import { submissions } from '../entities'` | `/api/submissions/team-v2` | Low |

### 3. API Gaps

The following API endpoints need to be created or enhanced:

1. **User Lookup by Multiple Identifiers** - `/api/user/lookup` endpoint to replace direct entity access for user lookup operations
2. **Education Records** - Enhanced endpoints for education-related operations
3. **Team Operations** - Comprehensive team management endpoints 

## Migration Strategy

### Prioritization

1. **High Priority**:
   - User/contact-related hooks (useContact.js)
   - Education-related hooks (useEducation.js, useEducationRecords.js)

2. **Medium Priority**:
   - Program/cohort-related hooks (usePrograms.js, useCohorts.js) 
   - Team-related hooks (useTeams.js)
   - Application-related hooks (useApplications.js)

3. **Low Priority**:
   - Supplementary data hooks (useEvents.js, useResources.js)
   - Points and submissions (usePoints.js, useSubmissions.js)

### Implementation Approach

For each hook requiring migration:

1. Identify all its public exports and usages
2. Verify appropriate API endpoints exist 
3. Create new API endpoints if needed
4. Reimplement using the createDataHook factory
5. Update documentation
6. Test thoroughly

## Testing Methodology

For each migrated hook:

1. Test both success and error paths
2. Verify data consistency between old and new implementations
3. Test in both development and production environments
4. Verify proper API error handling

## Conclusion

This audit provides a comprehensive view of the required migration work. The largest concern is the hooks layer in `/lib/airtable/hooks/`, which needs to be systematically migrated to use API endpoints instead of direct entity access. The good news is that most client components are already using these hooks rather than directly importing entities, which simplifies our migration path.