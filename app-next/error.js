'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Error Page - Client Component
 * Displays when an error occurs in the application
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center space-y-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Something went wrong!</h2>
        <p className="text-muted-foreground">
          {error?.message || 'An unexpected error occurred'}
        </p>
        <div className="flex gap-2">
          <Button onClick={() => reset()} variant="default">
            Try Again
          </Button>
          <Button asChild variant="outline">
            <a href="/dashboard">Back to Dashboard</a>
          </Button>
        </div>
      </div>
    </div>
  );
}