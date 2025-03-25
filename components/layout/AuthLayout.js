"use client"

import React from "react"
import Head from "next/head"
import { Toaster } from "sonner"
import Logo from "@/components/common/Logo"
import { ThemeToggle } from "@/components/theme-toggle"

/**
 * AuthLayout - A simple layout component for authentication-related pages
 * This layout doesn't depend on dashboard context and is suitable for login, signup,
 * and invitation acceptance pages
 */
const AuthLayout = ({ 
  children, 
  title = "xFoundry Hub",
  showLogo = true,
  showThemeToggle = true
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="xFoundry Hub - Empowering education through technology" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {showThemeToggle && (
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
      )}

      <div className="min-h-screen bg-background">
        {/* Main content */}
        <main className="flex-1 pt-4 pb-12">
          {showLogo && (
            <div className="flex justify-center mb-6 pt-8">
              <Logo variant="horizontal" color="auto" height={40} />
            </div>
          )}
          <div className="container max-w-6xl mx-auto px-4 md:px-6">
            {children}
          </div>
        </main>
      </div>
      
      <Toaster position="top-right" />
    </>
  )
}

export default AuthLayout