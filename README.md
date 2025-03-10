# xFoundry Dashboard (HeroUI Implementation)

## Overview

xFoundry Dashboard is a comprehensive student management platform designed to connect students with educational opportunities. This application provides a centralized hub for students to manage their profiles, access resources, and track their academic progress.

This repository contains the new HeroUI implementation of the xFoundry Dashboard, which migrates the platform from shadcn/ui to HeroUI components.

### Key Features

- User authentication and profile management
- Dynamic dashboard with personalized information
- Team management and collaboration features
- Program and milestone tracking
- Activity and points tracking
- Educational resource access
- Institution-specific data integration

### Technologies Used

- Next.js (React framework)
- TypeScript
- HeroUI (Component Library)
- Auth0 (Authentication)
- Airtable (Data storage)
- React Query
- Vercel Blob (File storage)
- Vercel (Deployment)

## Setup Instructions

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/xfoundry-dashboard.git
   cd xfoundry-dashboard
   ```

2. Install dependencies:
   ```
   npm install
   ```

### Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

Copy the content from `.env.example` and fill in your own values:

```
# Airtable Configuration
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id
AIRTABLE_TEAMS_TABLE_ID=your_airtable_teams_table_id
AIRTABLE_MEMBERS_TABLE_ID=your_airtable_members_table_id
AIRTABLE_CONTACTS_TABLE_ID=your_airtable_contacts_table_id
AIRTABLE_SUBMISSIONS_TABLE_ID=your_airtable_submissions_table_id
AIRTABLE_MILESTONES_TABLE_ID=your_airtable_milestones_table_id
AIRTABLE_COHORTS_TABLE_ID=your_airtable_cohorts_table_id

# Vercel Blob Configuration
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# Auth0 Configuration
AUTH0_SECRET=your_auth0_secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-auth0-domain.auth0.com
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
```

Replace the placeholder values with your actual Auth0 and Airtable credentials.

### Running the Application

To run the application in development mode:

```
npm run dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

To build the application for production:

```
npm run build
npm start
```

## Architecture

### Next.js Frontend and API

The application uses Next.js for both the frontend and API routes. This allows for server-side rendering and API route handling within the same project.

- `pages/`: Contains all the React components for each route
- `pages/api/`: Houses the API routes for data fetching and manipulation
- `components/`: Reusable React components
- `config/`: Configuration files for theming and fonts
- `contexts/`: React context providers
- `layouts/`: Page layout components
- `lib/`: Utility functions and API integrations
- `types/`: TypeScript type definitions
- `styles/`: Global styles and Tailwind configuration

### Auth0 Authentication

Auth0 is integrated for secure user authentication. The authentication flow is handled in `pages/api/auth/[...auth0].ts`.

### Airtable Data Storage

Airtable is used as the primary data storage solution. The integration is managed through the API endpoints.

### HeroUI Components

This implementation uses HeroUI for all UI components, providing a modern and consistent design system. The migration from shadcn/ui to HeroUI is documented in `docs/COMPONENT_MAPPING.md`.

### Data Fetching with React Query

React Query is used for data fetching, caching, and state management. This provides optimized data loading and synchronization.

### Key Components

- `layouts/dashboard.tsx`: Provides the overall structure for dashboard pages
- `components/dashboard/navbar.tsx`: Navigation component with authentication-aware rendering
- `components/dashboard/sidebar.tsx`: Sidebar navigation with dynamic content
- `components/teams/`: Team management components
- `components/activity/`: Activity tracking components
- `components/auth/`: Authentication-related components

## Documentation

All project documentation is available in the `docs/` directory. Key documents include:

- [Migration Plan](docs/MIGRATION_PLAN.md): Overview of the migration strategy
- [Component Mapping](docs/COMPONENT_MAPPING.md): Mapping between original components and HeroUI equivalents
- [Implementation Guide](docs/IMPLEMENTATION_GUIDE.md): Detailed implementation instructions
- [Next Steps](docs/NEXT_STEPS.md): Ongoing development tasks and future improvements

## Project Structure

```
/
├── components/       # UI components organized by feature
├── config/           # Theme and fonts configuration
├── contexts/         # React context providers
├── docs/             # Project documentation
├── layouts/          # Page layout components
├── lib/              # Utility functions and API clients
├── pages/            # Next.js pages and API routes
├── public/           # Static assets
├── styles/           # Global styles and Tailwind
├── types/            # TypeScript types and interfaces
└── archive/          # Original app code (reference only, not used in build)
```

## Additional Notes

### Authentication Flow

1. User initiates login through the UI
2. Auth0 handles the authentication process
3. On successful authentication, the user is redirected to the callback page
4. The callback page completes the authentication process and redirects to the dashboard

### Data Management

- Data fetching is optimized with React Query for caching and automatic revalidation
- TypeScript interfaces ensure type safety throughout the application
- API interactions are centralized in custom hooks for consistency
- File uploads managed through Vercel Blob for reliable and scalable storage
- Airtable integration provides flexible and structured data storage

### Development Approach

- Component-based architecture for reusability and maintainability
- Strict TypeScript for type safety
- Consistent error handling and loading states
- Mobile-responsive design
- Accessibility considerations in all UI components