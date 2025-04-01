# Airtable Migration Guide

This document provides guidance on migrating from the old monolithic `airtable.js` module to the new domain-driven Airtable architecture.

## Why Migrate?

The new architecture offers several benefits:
- **Modularity**: Each domain has its own module, making the code easier to maintain
- **Field Resilience**: Better handling of missing fields and schema changes
- **Caching**: Efficient caching to reduce Airtable API calls
- **Error Handling**: Standardized error handling across all Airtable operations
- **React Query Integration**: Hooks for client-side state management and caching

## Migration Steps

1. Import from the new architecture instead of the old monolithic file
2. Use the appropriate entity functions or hooks for your use case
3. Replace direct field access with the normalized object structure
4. Use error handling patterns consistent with the new architecture

## Import Changes

### Before:
```javascript
import { 
  getUserById, 
  getTeamById, 
  createParticipationRecord 
} from '@/lib/airtable';
```

### After:
```javascript
// Server-side (API routes) - Import entities directly
import { 
  users, 
  teams, 
  participation 
} from '@/lib/airtable/entities';

// OR specific functions
import { 
  getUserByAuth0Id, 
  getTeamById, 
  createParticipationRecord 
} from '@/lib/airtable/entities';

// Client-side (React components) - Import hooks
import { 
  useProfileData, 
  useTeam, 
  useParticipation 
} from '@/lib/airtable/hooks';
```

## Field Access Changes

### Before:
```javascript
// Direct field access that can break when schema changes
const userName = user.fields['Name'];
const institution = user.fields['Institution'][0];
const institutionName = user.fields['Name (from Institution)'][0];
```

### After:
```javascript
// Normalized objects with safe field access
const userName = user.name;
const institutionId = user.institutionId;
const institutionName = user.institutionName;
```

## API Route Migration Examples

### Before:
```javascript
import { getUserById, updateUserProfile } from '@/lib/airtable';

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    const user = await getUserById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user profile
    if (req.method === 'PATCH') {
      const updatedUser = await updateUserProfile(id, req.body);
      return res.status(200).json(updatedUser);
    }
    
    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
```

### After:
```javascript
import { users } from '@/lib/airtable/entities';
import { auth0 } from '@/lib/auth0';

export default async function handler(req, res) {
  try {
    // Get Auth0 session and validate user is authenticated
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({
        error: 'Not authenticated'
      });
    }
    
    const { id } = req.query;
    const user = await users.getUserByAuth0Id(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user profile
    if (req.method === 'PATCH') {
      const updatedUser = await users.updateUserProfile(id, req.body);
      return res.status(200).json(updatedUser);
    }
    
    return res.status(200).json(user);
  } catch (error) {
    console.error('Error processing user profile request:', error);
    return res.status(500).json({
      error: 'An error occurred while processing the request',
      message: error.message,
      details: error.details || {}
    });
  }
}
```

## React Component Migration Examples

### Before:
```javascript
import { useState, useEffect } from 'react';
import { getTeamById, getTeamMembers } from '@/lib/airtable';

function TeamDetails({ teamId }) {
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        const teamData = await getTeamById(teamId);
        const teamMembers = await getTeamMembers(teamId);
        
        setTeam(teamData);
        setMembers(teamMembers);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (teamId) {
      fetchTeamData();
    }
  }, [teamId]);
  
  // Rest of component...
}
```

### After:
```javascript
import { useTeam, useTeamMembers } from '@/lib/airtable/hooks';

function TeamDetails({ teamId }) {
  const { 
    data: team, 
    isLoading: teamLoading, 
    error: teamError 
  } = useTeam(teamId);
  
  const { 
    data: members, 
    isLoading: membersLoading, 
    error: membersError 
  } = useTeamMembers(teamId);
  
  const isLoading = teamLoading || membersLoading;
  const error = teamError || membersError;
  
  // Rest of component with improved loading/error handling...
}
```

## Error Handling

The new architecture provides standardized error handling with detailed error information:

```javascript
try {
  const team = await teams.getTeamById(teamId);
  // Use team data...
} catch (error) {
  console.error('Error fetching team:', error);
  
  // Error object includes:
  // - message: Human-readable error message
  // - details: Additional context (like record IDs)
  // - originalError: The original error that was caught
  
  // Handle different error scenarios
  if (error.status === 404) {
    // Handle not found
  } else if (error.status === 429) {
    // Handle rate limiting
  } else {
    // Handle other errors
  }
}
```

## Field Reference Chart

This table maps old field access patterns to new normalized object properties:

| Entity    | Old Field Access                      | New Property Access        |
|-----------|--------------------------------------|----------------------------|
| User      | `fields['Name']`                     | `user.name`                |
| User      | `fields['Email']`                    | `user.email`               |
| User      | `fields['Auth0 ID']`                 | `user.auth0Id`             |
| User      | `fields['Institution'][0]`           | `user.institutionId`       |
| User      | `fields['Name (from Institution)'][0]` | `user.institutionName`   |
| Team      | `fields['Team Name']`                | `team.name`                |
| Team      | `fields['Team Members']`             | `team.memberIds`           |
| Program   | `fields['Name']`                     | `program.name`             |
| Program   | `fields['Institution']`              | `program.institutionId`    |
| Cohort    | `fields['Cohort Name']`              | `cohort.name`              |
| Cohort    | `fields['Initiative/Program']`       | `cohort.programId`         |
| Submission| `fields['Team Record ID']`           | `submission.teamId`        |
| Submission| `fields['Status']`                   | `submission.status`        |

## Transition Timeline

To minimize disruption, follow this timeline:
1. Update API routes to use the new entities
2. Update React components to use the new hooks
3. For complex components, create a parallel `.refactored.js` version and test thoroughly
4. Once tested, replace the original component with the refactored version
5. After all components have been migrated, remove the old `airtable.js` file