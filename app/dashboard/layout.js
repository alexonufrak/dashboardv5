import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/app-router-auth';
import { redirect } from 'next/navigation';
import { AppSidebarServer } from '@/components/layout/app-sidebar-server';

/**
 * Dashboard Layout - Server Component
 * Provides common layout for all dashboard pages mimicking the Pages Router layout
 */
export default async function DashboardLayout({ children }) {
  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  return (
    <AppSidebarServer>
      <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-background px-4">
          <h2 className="text-lg font-bold truncate">xFoundry Hub</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden md:block">
              {user?.firstName} {user?.lastName}
            </span>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Suspense fallback={
            <div className="space-y-6 w-full py-6">
              <div className="h-8 w-64 mb-6 bg-muted animate-pulse rounded"></div>
              <div className="h-48 w-full rounded-lg mb-6 bg-muted animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-32 rounded-lg bg-muted animate-pulse"></div>
                <div className="h-32 rounded-lg bg-muted animate-pulse"></div>
              </div>
            </div>
          }>
            {children}
          </Suspense>
        </main>
        <footer className="border-t py-4 bg-background">
          <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-center text-sm text-muted-foreground md:text-left">
              &copy; {new Date().getFullYear()} xFoundry. All rights reserved.
            </p>
            <nav className="flex items-center gap-4">
              <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                Terms
              </a>
              <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </a>
            </nav>
          </div>
        </footer>
      </div>
    </AppSidebarServer>
  );
}