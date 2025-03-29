# xFoundry Dashboard

## Overview

xFoundry Dashboard is a comprehensive student management platform designed to connect students with educational opportunities. This application provides a centralized hub for students to manage their profiles, access resources, and track their academic progress.

### Key Features

- User authentication and profile management
- Dynamic dashboard with personalized information
- Educational resource access
- Institution-specific data integration

### Technologies Used

- Next.js (React framework)
- Auth0 v4 (Authentication)
- Airtable (Data storage)
- Vercel (Deployment)
- Resend (Email delivery)
- React Email (Email templates)

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

```
# Auth0 v4 Configuration
AUTH0_SECRET=your_auth0_cookie_secret_key_at_least_32_chars
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
AUTH0_DOMAIN=your-tenant.auth0.com
APP_BASE_URL=http://localhost:3000

# Airtable Configuration
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id

# Email Configuration (Resend)
RESEND_API_KEY=your_resend_api_key
```

See `.env.local.sample` for a complete list of environment variables.

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
- `styles/`: Global styles and CSS modules

### Auth0 v4 Authentication

Auth0 v4 is integrated for secure user authentication. The authentication flow is handled through middleware in `middleware.js` and the Auth0 client in `lib/auth0.js`.

Key authentication routes:
- `/auth/login`: Initiates login flow
- `/auth/callback`: Handles authentication callback
- `/auth/logout`: Logs user out

### Airtable Data Storage

Airtable is used as the primary data storage solution. The integration is managed through `lib/airtable.js`.

### Email System

Resend and React Email are used for creating and delivering beautiful, responsive emails. See [EMAIL_SYSTEM.md](docs/EMAIL_SYSTEM.md) for detailed documentation on:

- Email template creation
- Sending emails from server-side code
- Using the email hook in client components
- Best practices for email design

### Key Components

- `Layout.js`: Provides the overall structure for all pages
- `Navbar.js`: Navigation component with authentication-aware rendering
- `DashboardHeader.js`: Displays user information on the dashboard
- `ProfileCard.js`: Shows and allows editing of user profile information

### API Standards

#### API Response Format

All API endpoints consistently use a wrapped response format:

```js
{
  resourceName: resourceData,  // e.g., team, submissions, profile
  meta: {} // Optional metadata
}
```

For example, team data is returned as:

```js
{
  team: {
    id: "team123",
    name: "Team Name",
    members: [...]
  }
}
```

#### Handling API Responses

Client code can use the adapter functions in `lib/utils.js` to handle API responses consistently:

```js
import { extractTeamData } from '@/lib/utils'

// Fetching data
const response = await fetch('/api/teams/123')
const data = await response.json()
const team = extractTeamData(data) // Works with both formats: data.team or direct data
```

## Additional Notes

### Authentication Flow

1. User initiates login through the UI
2. Auth0 handles the authentication process
3. On successful authentication, the user is redirected to the callback page
4. The callback page completes the authentication process and redirects to the dashboard

### Data Synchronization

- User profile data is fetched from Airtable on initial load
- Profile updates are sent to Airtable through the API routes
- Real-time synchronization is not implemented; data is fetched on page load or after updates

### Future Enhancements

- Implement real-time data synchronization
- Add more interactive features to the dashboard
- Integrate a messaging system for student-advisor communication
- Implement data analytics for tracking student progress
- Expand resource management capabilities