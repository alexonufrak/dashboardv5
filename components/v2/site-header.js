"use client";

import Link from "next/link";
import { PanelLeft } from "lucide-react";
import { Button } from "../ui/button";
import { SidebarTrigger } from "../ui/sidebar";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-14 items-center px-4 sm:px-8">
        <div className="flex items-center md:hidden">
          <SidebarTrigger />
        </div>
        <div className="flex items-center gap-2">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <span className="hidden md:inline-block">xFoundry Hub</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end gap-4">
          <nav className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <a href="/api/auth/logout">Sign Out</a>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}