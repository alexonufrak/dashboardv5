# API Endpoints Registry

This document provides a comprehensive list of all API endpoints available in the application, their purpose, parameters, and usage examples. This registry supports the API-first access pattern migration.

## Core API Endpoint Categories

### User/Profile Endpoints
- `/api/contacts/me` - Current user contact information with email-first lookup
- `/api/user/profile-v3` - Complete user profile with merged contact and education data
- `/api/user/lookup` - Flexible user lookup by email, Auth0 ID, or contact ID
- `/api/education/mine` - Current user education information
- `/api/user/check-email-v2` - Email existence check

### Teams Endpoints
- `/api/teams` - List user's teams or get teams by ID
- `/api/teams/[teamId]` - Get or update a specific team
- `/api/teams/create-v2` - Create a new team
- `/api/teams/[teamId]/invite` - Send team invitation
- `/api/teams/[teamId]/members` - Get team members
- `/api/teams/joinable` - Get teams open for joining

### Programs and Cohorts Endpoints
- `/api/programs/details-v2` - Get program details
- `/api/cohorts/[cohortId]` - Get cohort details
- `/api/cohorts/public` - Get publicly available cohorts

### Applications and Participation Endpoints
- `/api/applications/mine` - Get user's applications
- `/api/applications/create` - Submit new application
- `/api/applications/check` - Check application status
- `/api/participation/mine` - Get user's participation records
- `/api/participation/leave-v2` - Leave a program/cohort

### Submissions Endpoints
- `/api/submissions/team-v2` - Get team submissions
- `/api/teams/[teamId]/submissions` - Get or create team submissions

### Points and Rewards Endpoints
- `/api/points/user-summary-v2` - Get user points summary
- `/api/points/transactions` - Get point transactions
- `/api/rewards/available-v2` - Get available rewards
- `/api/rewards/claim-v2` - Claim a reward

### Events and Resources Endpoints
- `/api/events/upcoming-v2` - Get upcoming events
- `/api/resources/available-v2` - Get available resources

## Detailed API Documentation

### User/Profile Endpoints

#### Get Current User Contact

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

#### Get Complete User Profile

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

**Endpoint:** `PATCH /api/user/profile-v3` or `POST /api/user/profile-v3` with `_method=PATCH`

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
  "major": "recXXXXXXXXXXXX",
  "_method": "PATCH" // When using POST method
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

#### User Lookup

**Endpoint:** `GET /api/user/lookup`

**Purpose:** Look up a user by email, Auth0 ID, or contact ID.

**Authentication:** Required

**Parameters:**
* `email` (optional, query): User's email address
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

### Education Endpoints

#### Get User's Education Record

**Endpoint:** `GET /api/education/mine`

**Purpose:** Retrieves educational records for the authenticated user.

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

**Example Usage with React Query:**

```javascript
export const useUpdateEducation = createActionHook({
  actionKey: 'updateEducation',
  endpoint: '/api/education/mine',
  method: 'PATCH',
  successMessage: 'Education information updated successfully',
  errorMessage: 'Failed to update education information',
  invalidateKeys: ['education', 'profile']
});
```

### Teams Endpoints

#### Get Teams

**Endpoint:** `GET /api/teams`

**Purpose:** Retrieves the current user's teams or specific teams by ID.

**Authentication:** Required

**Parameters:**
* `ids` (optional, query): Comma-separated list of team IDs to retrieve

**Response Format:**
```json
{
  "teams": [
    {
      "id": "recXXXXXXXXXXXX",
      "name": "Team Name",
      "description": "Team description",
      "members": ["recXXXXXXXXXXXX"],
      "memberCount": 3,
      "cohorts": ["recXXXXXXXXXXXX"],
      "institution": "recXXXXXXXXXXXX",
      "institutionName": "Example University",
      "joinable": true,
      "createdBy": "recXXXXXXXXXXXX"
    }
  ],
  "_meta": {
    "timestamp": "2025-04-02T12:34:56.789Z",
    "count": 1,
    "duration": 123
  }
}
```

**Error Responses:**
* 401: User not authenticated
* 500: Server error

**Example Usage with React Query:**

```javascript
export const useTeams = createDataHook({
  queryKey: ['teams'],
  endpoint: '/api/teams',
  staleTime: 5 * 60 * 1000, // 5 minutes
  errorMessage: 'Failed to load your teams'
});
```

#### Get Team Details

**Endpoint:** `GET /api/teams/[teamId]`

**Purpose:** Retrieves details for a specific team.

**Authentication:** Required

**Parameters:**
* `teamId` (path): ID of the team to retrieve

