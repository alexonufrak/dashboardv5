"use client";

import Head from "next/head";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";
import { Breadcrumbs } from "../Breadcrumbs";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

/**
 * Main Dashboard Layout component
 * Provides the overall structure for the unified dashboard
 */
export function DashboardLayout({ 
  children, 
  title = "xFoundry Dashboard",
  breadcrumbs = [],
  alert = null,
  profile,
}) {
  const { user, error, isLoading } = useUser();

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was an error loading your dashboard. Please try refreshing the page or 
            <Link href="/api/auth/login" className="ml-1 underline">
              login again
            </Link>.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="xFoundry Dashboard - Manage your programs and teams" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userProfile={profile} />
        
        <div className="flex flex-1">
          <DashboardSidebar userProfile={profile} />
          
          <main className="flex-1 overflow-auto">
            <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
              {/* Breadcrumbs navigation */}
              {breadcrumbs.length > 0 && (
                <Breadcrumbs items={breadcrumbs} />
              )}
              
              {/* Alert messages */}
              {alert && (
                <Alert variant={alert.variant || "default"}>
                  {alert.icon}
                  <AlertTitle>{alert.title}</AlertTitle>
                  <AlertDescription>{alert.description}</AlertDescription>
                </Alert>
              )}
              
              {/* Main content */}
              {children}
            </div>
          </main>
        </div>
        
        <footer className="border-t py-4 text-center text-sm text-muted-foreground">
          <div className="container">
            <p>© {new Date().getFullYear()} xFoundry Education Platform. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}