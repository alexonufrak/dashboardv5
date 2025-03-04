# xFoundry Dashboard Development Guide

## Build & Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Code Style Guidelines
- **Framework**: Next.js with React functional components and hooks
- **UI Library**: shadcn/ui components with Tailwind CSS
- **Imports**: React components first, then hooks, then utilities
- **Component Creation**: Use `npx shadcn add [component]` for shadcn components
- **Formatting**: 
  - 2-space indentation, semicolons required
  - Use parentheses for multi-line JSX returns
- **Styling**: Tailwind CSS and inline styles object pattern
- **Error Handling**: Try/catch blocks with specific error messages
- **Naming Conventions**:
  - Files: PascalCase for components (e.g., ProfileCard.js), camelCase for utilities
  - Functions/Variables: camelCase (e.g., getUserProfile)
  - React Components: PascalCase with descriptive names
- **State Management**: React hooks (useState, useEffect, useContext)
- **API Calls**: Centralize in lib/ directory (airtable.js, auth0.js)
- **Documentation**: JSDoc comments with @param and @returns

## Project Structure
- `components/`: Reusable UI components (shadcn/ui in components/ui/)
- `lib/`: Utility functions and API integrations
- `pages/`: Next.js pages and API routes
- `contexts/`: React Context providers
- `public/logos/`: Logo assets in various formats
- `styles/`: Global CSS styles with Tailwind