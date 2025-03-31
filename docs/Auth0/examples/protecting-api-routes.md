# Protecting API Routes with Auth0

This document outlines how to protect API routes in Next.js using Auth0.

## Basic API Route Protection

For basic API route protection, use the Auth0 client to validate the user's session:

```javascript
// pages/api/protected.js
import { auth0 } from "@/lib/auth0";

export default async function handler(req, res) {
  try {
    // Get Auth0 session and validate user is authenticated
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({
        error: 'Not authenticated'
      });
    }
    
    // Get user data from session
    const { user } = session;
    
    // Process the request based on method
    switch (req.method) {
      case 'GET':
        // Handle GET request
        return res.status(200).json({
          message: 'This is a protected API route',
          user: {
            email: user.email,
            name: user.name
          }
        });
      
      case 'POST':
        // Handle POST request
        return res.status(200).json({
          message: 'Data received successfully',
          receivedData: req.body
        });
      
      default:
        return res.status(405).json({
          error: 'Method not allowed',
          allowedMethods: ['GET', 'POST']
        });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
```

## API Route with Access Token Verification

For API routes that need to validate access tokens, especially when the API will be called from external clients:

```javascript
// pages/api/protected-with-token.js
import { auth0 } from "@/lib/auth0";

export default async function handler(req, res) {
  try {
    // Get Auth0 session
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({
        error: 'Not authenticated'
      });
    }
    
    // Get access token (will refresh if expired)
    try {
      const { accessToken } = await auth0.getAccessToken(req, res);
      
      // Use the access token to call an external API
      // Example:
      const apiResponse = await fetch('https://api.example.com/data', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const data = await apiResponse.json();
      
      return res.status(200).json({
        message: 'Data fetched from external API',
        data
      });
    } catch (tokenError) {
      console.error('Token error:', tokenError);
      return res.status(403).json({
        error: 'Failed to obtain access token',
        message: tokenError.message
      });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
```

## API Route with Role-Based Access Control (RBAC)

For API routes that need role-based access control:

```javascript
// pages/api/admin.js
import { auth0 } from "@/lib/auth0";

// Check if user has specific role
function hasRole(user, roleName) {
  // Auth0 permissions can be found in different places depending on your setup
  // Check in permissions array
  if (user.permissions && user.permissions.includes(roleName)) {
    return true;
  }
  
  // Check in roles array
  if (user[`https://your-namespace/roles`] && 
      user[`https://your-namespace/roles`].includes(roleName)) {
    return true;
  }
  
  // Check in app_metadata (custom claim)
  if (user.app_metadata && 
      user.app_metadata.roles && 
      user.app_metadata.roles.includes(roleName)) {
    return true;
  }
  
  return false;
}

export default async function handler(req, res) {
  try {
    // Get Auth0 session
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({
        error: 'Not authenticated'
      });
    }
    
    // Get user from session
    const { user } = session;
    
    // Check if user has admin role
    if (!hasRole(user, 'admin')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }
    
    // Process admin-only request
    return res.status(200).json({
      message: 'Admin API access granted',
      user: {
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
```

## POST Method Override for PATCH/PUT

For handling PATCH and PUT requests with SameSite cookie issues:

```javascript
// pages/api/user/profile.js
import { auth0 } from "@/lib/auth0";

export default async function handler(req, res) {
  try {
    // Get Auth0 session
    const session = await auth0.getSession(req, res);
    if (!session) {
      return res.status(401).json({
        error: 'Not authenticated'
      });
    }
    
    // Get user from session
    const { user } = session;
    
    // Handle request based on method
    switch (req.method) {
      case 'GET':
        return handleGetRequest(req, res, user);
      
      case 'PATCH':
      case 'PUT':
        return handleUpdateRequest(req, res, user);
      
      case 'POST':
        // Special case for POST with _method override
        const method = req.body._method?.toUpperCase();
        if (method === 'PATCH' || method === 'PUT') {
          return handleUpdateRequest(req, res, user);
        }
        
        // Regular POST handling
        return handleCreateRequest(req, res, user);
      
      default:
        return res.status(405).json({
          error: 'Method not allowed',
          allowedMethods: ['GET', 'POST', 'PATCH', 'PUT']
        });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Handler implementations
async function handleGetRequest(req, res, user) {
  // GET implementation
}

async function handleUpdateRequest(req, res, user) {
  // PATCH/PUT implementation
}

async function handleCreateRequest(req, res, user) {
  // POST implementation
}
```

## Best Practices

1. Always validate authentication status for protected API routes
2. Implement proper error handling with clear error messages
3. Use try/catch blocks to handle potential authentication issues
4. Set appropriate HTTP status codes for different error scenarios
5. Validate input data before processing requests
6. Implement rate limiting for API routes to prevent abuse
7. Use the POST method override pattern for PATCH/PUT requests if facing SameSite cookie issues
8. Log authentication errors for debugging, but avoid exposing sensitive details
9. Set appropriate cache control headers for API responses