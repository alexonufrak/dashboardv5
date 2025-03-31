# Protecting a Client Side Rendered (CSR) Page

This document outlines how to protect a Client Side Rendered (CSR) page in Next.js using Auth0.

## Using the useUser Hook

For client-side protection, the Auth0 Next.js SDK provides the `useUser()` hook which can be used to check authentication status and redirect accordingly:

```javascript
'use client';
// pages/protected-client.js or app/protected-client/page.js
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router'; // Pages Router
// or: import { useRouter } from 'next/navigation'; // App Router
import { useEffect } from 'react';

export default function ProtectedClientPage() {
  const { user, error, isLoading } = useUser();
  const router = useRouter();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login?returnTo=/protected-client');
    }
  }, [user, isLoading, router]);
  
  // Show loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  // Handle errors
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  
  // Show protected content if authenticated
  if (user) {
    return (
      <div>
        <h1>Protected Client Page</h1>
        <p>Hello, {user.name}!</p>
        <p>Email: {user.email}</p>
      </div>
    );
  }
  
  // Return null during redirect
  return null;
}
```

## Hydration Protection Pattern

For a better user experience, you can use a hybrid approach that handles the initial load server-side but maintains client-side reactivity:

```javascript
// app/profile/page.jsx
import ProfileClient from './client-component';
import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  // Check authentication server-side
  const session = await auth0.getSession();
  
  // Redirect if not authenticated
  if (!session) {
    redirect('/auth/login?returnTo=/profile');
  }
  
  // Pass the initial user data to the client component
  return <ProfileClient initialUser={session.user} />;
}

// app/profile/client-component.jsx
'use client';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfileClient({ initialUser }) {
  const { user, error, isLoading } = useUser();
  const router = useRouter();
  
  // Redirect if user logs out on the client
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login?returnTo=/profile');
    }
  }, [user, isLoading, router]);
  
  // Use the initial user data or the client-side data
  const currentUser = user || initialUser;
  
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  
  return (
    <div>
      <h1>Profile</h1>
      {currentUser ? (
        <>
          <p>Hello, {currentUser.name}!</p>
          <p>Email: {currentUser.email}</p>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
```

## Use with SWR or React Query

For data fetching in protected pages, you can combine the Auth0 SDK with data fetching libraries like SWR or React Query:

```javascript
'use client';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// Fetch user data from the API
const fetchUserData = async () => {
  const res = await fetch('/api/user/data');
  if (!res.ok) {
    throw new Error('Failed to fetch user data');
  }
  return res.json();
};

export default function ProtectedDataPage() {
  const { user, isLoading: authLoading } = useUser();
  const router = useRouter();
  
  // Only fetch data if authenticated
  const { data, isLoading: dataLoading, error } = useQuery({
    queryKey: ['userData'],
    queryFn: fetchUserData,
    enabled: !!user, // Only run query if user exists
  });
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?returnTo=/dashboard');
    }
  }, [user, authLoading, router]);
  
  // Handle loading states
  if (authLoading || dataLoading) {
    return <div>Loading...</div>;
  }
  
  // Handle errors
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  
  // Show protected content with user data
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.name}!</p>
      {data && (
        <div>
          <h2>Your Data</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

## Best Practices

1. Always implement both client and server-side protection for sensitive routes
2. Handle loading states gracefully to prevent UI flashes
3. Use the `enabled` option in React Query or conditional fetching in SWR to avoid unneeded API calls
4. Implement proper error handling for authentication failures
5. Consider using server components for the initial render of protected content where possible
6. Add appropriate redirects to maintain a smooth user experience