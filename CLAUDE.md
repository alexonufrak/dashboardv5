# xFoundry Dashboard Development Guide

## Build & Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx next lint --fix` - Automatically fix linting issues
- `git add . && git commit -m "your commit message" && git push` - Commit and push any changes when requested. Do not coauthor claude code. Write detailed description.

## MCP Tools Configuration
- `fetch-user` - Use this MCP tool for making web requests to external APIs or websites
- `brave-search-user` - Use this MCP tool for performing web searches with Brave Search

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