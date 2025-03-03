# Dashboard Architecture Overview

This document outlines the dashboard architecture after the recent cleanup and streamlining efforts.

## Primary Dashboard Components

1. **Main Entry Points**:
   - `/pages/dashboard.js` - Main dashboard entry point
   - `/pages/program-dashboard.js` - Program-specific dashboard view

2. **Core Components**:
   - `/components/DashboardShell.js` - Main container component that handles navigation and page routing
   - `/components/ProperDashboardLayout.js` - Layout structure for the dashboard
   - `/components/ProperDashboardSidebar.js` - Navigation sidebar
   - `/contexts/DashboardContext.js` - State management for dashboard data

3. **Content Pages**:
   - `/pages/dashboards/DashboardHome.js` - Home page content
   - `/pages/dashboards/ProgramDashboard.js` - Program dashboard content
   - `/pages/dashboards/ProfilePage.js` - User profile page

## Dashboard Navigation Flow

1. User accesses `/dashboard` or `/program-dashboard` URLs
2. Both pages render the `DashboardShell` component wrapped in `DashboardProvider`
3. `DashboardShell` determines which content to show based on the URL path
4. Navigation between pages is handled via client-side routing using shallow updates

## State Management

The dashboard uses React Context via `DashboardContext.js` to manage:
- User profile data
- Team information
- Program/cohort data
- Application status
- UI state (modals, loading states)

Data is fetched once when the dashboard loads and shared across all dashboard pages.

## Legacy Support

For backward compatibility, we've kept:
- `/pages/dashboard-shell.js` - Redirects to `/dashboard`

## Design System

The dashboard uses a custom UI component system located in `/components/ui/`, with key components:
- `sidebar.jsx` - Sidebar framework components
- Various UI components like buttons, cards, dialogs

## Future Development

The `/components/v2` directory contains prototype components for a future dashboard redesign, but these are not currently used in production.