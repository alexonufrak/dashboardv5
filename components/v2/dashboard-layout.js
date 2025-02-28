"use client";

import Head from "next/head";
import { SiteHeader } from "./site-header";
import { DashboardSidebarV2 } from "./dashboard-sidebar";
import { SidebarProvider, SidebarInset } from "../ui/sidebar";

export function DashboardLayoutV2({ 
  children, 
  title = "xFoundry Hub",
  profile,
  onEditClick
}) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="xFoundry Hub - Empowering education through technology" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="[--header-height:3.5rem]">
        <SidebarProvider className="flex min-h-screen flex-col">
          <SiteHeader />
          <div className="flex flex-1">
            <DashboardSidebarV2 profile={profile} onEditClick={onEditClick} />
            <SidebarInset className="bg-background">
              <div className="flex flex-1 flex-col">
                <div className="container max-w-6xl mx-auto p-4 md:p-6">
                  {children}
                </div>
                <footer className="border-t mt-auto py-6">
                  <div className="container max-w-6xl mx-auto px-4 md:px-6">
                    <p className="text-center text-sm text-muted-foreground">
                      © {new Date().getFullYear()} xFoundry Education Platform. All rights reserved.
                    </p>
                  </div>
                </footer>
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    </>
  );
}