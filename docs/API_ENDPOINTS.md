# API Endpoints Registry

This document provides a comprehensive list of all API endpoints available in the application, their purpose, parameters, and usage examples. This registry supports the API-first access pattern migration.

## User/Profile Endpoints

### Get Current User Contact

**Endpoint:** `GET /api/contacts/me`

**Purpose:** Retrieves the current authenticated user's contact record using an email-first lookup strategy. This endpoint implements a sophisticated lookup hierarchy:
1. First tries to find the user by email (most reliable)
2. If email lookup fails, attempts to find via linked records (Teams→Members→Contacts, Applications→Contacts)
3. Only falls back to Auth0 ID lookup if all email methods fail

**Authentication:** Required

**Parameters:** None

**Response Format:**
```json
{
  "auth0Id": "auth0|XXXXXXXXXX",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "contactId": "recXXXXXXXXXXXX",
  "Headshot": [...],
  "onboardingStatus": "Applied",
  "Education": ["recXXXXXXXXXXXX"],
  "Participation": [...],
  "exists": true,
  "_meta": {
    "timestamp": "2025-04-02T12:34:56.789Z",
    "duration": 123
  }
}
```

**Error Responses:**
* 401: User not authenticated
* 500: Server error

**Caching:**
* Cache-Control: 'private, max-age=0, no-cache, no-store, must-revalidate'

**Example Usage with React Query:**

```javascript
export const useContact = createDataHook({
  queryKey: ['profile', 'current'],
  endpoint: '/api/contacts/me',
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  errorMessage: 'Failed to load your contact information',
  refetchOnFocus: true,
  retry: (failureCount, error) => {
    // Don't retry auth errors
    if (error?.status === 401) return false;
    
    // Retry network/timeout errors
    if (!error?.status || error.status >= 500) {
      return failureCount < 3;
    }
    
    // Default retry behavior
    return failureCount < 2;
  }
});
```

**Update Contact Information**

**Endpoint:** `PATCH /api/contacts/me`

**Purpose:** Updates the current user's contact information.

**Authentication:** Required

**Request Body:**
```json
{
  "contactId": "recXXXXXXXXXXXX", // Required
  "firstName": "John",
  "lastName": "Doe",
  "referralSource": "Website"
}
```

**Response Format:**
```json
{
  "contactId": "recXXXXXXXXXXXX",
  "firstName": "John",
  "lastName": "Doe",
  "updated": true,
  "_meta": {
    "timestamp": "2025-04-02T12:34:56.789Z",
    "duration": 123
  }
}
```

**Example Usage with React Query:**

```javascript
export const useUpdateContact = createActionHook({
  actionKey: 'updateContact',
  endpoint: '/api/contacts/me',
  method: 'PATCH',
  successMessage: 'Contact information updated successfully',
  errorMessage: 'Failed to update contact information',
  invalidateKeys: [['profile', 'current'], 'contact']
});
```

### Get Complete User Profile

**Endpoint:** `GET /api/user/profile-v3`

**Purpose:** Retrieves a complete user profile including contact information, education, participation records, and more.

**Authentication:** Required

**Parameters:**
* `minimal` (optional, query): If set to 'true', returns a minimal profile with essential data only.

**Response Format:**
```json
{
  "profile": {
    "auth0Id": "auth0|XXXXXXXXXX",
    "email": "user@example.com",
    "name": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "contactId": "recXXXXXXXXXXXX",
    "picture": "https://...",
    "headshot": "https://...",
    "onboardingStatus": "Applied",
    "education": {
      "educationId": "recXXXXXXXXXXXX",
      "institutionId": "recXXXXXXXXXXXX",
      "institutionName": "Example University",
      "degreeType": "Bachelors",
      "graduationYear": "2025",
      "major": "Computer Science"
    },
    "participations": [...],
    "teams": [...],
    "isProfileComplete": true,
    "hasActiveParticipation": true,
    "lastUpdated": "2025-04-02T12:34:56.789Z"
  },
  "_meta": {
    "timestamp": "2025-04-02T12:34:56.789Z",
    "duration": 123
  }
}
```

**Error Responses:**
* 401: User not authenticated
* 500: Server error (returns a basic profile with error metadata)

**Caching:**
* Cache-Control: 'no-store, private, no-cache, must-revalidate'

**Example Usage with React Query:**

