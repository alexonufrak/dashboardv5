import { getCurrentUser } from '@/lib/app-router-auth';
import { redirect } from 'next/navigation';
import { AppSidebarClient } from './app-sidebar-client';
import { getActivePrograms } from '@/lib/app-router';

/**
 * AppSidebar Server Component
 * Handles fetching data and passes it to the client component
 */
export async function AppSidebarServer({ children }) {
  try {
    // Get user profile for dashboard
    const user = await getCurrentUser();
    
    // If no profile, redirect to login
    if (!user) {
      redirect('/auth/login');
    }
    
    // Fetch programs for sidebar
    const programs = await getActivePrograms();
    
    return (
      <AppSidebarClient 
        user={user} 
        programs={programs}
        isLoading={false}
      >
        {children}
      </AppSidebarClient>
    );
  } catch (error) {
    console.error('Sidebar error:', error);
    
    // If error occurs, redirect to login
    redirect('/auth/login');
  }
}