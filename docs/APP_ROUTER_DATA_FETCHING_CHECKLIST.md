# App Router Migration: Data Fetching Checklist

This document outlines the remaining pages and components that need to be migrated to use the new server component data fetching pattern. This checklist will help track progress and ensure consistent implementation across the application.

## Core Pages

- [x] Dashboard Homepage (`/app/dashboard/page.js`)
- [x] Profile Page (`/app/dashboard/profile/page.js`)
- [x] Programs Listing (`/app/dashboard/programs/page.js`)
- [x] Program Detail (`/app/dashboard/programs/[programId]/page.js`)
- [x] Teams Listing (`/app/dashboard/teams/page.js`)
- [x] Team Detail (`/app/dashboard/teams/[teamId]/page.js`)
- [x] Events Listing (`/app/dashboard/events/page.js`)
- [x] Event Detail (`/app/dashboard/events/[eventId]/page.js`)
- [x] Event Attendance (`/app/dashboard/events/attendance/[eventId]/page.js`)
- [x] Event QR Code (`/app/dashboard/events/attendance/[eventId]/qr/page.js`)

## Dashboard Layout and Navigation

- [x] App Router Sidebar Implementation (`/components/layout/app-sidebar-server.jsx`)
- [x] App Router Navigation Components (nav-main.jsx, nav-projects.jsx, etc.)
- [x] Dashboard Layout Integration (`/app/dashboard/layout.js`)
- [x] User Profile Integration in Sidebar

## Dynamic Metadata

Add `generateMetadata` to key pages for SEO:

- [x] Profile Page
- [x] Program Detail Page
- [x] Team Detail Page
- [x] Event Detail Page
- [x] Event Attendance Page
- [x] Event QR Code Page

## Server Actions (Mutations)

- [x] Profile Update (`/app/actions/profile/update-profile.js`)
- [ ] Team Creation (`/app/actions/teams/create-team.js`)
- [x] Team Joining (`/app/actions/teams/join-team.js`)
- [ ] Team Leaving (`/app/actions/teams/leave-team.js`)
- [x] Event Creation (`/app/actions/events/create-event.js`)
- [x] Event Update (`/app/actions/events/update-event.js`)
- [x] Event Deletion (`/app/actions/events/delete-event.js`) 
- [x] Event Registration (`/app/actions/events/register-for-event.js`)
- [x] Event Attendance Management (`/app/actions/events/manage-attendance.js`)
- [x] Program Application (`/app/actions/programs/apply-to-program.js`)

## Entity Data Fetching Functions

### Contact & Profile
- [x] `getCurrentUserContact` - Get contact record for current user
- [x] `fetchContactById` - Get contact by ID
- [x] `fetchContactByEmail` - Get contact by email
- [x] `fetchContactByAuth0Id` - Get contact by Auth0 ID
- [x] `fetchParticipationByUserId` - Get user participation records

### Programs
- [x] `getActivePrograms` - Get all active programs
- [x] `getProgramWithCohorts` - Get program with its cohorts
- [x] `getProgramEvents` - Get events for a program
- [ ] `getUserPrograms` - Get programs for specific user
- [ ] `getProgramApplications` - Get applications for program
- [ ] `getUserProgramApplications` - Get user's applications

### Teams
- [x] `getUserTeams` - Get teams for a user
- [x] `getTeamWithMembers` - Get team with member details
- [x] `getTeamSubmissions` - Get submissions for a team
- [x] `getJoinableTeams` - Get teams user can join
- [ ] `getTeamInvites` - Get pending invites for a team

### Events
- [x] `getUpcomingEvents` - Get upcoming events
- [x] `getAllUpcomingEvents` - Get all upcoming events
- [x] `getPastEvents` - Get past events
- [x] `getContactEvents` - Get events user is registered for
- [x] `getProgramEvents` - Get events for a program
- [x] `getEventById` - Get single event by ID
- [x] `getEventAttendees` - Get attendees for an event

## Components with Data Fetching

- [x] `ProfileSection` - Display user profile data (in profile page)
- [x] `EducationSection` - Display education information (in profile page)
- [x] `ProgramCard` - Display program information (in programs page)
- [x] `CohortCard` - Display cohort information (in program detail page)
- [x] `ProgramOverviewSection` - Display program details (in program detail page)
- [x] `ProgramCohortsSection` - Display program cohorts (in program detail page)
- [x] `ProgramEventsSection` - Display program events (in program detail page)
- [x] `EventsList` - Display events in a grid (in events page)
- [x] `EventRegistrationButton` - Button for event registration
- [x] `AttendanceControls` - Controls for event attendance
- [x] `CheckInButton` - Button for attendee check-in
- [x] `ManualRegistrationForm` - Form for manual attendee registration
- [x] `QRCodeDisplay` - Display QR code for check-in
- [ ] `TeamCard` - Display team information
- [ ] `ApplicationsList` - Show program applications
- [ ] `SubmissionsList` - Show team submissions
- [ ] `MilestoneProgress` - Show progress on milestones

## Implementation Steps

For each page or component in the checklist:

1. **Data Assessment**
   - Identify what data is needed
   - Plan parallel data fetching strategy
   - Determine formatting requirements

2. **Server Component Implementation**
   - Create/update page with server component
   - Use appropriate data fetching functions
   - Implement Suspense boundaries
   - Add error handling

3. **Client Components Integration**
   - Determine which parts need interactivity
   - Create client components for interactive elements
   - Pass server data as props

4. **Testing**
   - Verify data is correctly fetched and displayed
   - Check performance with browser devtools
   - Test loading states with network throttling
   - Ensure hydration works correctly

## Prioritization

1. **High Priority**
   - ✅ Profile Page
   - ✅ Program Detail Page
   - ✅ Team Detail Page
   - ✅ Dashboard Layout & Sidebar

2. **Medium Priority**
   - ✅ Programs Listing
   - ✅ Teams Listing
   - ✅ Event Detail Page
   - ✅ Event Attendance Page

3. **Completed**
   - ✅ Events Listing
   - ✅ Core Navigation
   - ✅ Server Component Data Fetching
   - ✅ Event Management Components

4. **Remaining Tasks**
   - Team Creation Flow
   - Team Leaving Flow
   - Application Management
   - Milestone Progress Components

## Metrics to Track

- Bundle size reduction after migration
- Time to First Contentful Paint
- Server Component vs. Client Component ratio
- Number of client-side API calls eliminated

## Definition of Done

A page or component is considered fully migrated when:

- All data is fetched on the server using the new pattern
- No client-side API calls for initial data
- Proper Suspense boundaries are implemented
- Dynamic metadata is added where applicable
- Server actions are used for mutations
- Cache invalidation is properly implemented