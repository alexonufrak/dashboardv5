# xFoundry Dashboard Migration Plan: Transitioning to HeroUI

This document outlines the comprehensive plan for migrating the existing xFoundry Dashboard from its current implementation (using shadcn/ui components) to the HeroUI component library. This migration will enhance the UI/UX while preserving all existing functionality.

## Table of Contents

1. [Core Functionality Preservation](#1-core-functionality-preservation)
2. [State Management & Data Flow](#2-state-management--data-flow)
3. [Authentication System](#3-authentication-system)
4. [Component Migration Map](#4-component-migration-map)
5. [Routing Strategy](#5-routing-strategy)
6. [Implementation Phases](#6-implementation-phases)
7. [Testing Requirements](#7-testing-requirements)
8. [Fallback Strategy](#8-fallback-strategy)

## 1. Core Functionality Preservation

### Essential Features to Maintain:

- **Dashboard Home**: Overview of all programs and participation
- **Program Dashboards**: Program-specific content with milestones and teams
- **Team Management**: Creating, editing, and joining teams
- **Profile Management**: User profile viewing and editing
- **Milestone Tracking**: Progress tracking and submission handling
- **Responsive Design**: Complete mobile and desktop compatibility
- **Notifications & Alerts**: User feedback system

### Implementation Approach:

For each feature, we will:
1. Document current component dependencies and data requirements
2. Identify HeroUI equivalent components and their prop structures
3. Implement feature using HeroUI components while preserving business logic
4. Test feature for parity with existing implementation

## 2. State Management & Data Flow

### Current Implementation:

- React Query for API data fetching and caching
- Context API for shared state (DashboardContext)
- Custom hooks for data fetching (useDataFetching.js)
- API integration with Airtable (airtable.js)

### Migration Strategy:

1. **Preserve React Query Integration**:
   - Keep all query hooks intact
   - Update component references to maintain data flow
   - Preserve caching and invalidation logic

2. **Context API Transition**:
   - Port DashboardContext with minimal changes
   - Ensure provider wraps appropriate components in new structure
   - Update consumer components to use the same context hooks

3. **API Integration**:
   - Maintain the same API endpoints and handlers
   - Keep error handling patterns consistent
   - Preserve loading state management

## 3. Authentication System

### Current Implementation:

- Auth0 integration via @auth0/nextjs-auth0
- Protected routes handled by middleware
- User session management
- Profile data synchronization

### Migration Approach:

1. **Auth0 Provider Setup**:
   - Set up Auth0 provider in new application structure
   - Maintain session verification middleware
   - Preserve login/logout flow and callbacks

2. **Protected Routes**:
   - Ensure all new routes have the same protection levels
   - Maintain consistent redirect behavior
   - Preserve user role-based access control

3. **Session Management**:
   - Keep token handling and renewal logic
   - Maintain the same session expiration behavior
   - Preserve user metadata synchronization

## 4. Component Migration Map

### Layout Components:

| Current Component | HeroUI Replacement | Notes |
|-------------------|---------------------|-------|
| DashboardLayout.js | layouts/dashboard.tsx | Main dashboard container |
| app-sidebar.jsx | components/dashboard/sidebar.tsx | Navigation sidebar |
| site-header.jsx | components/dashboard/navbar.tsx | Top navigation bar |
| ProperDashboardLayout.js | layouts/dashboard.tsx (internal) | Content layout |

### Page Components:

| Current Page | HeroUI Replacement | Notes |
|--------------|---------------------|-------|
| dashboard-new.js | pages/dashboard/index.tsx | Main dashboard |
| program-new/[programId] | pages/program/[programId]/index.tsx | Program dashboard |
| profile.js | pages/profile/index.tsx | User profile |

### UI Components:

| Current Component Type | HeroUI Replacement | Notes |
|------------------------|---------------------|-------|
| Button (shadcn/ui) | @heroui/button | Direct replacement |
| Card (shadcn/ui) | @heroui/react Card | Direct replacement |
| Dialog (shadcn/ui) | @heroui/react Modal | API differs, needs adapter |
| Tabs (shadcn/ui) | @heroui/react Tabs | Similar API |
| Form components | @heroui/input, @heroui/select, etc. | Need individual mapping |

### Custom Components:

For each custom component, we will:
1. Analyze functionality and dependencies
2. Create HeroUI equivalent using appropriate components
3. Preserve all event handlers and prop interfaces
4. Maintain the same state management patterns

## 5. Routing Strategy

### Current Structure:

- Next.js Pages Router
- Centralized routing utilities
- Dynamic routes for programs and features
- Route protection via middleware

### Migration Approach:

1. **Route Parity**:
   - Maintain the same URL patterns where possible
   - Create equivalent routes in the new structure
   - Set up redirects for changed routes

2. **Navigation Utilities**:
   - Preserve routing constants and helper functions
   - Update any route references in components
   - Maintain navigation behavior consistency

3. **Dynamic Routes**:
   - Implement the same parameter handling
   - Preserve query parameter usage
   - Maintain route-based state management

## 6. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Set up HeroUI project structure
- Configure global theme and styling
- Implement base layout components
- Set up authentication system

### Phase 2: Core Components (Week 3-4)
- Implement sidebar and navigation
- Create dashboard shell
- Migrate dashboard home page
- Implement profile components

### Phase 3: Program Features (Week 5-6)
- Migrate program dashboard
- Implement milestone tracking
- Migrate team management
- Set up activity tracking

### Phase 4: Integration & Testing (Week 7-8)
- Connect all components to data sources
- Implement complete user flows
- Resolve any cross-component issues
- Perform comprehensive testing

### Phase 5: Finalization & Launch (Week 9)
- Performance optimization
- Final bug fixes
- User documentation
- Production deployment

## 7. Testing Requirements

### Test Categories:

1. **Component Tests**:
   - Visual consistency with design
   - Prop interface conformance
   - Event handling verification

2. **Integration Tests**:
   - Data flow between components
   - Context state management
   - API integration

3. **User Flow Tests**:
   - Complete user journeys
   - Error handling and recovery
   - Edge case handling

4. **Compatibility Tests**:
   - Browser compatibility
   - Device responsiveness
   - Accessibility compliance

### Test Approach:

- Create test cases for all core features
- Develop comparison tests between old and new implementations
- Set up automated testing where possible
- Conduct manual testing for visual and UX elements

## 8. Fallback Strategy

In case of critical issues during migration:

1. **Component Fallbacks**:
   - Ability to swap HeroUI components with original components
   - Adapter layer to handle prop differences

2. **Feature Flags**:
   - System to toggle between old and new implementations
   - Gradual feature rollout capability

3. **Versioned Routes**:
   - Support for both old and new routes simultaneously
   - Path-based version selection

4. **Rollback Plan**:
   - Complete reversion process documented
   - Data integrity preservation during rollback

---

## Progress Tracking

We will maintain this document with current progress and learnings throughout the migration process. As we complete each phase, we'll update this document with:

- Completed components and features
- Challenges encountered and solutions
- Improvements discovered during implementation
- Updated timelines and priorities

## Migration Status

**Current Phase**: Integration & Testing (Phase 4)

**Completed Items**:
- Basic project structure created
- Dashboard layout component implemented
- Sidebar component implemented with dynamic program links
- Navbar component implemented with user profile menu
- Dashboard page implemented with real data integration
- Program detail page implemented with milestone tracking
- Authentication system integrated with Auth0
- TypeScript interfaces for data models defined
- Context API setup for central state management
- API endpoints implemented for data fetching
- React Query integrated for data fetching
- Profile management page with editing functionality
- Team creation workflow implemented
- Team management pages (list, detail, etc.)
- Team member invitation interface
- Milestone submission system
  - Milestone detail page with requirements and resources
  - Submission form with file upload capabilities
  - Submission history with version tracking
  - Feedback display and management
  - Draft saving and form validation

**In Progress**:
- Activity tracking features
- User notification system
- Performance optimization
- Accessibility enhancements
- Cross-browser testing
- Responsive design refinements