**Response Format:**
```json
{
  "team": {
    "id": "recXXXXXXXXXXXX",
    "name": "Team Name",
    "description": "Team description",
    "members": ["recXXXXXXXXXXXX"],
    "memberCount": 3,
    "cohorts": ["recXXXXXXXXXXXX"],
    "institution": "recXXXXXXXXXXXX",
    "institutionName": "Example University",
    "joinable": true,
    "createdBy": "recXXXXXXXXXXXX",
    "membersDetails": [{
      "id": "recXXXXXXXXXXXX",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Member"
    }]
  },
  "_meta": {
    "timestamp": "2025-04-02T12:34:56.789Z",
    "duration": 123
  }
}
```

**Error Responses:**
* 401: User not authenticated
* 404: Team not found
* 500: Server error

**Update Team Details**

**Endpoint:** `PATCH /api/teams/[teamId]`

**Purpose:** Update team information.

**Authentication:** Required (with team membership)

**Request Body:**
```json
{
  "name": "Updated Team Name",
  "description": "Updated team description",
  "joinable": true,
  "headerImage": { "url": "https://..." } // Optional
}
```

**Response Format:**
```json
{
  "team": {
    "id": "recXXXXXXXXXXXX",
    "name": "Updated Team Name",
    "description": "Updated team description",
    "joinable": true,
    "updated": true
  },
  "success": true
}
```

**Error Responses:**
* 401: User not authenticated
* 403: User not authorized to update team
* 404: Team not found
* 500: Server error

#### Create Team

**Endpoint:** `POST /api/teams/create-v2`

**Purpose:** Create a new team and join the creator to it.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "New Team Name",
  "description": "Team description",
  "joinable": true,
  "cohortId": "recXXXXXXXXXXXX", // Optional
  "fileInfo": { // Optional, for team header image
    "url": "https://...",
    "filename": "header.jpg",
    "contentType": "image/jpeg",
    "size": 123456
  }
}
```

**Response Format:**
```json
{
  "success": true,
  "team": {
    "id": "recXXXXXXXXXXXX",
    "name": "New Team Name",
    "description": "Team description",
    "joinable": true,
    "members": ["recXXXXXXXXXXXX"],
    "cohorts": ["recXXXXXXXXXXXX"]
  },
  "participation": {
    "id": "recXXXXXXXXXXXX",
    "status": "Active",
    "teamId": "recXXXXXXXXXXXX",
    "contactId": "recXXXXXXXXXXXX",
    "cohortId": "recXXXXXXXXXXXX"
  }
}
```

**Error Responses:**
* 400: Missing required fields
* 401: User not authenticated
* 500: Server error

**Example Usage with React Query:**

```javascript
export function useCreateTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ teamData, cohortId }) => {
      const response = await fetch('/api/teams/create-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...teamData, cohortId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create team');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    }
  });
}
```

#### Get Joinable Teams

**Endpoint:** `GET /api/teams/joinable`

**Purpose:** Get teams that are open for users to join.

**Authentication:** Required

**Parameters:**
* `institutionId` (query): Filter teams by institution
* `cohortId` (query): Filter teams by cohort

**Response Format:**
```json
{
  "teams": [
    {
      "id": "recXXXXXXXXXXXX",
      "name": "Team Name",
      "description": "Team description",
      "members": ["recXXXXXXXXXXXX"],
      "memberCount": 3,
      "institution": "recXXXXXXXXXXXX",
      "institutionName": "Example University",
      "joinable": true
    }
  ],
  "_meta": {
    "timestamp": "2025-04-02T12:34:56.789Z",
    "count": 1,
    "duration": 123
  }
}
```

**Error Responses:**
* 401: User not authenticated
* 500: Server error

### Application Endpoints

#### Get User's Applications

**Endpoint:** `GET /api/applications/mine`

**Purpose:** Retrieves the current user's program applications.

**Authentication:** Required

**Parameters:**
* `cohortId` (optional, query): Filter by cohort ID

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
      "hasTranscript": false,
      "createdAt": "2023-04-02T12:34:56.789Z"
    }
  ]
}
```

**Error Responses:**
* 401: User not authenticated
* 404: User profile not found
* 500: Server error

**Example Usage with React Query:**

```javascript
export const useUserApplications = createDataHook({
  queryKey: ['applications', 'mine'],
  endpoint: '/api/applications/mine',
  staleTime: 5 * 60 * 1000, // 5 minutes
  errorMessage: 'Failed to load your applications'
});
```

#### Create Application

**Endpoint:** `POST /api/applications/create`

**Purpose:** Submit a new application for a program/cohort.

**Authentication:** Required

