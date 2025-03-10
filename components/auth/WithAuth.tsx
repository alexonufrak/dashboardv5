import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router';
import { useEffect, ReactNode } from 'react';
import { Spinner } from '@heroui/react';
import EmailMismatchAlert from './EmailMismatchAlert';

interface WithAuthProps {
  children: ReactNode;
}

/**
 * Higher-order component to protect pages that require authentication
 * Redirects to login if user is not authenticated
 */
export default function WithAuth({ children }: WithAuthProps) {
  const { user, error, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!isLoading && !user) {
      router.push(`/login?returnTo=${encodeURIComponent(router.asPath)}`);
    }
  }, [user, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center p-6 max-w-md">
          <h2 className="text-2xl font-bold text-danger mb-4">Authentication Error</h2>
          <p className="text-default-600 mb-4">{error.message}</p>
          <button 
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // If authenticated, render children with email mismatch alert if needed
  if (user) {
    return (
      <>
        <EmailMismatchAlert />
        {children}
      </>
    );
  }

  // Default loading state (should not typically reach this)
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <Spinner size="lg" color="primary" />
    </div>
  );
}