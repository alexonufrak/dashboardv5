# xFoundry Dashboard Development Guide

## Build & Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx next lint --fix` - Automatically fix linting issues
- `git add . && git commit -m "your commit message" && git push` - Commit and push any changes when requested. Do not coauthor claude code. Write detailed description.

## MCP Tools Configuration
- `fetch` - Use this MCP tool for making web requests to external APIs or websites
- `brave-search` - Use this MCP tool for performing web searches with Brave Search
- `playwright` - Use this MCP tool for browser automation and web interactions
- `airtable` - Use this MCP tool for Airtable database operations
- `linear` - Use this MCP tool for Linear project management operations

### Linear MCP Tool Usage Guide
The Linear MCP tool allows interaction with the Linear project management system. To use it effectively:

1. **Authentication**: Requires a Linear API token to be configured
2. **Available Commands**:
   - View issues: `Show me all my Linear issues`
   - Create issues: `Create a new issue titled 'Fix login bug' in the Frontend team`
   - Update status: `Change the status of issue FE-123 to 'In Progress'`
   - Assign issues: `Assign issue BE-456 to John Smith`
   - Add comments: `Add a comment to issue UI-789: 'This needs to be fixed by Friday'`
   - View projects and teams
   - Create projects and teams

3. **Features**:
   - Retrieve issues, projects, teams, and other data from Linear
   - Create and update issues
   - Change issue status
   - Assign issues to team members
   - Add comments
   - Create projects and teams

## Code Style Guidelines
- **Framework**: Next.js with React functional components and hooks
- **UI Library**: shadcn/ui components with Tailwind CSS
- **Imports**: React components first, hooks (including React Query), then utilities
- **Data Fetching**: Use React Query hooks from `@tanstack/react-query` for API calls
- **Component Creation**: Use `npx shadcn add [component]` for shadcn components
- **Formatting**: 
  - 2-space indentation, semicolons required
  - Use parentheses for multi-line JSX returns
- **Styling**: Tailwind CSS classes; avoid inline styles when possible
- **Error Handling**: Try/catch blocks with specific error messages and fallback UI
- **Naming Conventions**:
  - Files: PascalCase for components (e.g., ProfileCard.js), camelCase for utilities
  - Functions/Variables: camelCase (e.g., getUserProfile)
  - React Components: PascalCase with descriptive names
  - API endpoints: REST convention (nouns, not verbs)
- **State Management**: React hooks (useState, useEffect, useContext) and React Query
- **API Calls**: Centralize in lib/ directory (airtable.js, auth0.js, useDataFetching.js)
- **Airtable Queries**: Use dedicated ID fields with SEARCH formula for reliable filtering

## Project Structure
- `components/`: UI components (shadcn/ui in components/ui/)
- `lib/`: Utility functions and API integrations
- `pages/`: Next.js pages and API routes
- `contexts/`: React Context providers
- `public/`: Static assets
- `styles/`: Global CSS with Tailwind

## Auth0 v4 Implementation Guidelines

### Auth0 Correct Import Paths
- Client-side components: 
  - ✅ `import { useUser } from "@auth0/nextjs-auth0"`
  - ❌ NOT `import { useUser } from "@auth0/nextjs-auth0/client"` (fails in production)
- Server-side (Auth0 client): 
  - ✅ `import { Auth0Client } from "@auth0/nextjs-auth0/server"`
- Auth0Provider in _app.js: 
  - ✅ `import { Auth0Provider } from "@auth0/nextjs-auth0"`

### Auth0 Configuration
- Auth0 client is initialized in `lib/auth0.js` using `Auth0Client` from `@auth0/nextjs-auth0/server`
- Required environment variables: `AUTH0_SECRET`, `AUTH0_BASE_URL`, `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`
- Configuration includes session settings, authorization parameters, routes, and callbacks

### API Route Protection
API routes should be protected using the auth0 client directly from `lib/auth0.js`:

```javascript
import { auth0 } from "@/lib/auth0";

export default async function handler(req, res) {
  try {
    // Get Auth0 session and validate user is authenticated
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({
        error: 'Not authenticated'
      });
    }
    const { user } = session;
    
    // API handler logic
  } catch (error) {
    // Error handling
  }
}
```

### User Sessions
- Use `auth0.getSession()` to retrieve user sessions on the server
- Use the `useUser()` hook from `@auth0/nextjs-auth0` to access user data in client components
- For updating sessions, use `auth0.updateSession()`

### Login/Logout Flow
- For login: `<a href="/auth/login">Login</a>` (not `/api/auth/login`)
- For logout: `<a href="/auth/logout">Logout</a>` (not `/api/auth/logout`)
- Callback URL is now `/auth/callback` (not `/api/auth/callback`)

### Cookie Domain Configuration
Set cookie domain only in production to allow localhost in development:
```javascript
cookie: {
  domain: process.env.NODE_ENV === 'production' ? '.xfoundry.org' : undefined
}
```

### POST Method Override
For profile updates, use POST with a `_method` parameter to handle SameSite cookie issues:
```javascript
// API handler
if (req.method === 'POST' && req.body._method?.toUpperCase() === 'PATCH') {
  return handleUpdateRequest(req, res, user);
}
```

## Airtable Domain-Driven Design
The Airtable integration follows a domain-driven design pattern with:

- `lib/airtable/core/` - Core utilities (client, cache, throttle, errors)
- `lib/airtable/tables/` - Table definitions and schemas
- `lib/airtable/entities/` - Entity-specific operations (users, education, etc.)
- `lib/airtable/hooks/` - React Query hooks for frontend components