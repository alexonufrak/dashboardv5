# Protecting a Server Side Rendered (SSR) Page

This document outlines how to protect a Server Side Rendered (SSR) page in Next.js using Auth0.

## App Router Approach

For Next.js projects using the App Router, you can protect Server Components directly using the `auth0.getSession()` method:

```javascript
// app/protected/page.jsx
import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  // Get the session
  const session = await auth0.getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/auth/login?returnTo=/protected');
  }

  return (
    <div>
      <h1>Protected Page</h1>
      <p>Hello, {session.user.name}!</p>
      <p>Email: {session.user.email}</p>
    </div>
  );
}
```

## Pages Router Approach

For Next.js projects using the Pages Router, you can protect pages using `getServerSideProps`:

```javascript
// pages/protected.js
import { auth0 } from "@/lib/auth0";

export default function ProtectedPage({ user }) {
  return (
    <div>
      <h1>Protected Page</h1>
      <p>Hello, {user.name}!</p>
      <p>Email: {user.email}</p>
    </div>
  );
}

export const getServerSideProps = async ({ req, res }) => {
  // Get the session
  const session = await auth0.getSession(req);

  // Redirect to login if not authenticated
  if (!session) {
    return {
      redirect: {
        destination: '/auth/login?returnTo=/protected',
        permanent: false,
      }
    };
  }

  // Pass user data to the page
  return {
    props: {
      user: session.user,
    },
  };
};
```

## Using Middleware (Pages Router or App Router)

For a global approach that protects multiple pages, you can use middleware:

```javascript
// middleware.js
import { NextResponse } from 'next/server';
import { auth0 } from "@/lib/auth0";

// Define protected routes
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
];

export async function middleware(request) {
  // Get Auth0 response first (handles Auth0 routes)
  const authResponse = await auth0.middleware(request);
  if (authResponse) {
    return authResponse;
  }
  
  // Check if the route should be protected
  const { pathname } = request.nextUrl;
  const shouldProtect = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  if (shouldProtect) {
    // Get the user session
    const session = await auth0.getSession(request);
    
    // Redirect to login if not authenticated
    if (!session) {
      const returnTo = encodeURIComponent(pathname);
      return NextResponse.redirect(
        new URL(`/auth/login?returnTo=${returnTo}`, request.url)
      );
    }
  }
  
  // Continue to the page if authenticated or not a protected route
  return NextResponse.next();
}

// Configure which paths middleware will run on
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|fonts|images).*)',
  ],
};
```

## Best Practices

1. Always use a server-side check for authentication before rendering protected content
2. Include a `returnTo` parameter when redirecting to login so users return to the intended page
3. Add appropriate loading states while authentication is being checked
4. Handle error states gracefully
5. Keep sensitive data server-side and only pass necessary information to the client