**Request Body:**
```json
{
  "cohortId": "recXXXXXXXXXXXX", // Required
  "teamId": "recXXXXXXXXXXXX", // Optional, for team applications
  "participationType": "Individual", // or "Team"
  "applicationType": "standard", // or "xtrapreneurs", "joinTeam"
  "reason": "String explanation", // For xtrapreneurs applications
  "commitment": "Full-time", // For xtrapreneurs applications
  "teamToJoin": "recXXXXXXXXXXXX", // For team join requests
  "joinTeamMessage": "I'd like to join" // For team join requests
}
```

**Response Format:**
```json
{
  "id": "recXXXXXXXXXXXX",
  "status": "Submitted",
  "contactId": "recXXXXXXXXXXXX",
  "cohortId": "recXXXXXXXXXXXX",
  "teamId": "recXXXXXXXXXXXX",
  "createdAt": "2023-04-02T12:34:56.789Z",
  "participation": {} // Optional, if direct join
}
```

**Error Responses:**
* 400: Missing required fields
* 401: User not authenticated
* 404: User profile not found
* 500: Server error with detailed message

### Participation Endpoints

#### Get User's Participation Records

**Endpoint:** `GET /api/participation/mine`

**Purpose:** Retrieves the current user's program participation records.

**Authentication:** Required

**Parameters:** None

**Response Format:**
```json
{
  "participation": [
    {
      "id": "recXXXXXXXXXXXX",
      "Status": "Active",
      "Contact": ["recXXXXXXXXXXXX"],
      "Team": ["recXXXXXXXXXXXX"],
      "teamName": "Team Name",
      "Cohort": ["recXXXXXXXXXXXX"],
      "cohortName": "Spring 2024",
      "program": "Program Name",
      "role": "Member",
      "startDate": "2023-04-02"
    }
  ]
}
```

**Error Responses:**
* 401: User not authenticated
* 404: User profile not found
* 500: Server error

**Example Usage with React Query:**

```javascript
export const useParticipation = createDataHook({
  queryKey: ['participation', 'mine'],
  endpoint: '/api/participation/mine',
  staleTime: 5 * 60 * 1000, // 5 minutes
  errorMessage: 'Failed to load your program participation'
});
```

#### Leave Program

**Endpoint:** `POST /api/participation/leave-v2`

**Purpose:** Leave a program the user is participating in.

**Authentication:** Required

**Request Body:**
```json
{
  "participationId": "recXXXXXXXXXXXX", // Required
  "reason": "Optional reason for leaving"
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Successfully left program",
  "participationId": "recXXXXXXXXXXXX",
  "status": "Inactive"
}
```

**Error Responses:**
* 400: Missing participation ID
* 401: User not authenticated
* 403: Not authorized (not the owner)
* 404: Participation record not found
* 500: Server error

### Submissions Endpoints

#### Get Team Submissions

**Endpoint:** `GET /api/submissions/team-v2`

**Purpose:** Retrieves submissions for a specific team.

**Authentication:** Required (with team membership)

**Parameters:**
* `teamId` (query): ID of the team
* `milestoneId` (optional, query): Filter by milestone ID

**Response Format:**
```json
{
  "submissions": [
    {
      "id": "recXXXXXXXXXXXX",
      "teamId": "recXXXXXXXXXXXX",
      "milestoneId": "recXXXXXXXXXXXX",
      "milestoneTitle": "Milestone Title",
      "status": "Submitted",
      "submittedBy": "recXXXXXXXXXXXX",
      "submitterName": "John Doe",
      "fileUrls": ["https://..."],
      "link": "https://...",
      "comments": "Submission comments",
      "createdAt": "2023-04-02T12:34:56.789Z"
    }
  ],
  "success": true,
  "_meta": {
    "timestamp": "2023-04-02T12:34:56.789Z",
    "count": 1,
    "duration": 123
  }
}
```

**Error Responses:**
* 400: Team ID is required
* 401: User not authenticated
* 403: User not authorized to view submissions
* 500: Server error

**Example Usage with React Query:**

```javascript
export function useTeamSubmissions(teamId, milestoneId) {
  return useQuery({
    queryKey: ['submissions', teamId, milestoneId],
    queryFn: async () => {
      if (!teamId) return { submissions: [] };
      
      const url = milestoneId 
        ? `/api/submissions/team-v2?teamId=${teamId}&milestoneId=${milestoneId}`
        : `/api/submissions/team-v2?teamId=${teamId}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch submissions: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}