```javascript
export const useUserProfile = createDataHook({
  queryKey: ['user', 'profile'],
  endpoint: '/api/user/profile-v3',
  staleTime: 5 * 60 * 1000, // 5 minutes
  errorMessage: 'Failed to fetch user profile'
});
```

**Update User Profile**

**Endpoint:** `PATCH /api/user/profile-v3`

**Purpose:** Updates both contact and education information in a single request.

**Authentication:** Required

**Request Body:**
```json
{
  "contactId": "recXXXXXXXXXXXX", // Required
  "firstName": "John",
  "lastName": "Doe",
  "referralSource": "Friend",
  "educationId": "recXXXXXXXXXXXX", // Optional
  "institutionId": "recXXXXXXXXXXXX",
  "degreeType": "Bachelors",
  "graduationYear": "2025",
  "graduationSemester": "Spring",
  "major": "recXXXXXXXXXXXX"
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "contactId": "recXXXXXXXXXXXX",
  "_meta": {
    "timestamp": "2025-04-02T12:34:56.789Z",
    "duration": 123
  }
}
```

### User Lookup

**Endpoint:** `GET /api/user/lookup`

**Purpose:** Look up a user by email, Auth0 ID, or contact ID.

**Authentication:** Required

**Parameters:**
* `email` (optional, query): User's email address
* `auth0Id` (optional, query): User's Auth0 ID
* `contactId` (optional, query): User's contact ID

**Response Format:**
```json
{
  "data": {
    "contactId": "recXXXXXXXXXXXX",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "auth0Id": "auth0|XXXXXXXXXX",
    "onboardingStatus": "Applied",
    ...
  },
  "found": true,
  "_meta": {
    "timestamp": "2025-04-02T12:34:56.789Z",
    "duration": 123
  }
}
```

**Error Responses:**
* 400: Missing identifier
* 401: User not authenticated 
* 404: User not found

**Caching:**
* Cache-Control: 'private, max-age=0, no-cache, no-store, must-revalidate'

**Example Usage with React Query:**

```javascript
export const useFindUserByEmail = (email) => {
  return useQuery({
    queryKey: ['user', 'lookup', 'email', email],
    queryFn: async () => {
      const response = await fetch(`/api/user/lookup?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to find user: ${response.status}`);
      }
      const data = await response.json();
      return data.data;
    },
    enabled: !!email
  });
};
```

**Advanced User Lookup**

**Endpoint:** `POST /api/user/lookup`

**Purpose:** Find a user by any combination of identifiers, with smart fallbacks.

**Authentication:** Required

**Request Body:**
```json
{
  "identifiers": {
    "email": "user@example.com",
    "auth0Id": "auth0|XXXXXXXXXX",
    "contactId": "recXXXXXXXXXXXX"
  }
}
```

**Response Format:** Same as GET endpoint

## Education Endpoints

### Get User's Education Record

**Endpoint:** `GET /api/education/mine`

**Purpose:** Retrieves the current user's education record.

**Authentication:** Required

**Parameters:** None

**Response Format:**
```json
{
  "education": {
    "id": "recXXXXXXXXXXXX",
    "contactId": "recXXXXXXXXXXXX",
    "institution": ["recXXXXXXXXXXXX"],
    "institutionName": "Example University",
    "degreeType": "Bachelors",
    "major": ["recXXXXXXXXXXXX"],
    "majorName": "Computer Science",
    "graduationYear": "2025",
    "graduationSemester": "Spring",
    "exists": true
  }
}
```

**Error Responses:**
* 401: User not authenticated
* 404: User profile not found
* 500: Internal server error

**Caching:** None specified

**Example Usage with React Query:**

```javascript
export const useEducation = createDataHook({
  queryKey: ['education', 'current'],
  endpoint: '/api/education/mine',
  staleTime: 5 * 60 * 1000, // 5 minutes
  errorMessage: 'Failed to load your education information'
});
```

**Update Education Record**

**Endpoint:** `PATCH /api/education/mine`

**Purpose:** Update the current user's education record.

**Authentication:** Required

**Request Body:**
```json
{
  "educationId": "recXXXXXXXXXXXX", // Optional, provided if updating existing record
  "institutionId": "recXXXXXXXXXXXX", // Required (or institutionName)
  "institutionName": "Example University", // Optional alternative to institutionId
  "degreeType": "Bachelors",
  "major": "recXXXXXXXXXXXX",
  "majorName": "Computer Science", // Optional alternative to major ID
  "graduationYear": "2025",
  "graduationSemester": "Spring"
}
```

