"use client"

import Link from "next/link"
import { useRouter } from "next/router"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useState } from "react"
import ProfileMenuButton from "./ProfileMenuButton"

import { 
  Home,
  Compass,
  Users, 
  ExternalLink,
  LogOut,
  Menu,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from "./ui/sidebar"

const NewDashboardSidebar = ({ profile, onEditClick }) => {
  console.log("Profile in sidebar:", profile) // Add logging to debug
  const router = useRouter()
  const { user } = useUser()
  
  // Hide navigation links for now as requested
  const links = []
  
  const externalLinks = [
    {
      href: "https://connexions.xfoundry.org",
      label: "ConneXions Community",
      icon: <ExternalLink className="h-4 w-4" />
    },
    {
      href: "https://xfoundry.org",
      label: "xFoundry Website",
      icon: <ExternalLink className="h-4 w-4" />
    },
    {
      href: "/api/auth/logout",
      label: "Sign Out",
      icon: <LogOut className="h-4 w-4" />
    }
  ]

  return (
    <>
      {/* Mobile trigger is handled by SidebarTrigger */}
      <div className="md:hidden fixed left-4 top-3 z-40">
        <button 
          className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm border"
          onClick={() => {
            // Use a simple sheet toggle approach instead of SidebarProvider
            const sidebarEl = document.getElementById('mobile-sidebar')
            if (sidebarEl) {
              sidebarEl.style.transform = 'translateX(0)'
            }
          }}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-screen w-64 flex-col border-r bg-white fixed left-0 top-0 overflow-y-auto">
        <div className="flex h-full flex-col">
          <div className="px-6 py-3 border-b">
            <h2 className="text-xl font-bold tracking-tight text-primary">
              xFoundry Hub
            </h2>
          </div>
          
          {/* Profile Section */}
          {profile && <ProfileMenuButton user={user} profile={profile} onEditClick={onEditClick} />}
          
          {/* Navigation Links */}
          <div className="px-3 py-5">
            <p className="text-xs font-medium text-muted-foreground mb-2 pl-3">
              NAVIGATION
            </p>
            <div className="space-y-1">
              {links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    router.pathname === link.href || (link.href.startsWith('#') && router.asPath.includes(link.href))
                      ? "bg-muted font-medium text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  onClick={() => {
                    if (link.href.startsWith('#')) {
                      const element = document.getElementById(link.href.substring(1))
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' })
                      }
                    }
                  }}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* External Links */}
          <div className="px-3 py-2 border-t mt-auto">
            <p className="text-xs font-medium text-muted-foreground mb-2 pl-3">
              LINKS
            </p>
            <div className="space-y-1">
              {externalLinks.map((link) => (
                link.label === "Sign Out" ? (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {link.label}
                    {link.icon}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {link.label}
                    {link.icon}
                  </a>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile sidebar - hidden by default */}
      <div 
        id="mobile-sidebar"
        className="md:hidden fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-xl border-r transform -translate-x-full transition-transform duration-300 ease-in-out"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-6 py-3 border-b">
            <h2 className="text-xl font-bold tracking-tight text-primary">
              xFoundry Hub
            </h2>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={() => {
                const sidebarEl = document.getElementById('mobile-sidebar')
                if (sidebarEl) {
                  sidebarEl.style.transform = 'translateX(-100%)'
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Profile Section */}
          {profile && <ProfileMenuButton user={user} profile={profile} onEditClick={onEditClick} />}
          
          {/* Navigation Links */}
          <div className="px-3 py-5">
            <p className="text-xs font-medium text-muted-foreground mb-2 pl-3">
              NAVIGATION
            </p>
            <div className="space-y-1">
              {links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    router.pathname === link.href || (link.href.startsWith('#') && router.asPath.includes(link.href))
                      ? "bg-muted font-medium text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  onClick={() => {
                    const sidebarEl = document.getElementById('mobile-sidebar')
                    if (sidebarEl) {
                      sidebarEl.style.transform = 'translateX(-100%)'
                    }
                    if (link.href.startsWith('#')) {
                      const element = document.getElementById(link.href.substring(1))
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' })
                      }
                    }
                  }}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* External Links */}
          <div className="px-3 py-2 border-t mt-auto">
            <p className="text-xs font-medium text-muted-foreground mb-2 pl-3">
              LINKS
            </p>
            <div className="space-y-1">
              {externalLinks.map((link) => (
                link.label === "Sign Out" ? (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {link.label}
                    {link.icon}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {link.label}
                    {link.icon}
                  </a>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Overlay to close sidebar on mobile */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden hidden"
        id="sidebar-overlay"
        onClick={() => {
          const sidebarEl = document.getElementById('mobile-sidebar')
          const overlayEl = document.getElementById('sidebar-overlay')
          if (sidebarEl) {
            sidebarEl.style.transform = 'translateX(-100%)'
          }
          if (overlayEl) {
            overlayEl.classList.add('hidden')
          }
        }}
      ></div>
      
      {/* Add event listener to show overlay when sidebar opens */}
      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            const sidebarEl = document.getElementById('mobile-sidebar');
            const overlayEl = document.getElementById('sidebar-overlay');
            const menuBtn = document.querySelector('.md\\\\:hidden.fixed button');
            
            if (menuBtn) {
              menuBtn.addEventListener('click', function() {
                if (overlayEl) {
                  overlayEl.classList.remove('hidden');
                }
              });
            }
          });
        `
      }} />
    </>
  )
}

export default NewDashboardSidebar