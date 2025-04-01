import { events, participation } from '@/lib/airtable/entities';
import { auth0 } from '@/lib/auth0';

/**
 * API endpoint to fetch upcoming events for a user
 * Combines global upcoming events with events from the user's programs and cohorts
 * Demonstrates using the new modular Airtable architecture
 * 
 * @param {object} req - Next.js request object
 * @param {object} res - Next.js response object
 */
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

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get general upcoming events (limit to 10)
    const upcomingEvents = await events.getUpcomingEvents(10);
    
    // Get user-specific events based on their program/cohort participation
    const userEvents = await events.getEventsByUser(user.sub);
    
    // Combine events and remove duplicates
    const allEvents = [...upcomingEvents, ...userEvents];
    
    // Deduplicate by ID
    const uniqueEvents = allEvents.reduce((acc, event) => {
      if (!acc[event.id]) {
        acc[event.id] = event;
      }
      return acc;
    }, {});
    
    // Sort events by start date/time
    const sortedEvents = Object.values(uniqueEvents).sort((a, b) => {
      return new Date(a.startDateTime) - new Date(b.startDateTime);
    });
    
    // Group events by program and type
    const eventsByProgram = sortedEvents.reduce((acc, event) => {
      const programId = event.programId || 'general';
      if (!acc[programId]) {
        acc[programId] = [];
      }
      acc[programId].push(event);
      return acc;
    }, {});
    
    const eventsByType = sortedEvents.reduce((acc, event) => {
      const type = event.type || 'General';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(event);
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      events: sortedEvents,
      eventsByProgram,
      eventsByType,
      count: sortedEvents.length
    });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return res.status(500).json({
      error: 'An error occurred while fetching upcoming events',
      message: error.message,
      details: error.details || {}
    });
  }
}