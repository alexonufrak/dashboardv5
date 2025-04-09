import { Suspense } from 'react';
import { AppSidebarServer } from '@/components/layout/app-sidebar-server';

/**
 * Dashboard Layout - Server Component
 * Provides common layout for all dashboard pages using the shadcn sidebar
 */
export default async function DashboardLayout({ children }) {
  return (
    <AppSidebarServer>
      <Suspense fallback={<div className="p-4">Loading...</div>}>
        {children}
      </Suspense>
    </AppSidebarServer>
  );
}