**Response Format:**
```json
{
  "education": {
    "id": "recXXXXXXXXXXXX",
    "contactId": "recXXXXXXXXXXXX",
    "institution": ["recXXXXXXXXXXXX"],
    "institutionName": "Example University",
    "degreeType": "Bachelors",
    "major": ["recXXXXXXXXXXXX"], 
    "majorName": "Computer Science",
    "graduationYear": "2025",
    "graduationSemester": "Spring",
    "exists": true
  },
  "message": "Education information updated successfully"
}
```

## Application Endpoints

### Get User's Applications

**Endpoint:** `GET /api/applications/mine`

**Purpose:** Retrieves the current user's applications.

**Authentication:** Required

**Parameters:**
* `cohortId` (optional, query): Filter applications by cohort ID

**Response Format:**
```json
{
  "applications": [
    {
      "applicationId": "recXXXXXXXXXXXX",
      "Status": "Applied",
      "Cohort": ["recXXXXXXXXXXXX"],
      "cohortShortName": ["SpringX"],
      "initiative": "Program Name",
      "Institution": ["recXXXXXXXXXXXX"],
      "Major": ["recXXXXXXXXXXXX"],
      "hasResume": true,
      "hasTranscript": false
    }
  ]
}
```

**Error Responses:**
* 401: User not authenticated 
* 405: Method not allowed
* 500: Internal server error

**Caching:** None specified

**Example Usage with React Query:**

```javascript
export const useUserApplications = createDataHook({
  queryKey: ['applications', 'mine'],
  endpoint: '/api/applications/mine',
  staleTime: 5 * 60 * 1000, // 5 minutes
  errorMessage: 'Failed to load your applications'
});
```

## API Hook Integration

### createDataHook Factory

The `createDataHook` factory creates standardized React Query hooks for API endpoints:

```javascript
import { createDataHook } from '@/lib/utils/hook-factory';

export const useMyContactByEmail = createDataHook({
  queryKey: ['contact', 'current', 'email'],
  endpoint: '/api/contacts/me',
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  errorMessage: 'Failed to load your contact information',
  refetchOnFocus: true
});
```

### createActionHook Factory

The `createActionHook` factory creates hooks for mutation operations:

```javascript
import { createActionHook } from '@/lib/utils/hook-factory';

export const useUpdateContact = createActionHook({
  actionKey: 'updateContact',
  endpoint: '/api/contacts/me',
  method: 'PATCH',
  successMessage: 'Contact information updated successfully',
  errorMessage: 'Failed to update contact information',
  invalidateKeys: ['profile', 'contact']
});
```

## API Gap Analysis

Based on our API audit, the following gaps were identified:

1. **User Lookup API**
   - ✅ `/api/user/lookup` endpoint provides a consistent interface for user lookup
   - ✅ Supports multiple lookup methods (email, Auth0 ID, contactId)
   - ✅ Email-first lookup strategy implemented in `/api/contacts/me`

2. **Education API**
   - ✅ `/api/education/mine` provides basic education CRUD operations
   - ➖ Missing endpoint for managing multiple education records

3. **Profile/Contact API**
   - ✅ `/api/contacts/me` and `/api/user/profile-v3` provide good coverage
   - ➖ Consider consolidating to reduce duplication

4. **Caching Inconsistencies**
   - Different endpoints use different caching strategies
   - A standardized caching approach is needed (see ENG-54)

## Migration Progress

The following hooks have been successfully migrated to use the API-first pattern:

1. **Contact Hooks** ✅
   - `useContact` (formerly `useContactViaApi`) - Uses `/api/contacts/me` with email-first lookup
   - `useUpdateContact` (formerly `useUpdateContactViaApi`) - Uses PATCH to `/api/contacts/me`
   - `useMyContact` - Legacy hook updated to use `/api/contacts/me` instead of direct Airtable access
   - `useMyContactByEmail` - Legacy hook preserved for backward compatibility
   - Added `useCheckContact` and `useInvalidateContact` utility hooks

2. **Next Migrations** (in progress)
   - `useEducation.js` - Direct Airtable entity access needs to be replaced with `/api/education/mine` endpoints
   - `useEducationRecords.js` - Similar needs for API-first migration