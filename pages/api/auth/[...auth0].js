/**
 * NOTE: This file is no longer used in Auth0 v4.
 * 
 * Auth0 v4 handles authentication routes through middleware in middleware.js.
 * The functionality that was previously in afterCallback is now being moved to
 * custom handler functions within the auth0.js library.
 * 
 * See /lib/auth0.js for the implementation of custom handlers.
 */

export default function handler(req, res) {
  return res.status(404).json({ 
    error: 'This route is no longer active. Auth0 v4 uses middleware for authentication.'
  });
}