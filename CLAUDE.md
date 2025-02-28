# xFoundry Dashboard Development Guide

## Build & Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Logo Files
Located in `/public/logos/`:
- `xFoundry Blue 900 (1).svg` - Full horizontal logo with text in blue
- `xFoundry Logo.svg` - Full horizontal logo with text in white
- `X Icon Blue.svg` - X icon only in blue
- `X Icon White.svg` - X icon only in white

## Code Style Guidelines
- **Imports**: Import React components first, followed by hooks, then utilities
- **Component Structure**: Use functional components with React hooks
- **Error Handling**: Use try/catch blocks with specific error messages in catch blocks
- **Naming Conventions**:
  - Files: PascalCase for components, camelCase for utilities
  - Variables/Functions: camelCase (e.g., getUserProfile)
  - React Components: PascalCase (e.g., ProfileCard)
- **State Management**: Use React hooks (useState, useEffect) for component state
- **API Calls**: Centralize in lib/ directory (airtable.js, auth0.js)
- **Documentation**: Include JSDoc comments for functions with @param and @returns

## Project Structure
- `components/`: Reusable UI components
- `lib/`: Utility functions and API integrations
- `pages/`: Next.js pages and API routes
- `styles/`: Global CSS styles