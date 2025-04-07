'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Dashboard Client Wrapper - Client Component
 * Provides interactive elements for the dashboard
 */
export function DashboardClientWrapper({ userId }) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Simulate loading client-side data
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="mt-8 flex justify-center">
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/dashboard/programs">
          <Button variant="outline" size="lg">
            Browse Programs
          </Button>
        </Link>
        
        <Link href="/dashboard/profile">
          <Button size="lg">
            Update Profile
          </Button>
        </Link>
      </div>
    </div>
  );
}