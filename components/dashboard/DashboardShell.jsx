"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * DashboardShell Component
 * Provides the layout shell for the dashboard
 */
export function DashboardShell({ user, children }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="font-semibold">
              xFoundry Dashboard
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === "/dashboard" ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/programs"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname.startsWith("/dashboard/programs") ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                Programs
              </Link>
              <Link
                href="/dashboard/profile"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === "/dashboard/profile" ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                Profile
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {user?.firstName} {user?.lastName}
              </span>
              <Link
                href="/auth/logout"
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                Logout
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1">
        <div className="container py-6">
          {children}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t py-4 bg-background">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} xFoundry. All rights reserved.
          </p>
          <nav className="flex items-center gap-4">
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}