```

#### Create Submission

**Endpoint:** `POST /api/teams/submissions`

**Purpose:** Create a new milestone submission.

**Authentication:** Required (with team membership)

**Request Body:**
```json
{
  "teamId": "recXXXXXXXXXXXX", // Required
  "milestoneId": "recXXXXXXXXXXXX", // Required
  "fileUrls": ["https://..."], // Optional
  "link": "https://...", // Optional
  "comments": "Submission comments" // Optional
}
```

**Response Format:**
```json
{
  "id": "recXXXXXXXXXXXX",
  "teamId": "recXXXXXXXXXXXX",
  "milestoneId": "recXXXXXXXXXXXX",
  "status": "Submitted",
  "submittedBy": "recXXXXXXXXXXXX",
  "fileUrls": ["https://..."],
  "link": "https://...",
  "comments": "Submission comments",
  "createdAt": "2023-04-02T12:34:56.789Z",
  "success": true
}
```

**Error Responses:**
* 400: Missing required fields
* 401: User not authenticated
* 403: User not authorized to submit for this team
* 500: Server error

**Example Usage with React Query:**

```javascript
export function useCreateSubmission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ teamId, milestoneId, fileUrls, link, comments }) => {
      const response = await fetch('/api/teams/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          milestoneId,
          fileUrls: fileUrls || [],
          link: link || '',
          comments: comments || ''
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create submission');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      const { teamId, milestoneId } = variables;
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['submissions', teamId] });
      if (milestoneId) {
        queryClient.invalidateQueries({ 
          queryKey: ['submissions', teamId, milestoneId] 
        });
      }
    }
  });
}
```

## Common API Response Standards

### Standard Response Format

Most API endpoints follow a standardized response format:

```json
{
  "data": { ... },  // Actual response data, structure varies by endpoint
  "_meta": {        // Metadata about the response
    "timestamp": "2025-04-02T12:34:56.789Z",  // When response was generated
    "duration": 123,                          // Processing time in milliseconds
    "version": "v2",                          // API version
    "cached": false,                          // Whether response was from cache
    "count": 10                               // For list endpoints, item count
  }
}
```

### HTTP Status Codes

API endpoints use standard HTTP status codes:

* **200**: Success
* **201**: Resource created successfully
* **400**: Bad request (invalid input, missing required fields, etc.)
* **401**: Unauthorized (authentication required)
* **403**: Forbidden (authenticated but not authorized)
* **404**: Resource not found
* **422**: Validation error (input validation failed)
* **429**: Too many requests (rate limiting)
* **500**: Server error

### Authentication Standard

All authenticated endpoints:
1. Require an Auth0 session cookie
2. Accept Authorization header with Bearer token as fallback
3. Return 401 status code if authentication fails

## High-Risk Client Components

The following client components make direct API calls and should be carefully reviewed when modifying API endpoints:

1. **TeamCreateDialog.js**
   - Makes direct fetch calls to:
     - `/api/teams?ids=...` (lines 177-183)
     - `/api/teams/joinable?institutionId=...` (line 233)
     - `/api/applications/create` (line 403)
   - Has complex data reconciliation logic (lines 128-207)

2. **MilestoneSubmissionDialog.js**
   - Makes direct fetch calls to:
     - `/api/teams/submissions` (line 404)
     - `/api/teams/${teamId}/submissions?milestoneId=...` (line 474)
   - Includes custom cache invalidation logic

## API Hook Integration

When working with these API endpoints, we recommend using the following hook factories:

### createDataHook Factory

The `createDataHook` factory creates standardized React Query hooks for API endpoints:

```javascript
import { createDataHook } from '@/lib/utils/hook-factory';

export const useContact = createDataHook({
  queryKey: ['profile', 'current'],
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
  invalidateKeys: [['profile', 'current'], 'contact']
});
```

## Migration Progress

The following hooks have been successfully migrated to use the API-first pattern:

1. **Contact Hooks** ✅
   - `useContact` (formerly `useContactViaApi`) - Uses `/api/contacts/me` with email-first lookup
   - `useUpdateContact` (formerly `useUpdateContactViaApi`) - Uses PATCH to `/api/contacts/me`
   - `useMyContact` - Legacy hook updated to use `/api/contacts/me` instead of direct Airtable access
   - `useMyContactByEmail` - Legacy hook preserved for backward compatibility
   - Added `useCheckContact` and `useInvalidateContact` utility hooks

2. **Education Hooks** ✅
   - `useEducationViaApi` - Uses `/api/education/mine` with email-first lookup
   - `useUpdateEducationViaApi` - Uses PATCH to `/api/education/mine`
   - `useEducationByIdViaApi` - Uses `/api/education/[educationId]` for specific records
   - Added `useInvalidateEducation` utility hook
   - Legacy hooks updated to remove direct Airtable entity imports

3. **Next Migrations** (in progress)
   - `useEducationRecords.js` - Similar needs for API-first migration
   - `useApplications.js` - Needs migration to use `/api/applications/mine` endpoints