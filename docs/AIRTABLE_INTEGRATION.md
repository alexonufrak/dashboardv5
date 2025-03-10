# Airtable Integration

This document describes the Airtable integration used in the xFoundry Dashboard. The implementation provides a structured and consistent way to interact with Airtable as the application's data store.

## Overview

The Airtable integration consists of two main components:

1. **Airtable Client** (`airtableClient.ts`): Core client for Airtable API interactions
2. **API Endpoints**: Next.js API routes that use the client to fetch and update data

## Implementation Details

### Airtable Client

The Airtable client (`lib/airtableClient.ts`) provides a set of utility functions for interacting with Airtable:

- `initAirtable()`: Initializes the Airtable connection
- `getTable()`: Gets a reference to a specific table
- `findRecordById()`: Finds a record by ID
- `queryRecords()`: Queries records with a filter formula
- `createRecord()`: Creates a new record
- `updateRecord()`: Updates an existing record
- `deleteRecord()`: Deletes a record
- `formatAttachments()`: Formats attachment objects for Airtable

### Table Configuration

Tables are configured through environment variables, making it easy to change the underlying Airtable structure without code changes:

```javascript
export const TABLES = {
  TEAMS: process.env.AIRTABLE_TEAMS_TABLE_ID,
  MEMBERS: process.env.AIRTABLE_MEMBERS_TABLE_ID,
  CONTACTS: process.env.AIRTABLE_CONTACTS_TABLE_ID,
  SUBMISSIONS: process.env.AIRTABLE_SUBMISSIONS_TABLE_ID,
  MILESTONES: process.env.AIRTABLE_MILESTONES_TABLE_ID,
  COHORTS: process.env.AIRTABLE_COHORTS_TABLE_ID,
};
```

### Environment Variables

The following environment variables are required for the Airtable integration:

```
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id
AIRTABLE_TEAMS_TABLE_ID=your_airtable_teams_table_id
AIRTABLE_MEMBERS_TABLE_ID=your_airtable_members_table_id
AIRTABLE_CONTACTS_TABLE_ID=your_airtable_contacts_table_id
AIRTABLE_SUBMISSIONS_TABLE_ID=your_airtable_submissions_table_id
AIRTABLE_MILESTONES_TABLE_ID=your_airtable_milestones_table_id
AIRTABLE_COHORTS_TABLE_ID=your_airtable_cohorts_table_id
```

### Data Schema

The Airtable schema is documented in `AIRTABLE_SCHEMA.md`. The key tables used in the application are:

- **Teams**: Stores team information
- **Members**: Tracks team membership
- **Contacts**: User information and profiles
- **Submissions**: Milestone submissions
- **Milestones**: Milestone definitions
- **Cohorts**: Program cohorts and groupings

### API Implementation

API endpoints encapsulate Airtable operations and provide a clean interface for client components:

- Each endpoint follows RESTful conventions
- Operations are authenticated using Auth0
- Responses are formatted consistently for client consumption
- Error handling is standardized across endpoints

## Usage Examples

### Basic Record Fetching

```typescript
import { queryRecords, TABLES } from '@/lib/airtableClient';

// Fetch teams for a user
const teams = await queryRecords(
  TABLES.TEAMS,
  `FIND("${userId}", ARRAYJOIN({Members})) > 0`
);

// Format the response
return teams.map(team => ({
  id: team.id,
  name: team.Name,
  members: team.Members || [],
  // ... other fields
}));
```

### Creating Records

```typescript
import { createRecord, TABLES, formatAttachments } from '@/lib/airtableClient';

// Create a submission record
const submission = await createRecord(TABLES.SUBMISSIONS, {
  Team: [teamId],
  Milestone: [milestoneId],
  Comments: description,
  Member: contributorIds,
  Attachment: fileAttachments ? formatAttachments(fileAttachments) : undefined
});
```

### Updating Records

```typescript
import { updateRecord, TABLES } from '@/lib/airtableClient';

// Update team information
const updatedTeam = await updateRecord(TABLES.TEAMS, teamId, {
  Name: newName,
  Description: newDescription,
});
```

## Error Handling

The Airtable client includes consistent error handling to help with debugging and user feedback:

```typescript
try {
  const record = await findRecordById(tableName, recordId);
  return record;
} catch (error) {
  console.error(`Error fetching ${tableName} record ${recordId}:`, error);
  throw error;
}
```

## Integration with File Storage

The Airtable integration works seamlessly with Vercel Blob for file storage:

1. Files are uploaded to Vercel Blob
2. File URLs and metadata are stored in Airtable records
3. When records are retrieved, the file URLs are included in the response

See `FILE_STORAGE.md` for more details on the file storage implementation.