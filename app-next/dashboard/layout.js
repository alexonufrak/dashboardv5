import { Suspense } from 'react';
import { getUserProfile } from '@/lib/app-router-auth';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { redirect } from 'next/navigation';

/**
 * Dashboard Layout - Server Component
 * Provides common layout for all dashboard pages
 */
export default async function DashboardLayout({ children }) {
  try {
    // Get user profile for dashboard
    const profile = await getUserProfile();
    
    // If no profile, redirect to login
    if (!profile) {
      redirect('/auth/login');
    }
    
    return (
      <DashboardShell user={profile}>
        <Suspense fallback={<div className="p-4">Loading...</div>}>
          {children}
        </Suspense>
      </DashboardShell>
    );
  } catch (error) {
    console.error('Dashboard layout error:', error);
    
    // If error occurs, redirect to login
    redirect('/auth/login');
  }
}